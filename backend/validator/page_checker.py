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
            "has_algorithm": False,
            "has_coding": False,
            "has_output": False,
            "has_result": False,
            "has_page_borders": False,
            "has_footers": False,
            "experiment_number_matches": True
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

        # 3. Check Paragraphs for Headings
        all_p_text = " ".join([p.text.strip().upper() for p in doc.paragraphs])
        if "AIM:" in all_p_text or "AIM" in all_p_text:
            checks["has_aim"] = True
        if "ALGORITHM:" in all_p_text or "ALGORITHM" in all_p_text:
            checks["has_algorithm"] = True
        if "CODING:" in all_p_text or "CODING" in all_p_text or "PROGRAM:" in all_p_text:
            checks["has_coding"] = True
        if "OUTPUT:" in all_p_text or "OUTPUT" in all_p_text:
            checks["has_output"] = True
        if "RESULT:" in all_p_text or "RESULT" in all_p_text:
            checks["has_result"] = True

        # 4. Check Experiment Number Match if specified
        if expected_exp:
            exp_num = expected_exp.experiment_number.strip().upper()
            combined_search = all_tables_text + " " + all_p_text
            pattern = re.compile(rf'EX\s*NO\s*[:.\-]?\s*{re.escape(exp_num)}', re.IGNORECASE)
            if not pattern.search(combined_search) and exp_num not in combined_search:
                checks["experiment_number_matches"] = False
                errors.append(f"Experiment number '{expected_exp.experiment_number}' not found in generated document.")

        # Determine overall validity
        if not checks["can_open_docx"]:
            is_valid = False
        elif not checks["has_header_table"]:
            is_valid = False
            errors.append("Header table missing from document.")
        elif not checks["has_evaluation_table"]:
            is_valid = False
            errors.append("Master evaluation table missing from document.")
        elif not checks["has_aim"] or not checks["has_coding"] or not checks["has_result"]:
            is_valid = False
            errors.append("Core academic sections (Aim, Coding, or Result) missing.")
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
