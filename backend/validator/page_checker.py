"""
Page Checker: Validates generated DOCX files for XML integrity, required sections,
experiment numbering match, marks table presence, and blank page anomalies.
"""
import os
import re
import docx
from typing import Dict, Any, List, Optional
from ..models.schemas import ValidationReport, ExperimentData

class PageChecker:
    @staticmethod
    def validate_document(docx_path: str, expected_exp: Optional[ExperimentData] = None) -> ValidationReport:
        if not os.path.exists(docx_path):
            return ValidationReport(
                is_valid=False,
                checks={},
                errors=[f"File does not exist: {docx_path}"],
                warnings=[]
            )

        checks = {
            "can_open_docx": False,
            "has_header_table": False,
            "has_evaluation_table": False,
            "has_aim": False,
            "has_procedure": False,
            "has_coding": False,
            "has_output": False,
            "has_result": False,
            "has_page_borders": False,
            "has_footers": False,
            "coding_font_is_times_new_roman": True,
            "coding_size_is_12pt": True,
            "experiment_number_matches": True,
            "no_instruction_leakage": True
        }
        errors: List[str] = []
        warnings: List[str] = []

        try:
            doc = docx.Document(docx_path)
            checks["can_open_docx"] = True
        except Exception as e:
            errors.append(f"Failed to open DOCX: {str(e)}")
            return ValidationReport(is_valid=False, checks=checks, errors=errors, warnings=warnings)

        # 1. Section properties & Page Border
        if doc.sections:
            section = doc.sections[0]
            sectPr = section._sectPr
            if sectPr is not None and sectPr.find(docx.oxml.ns.qn('w:pgBorders')) is not None:
                checks["has_page_borders"] = True

            # Footer
            if section.footer and (section.footer.paragraphs or section.footer.tables):
                checks["has_footers"] = True

        # 2. Check Tables
        all_tables_text = ""
        for tbl in doc.tables:
            tbl_txt = " ".join([c.text.strip().upper() for r in tbl.rows for c in r.cells])
            all_tables_text += " " + tbl_txt
            if "EX NO" in tbl_txt or "EXPT NO" in tbl_txt:
                checks["has_header_table"] = True
            if "PROGRAM AND EXECUTION" in tbl_txt or "CLASS PERFORMANCE" in tbl_txt or "VIVA" in tbl_txt:
                checks["has_evaluation_table"] = True

        # 3. Check Paragraphs for Generalized Headings
        all_p_text = " ".join([p.text.strip().upper() for p in doc.paragraphs])
        if "AIM:" in all_p_text or "AIM" in all_p_text:
            checks["has_aim"] = True

        proc_headings = ["ALGORITHM", "PROCEDURE", "METHODOLOGY", "STEPS"]
        if expected_exp and expected_exp.procedure_heading:
            proc_headings.append(expected_exp.procedure_heading.strip().upper())
        if any(h in all_p_text for h in proc_headings):
            checks["has_procedure"] = True

        code_headings = [
            "CODING", "PROGRAM", "SQL QUERY", "SQL QUERIES", "COMMANDS",
            "SHELL SCRIPT", "SOURCE CODE", "QUERY", "QUERIES", "CODE"
        ]
        if expected_exp and expected_exp.code_heading:
            code_headings.append(expected_exp.code_heading.strip().upper())
        if any(h in all_p_text for h in code_headings):
            checks["has_coding"] = True

        if "OUTPUT:" in all_p_text or "OUTPUT" in all_p_text:
            checks["has_output"] = True
        if "RESULT:" in all_p_text or "RESULT" in all_p_text:
            checks["has_result"] = True

        # 4. Check Coding Font & Size (Times New Roman 12pt)
        # Scan paragraphs after CODING/PROGRAM/SQL heading up to RESULT/Evaluation table
        in_code_section = False
        for p in doc.paragraphs:
            txt = p.text.strip().upper()
            if any(h in txt for h in code_headings):
                in_code_section = True
                continue
            if in_code_section and any(h in txt for h in ["RESULT:", "OUTPUT:"]):
                in_code_section = False
                continue

            if in_code_section and p.runs:
                for r in p.runs:
                    if r.text.strip():
                        if r.font.name and "Times" not in r.font.name:
                            checks["coding_font_is_times_new_roman"] = False
                            warnings.append(f"Coding font was '{r.font.name}' instead of Times New Roman.")
                            break
                        if r.font.size and round(r.font.size.pt) != 12:
                            checks["coding_size_is_12pt"] = False
                            warnings.append(f"Coding size was {r.font.size.pt}pt instead of 12pt.")
                            break

        # 5. Check Experiment Number Match if specified
        if expected_exp:
            exp_num = expected_exp.experiment_number.strip().upper()
            combined_search = all_tables_text + " " + all_p_text
            pattern = re.compile(rf'EX\s*NO\s*[:.\-]?\s*{re.escape(exp_num)}', re.IGNORECASE)
            if not pattern.search(combined_search) and exp_num not in combined_search:
                checks["experiment_number_matches"] = False
                errors.append(f"Experiment number '{expected_exp.experiment_number}' not found in generated document.")

        # 6. Check for Prompt & System Instruction Leakage
        forbidden_phrases = [
            "MASTER UPDATE PROMPT",
            "FINAL MASTER EXECUTION PROMPT",
            "PROJECT UPDATE — EXPERIMENT HEADER",
            "YOU ARE MODIFYING THE EXISTING",
            "YOU ARE WORKING ON THE EXISTING",
            "DO NOT REBUILD THE PROJECT",
            "ANTIGRAVITY INSTRUCTIONS",
            "DEVELOPER INSTRUCTIONS",
            "IMPLEMENTATION INSTRUCTIONS",
            "SYSTEM PROMPT"
        ]
        full_doc_text = (all_tables_text + " " + all_p_text).upper()
        found_leaks = [phrase for phrase in forbidden_phrases if phrase in full_doc_text]
        if found_leaks:
            checks["no_instruction_leakage"] = False
            errors.append(f"Prompt/instruction leakage detected in document: found '{found_leaks[0]}'")

        # Determine overall validity
        if not checks["can_open_docx"]:
            is_valid = False
        elif not checks["no_instruction_leakage"]:
            is_valid = False
        elif not checks["has_header_table"]:
            is_valid = False
            errors.append("Header table missing from document.")
        elif not checks["has_evaluation_table"]:
            is_valid = False
            errors.append("Master evaluation table missing from document.")
        elif not checks["has_aim"] or not checks["has_coding"] or not checks["has_result"]:
            is_valid = False
            errors.append("Core academic sections (Aim, Coding/Program, or Result) missing.")
        else:
            is_valid = True

        if not checks["has_page_borders"]:
            warnings.append("Page borders not detected in document section properties.")

        return ValidationReport(
            is_valid=is_valid,
            checks=checks,
            errors=errors,
            warnings=warnings
        )
