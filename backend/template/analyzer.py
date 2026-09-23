"""
Template Analyzer: Inspects an uploaded DOCX to extract layout, typography,
table structures (Header & Evaluation tables), footers, page borders, and existing experiments.
"""
import os
import re
import docx
from docx.shared import Inches, Pt
from typing import Dict, Any, List, Optional, Tuple

from ..models.schemas import TemplateConfig, AnalysisResult, PageDimensions, MarginConfig

class TemplateAnalyzer:
    @staticmethod
    def analyze_docx(file_path: str) -> AnalysisResult:
        if not os.path.exists(file_path):
            return AnalysisResult(
                success=False,
                filename=os.path.basename(file_path),
                warnings=[f"File not found: {file_path}"]
            )

        try:
            doc = docx.Document(file_path)
        except Exception as e:
            return AnalysisResult(
                success=False,
                filename=os.path.basename(file_path),
                warnings=[f"Failed to parse document: {str(e)}"]
            )

        warnings: List[str] = []
        filename = os.path.basename(file_path)

        # 1. Section dimensions & margins
        section = doc.sections[0] if doc.sections else None
        page_dim = PageDimensions(width=8.27, height=11.69)
        margins = MarginConfig(top=0.75, bottom=0.75, left=0.75, right=0.75)
        has_page_border = False

        if section:
            try:
                if section.page_width:
                    page_dim.width = round(section.page_width.inches, 2)
                if section.page_height:
                    page_dim.height = round(section.page_height.inches, 2)
                if section.top_margin:
                    margins.top = round(section.top_margin.inches, 2)
                if section.bottom_margin:
                    margins.bottom = round(section.bottom_margin.inches, 2)
                if section.left_margin:
                    margins.left = round(section.left_margin.inches, 2)
                if section.right_margin:
                    margins.right = round(section.right_margin.inches, 2)
            except Exception as e:
                warnings.append(f"Could not read exact section dimensions: {str(e)}")

            # Check page borders
            sectPr = section._sectPr
            if sectPr is not None:
                pgBorders = sectPr.find(docx.oxml.ns.qn('w:pgBorders'))
                if pgBorders is not None:
                    has_page_border = True

        # 2. Extract Footers (Student Name & Roll Number)
        footer_left = "ADARSH MENON"
        footer_right = "714025247005"
        student_name_detected = None
        register_number_detected = None

        if section and section.footer:
            footer = section.footer
            footer_text_blocks = []
            # Check footer tables first
            for f_tbl in footer.tables:
                for row in f_tbl.rows:
                    for cell in row.cells:
                        txt = cell.text.strip()
                        if txt:
                            footer_text_blocks.append(txt)
            # Check footer paragraphs
            for p in footer.paragraphs:
                txt = p.text.strip()
                if txt:
                    footer_text_blocks.append(txt)

            for text_block in footer_text_blocks:
                # Look for register/roll number (digits 6-15)
                roll_match = re.search(r'\b(\d{7,15})\b', text_block)
                if roll_match and not register_number_detected:
                    register_number_detected = roll_match.group(1)
                    footer_right = register_number_detected

                # Look for student name (words without digits)
                clean_name = re.sub(r'\b\d+\b', '', text_block).strip()
                if clean_name and len(clean_name) >= 3 and not student_name_detected:
                    # Avoid generic words
                    if not any(k in clean_name.lower() for k in ["page", "confidential", "draft"]):
                        student_name_detected = clean_name
                        footer_left = student_name_detected

        # 3. Detect Tables: Header Table & Evaluation Table
        header_table_xml = None
        evaluation_table_xml = None
        has_header_table = False
        has_evaluation_table = False

        for tbl in doc.tables:
            tbl_text = " ".join([cell.text.strip().upper() for row in tbl.rows for cell in row.cells])
            
            # Check for header table
            if not has_header_table and ("EX NO" in tbl_text or "EXPT NO" in tbl_text or "EXPERIMENT NO" in tbl_text):
                has_header_table = True
                try:
                    header_table_xml = tbl._tbl.xml
                except Exception as e:
                    warnings.append(f"Failed to serialize header table XML: {str(e)}")

            # Check for evaluation table
            if not has_evaluation_table and (
                "PROGRAM AND EXECUTION" in tbl_text or 
                "CLASS PERFORMANCE" in tbl_text or 
                ("VIVA" in tbl_text and "TOTAL" in tbl_text) or
                "MARKS" in tbl_text
            ):
                has_evaluation_table = True
                try:
                    evaluation_table_xml = tbl._tbl.xml
                except Exception as e:
                    warnings.append(f"Failed to serialize evaluation table XML: {str(e)}")

        # 4. Detect Fonts
        detected_fonts = set()
        for p in doc.paragraphs[:100]:
            for r in p.runs:
                if r.font and r.font.name:
                    detected_fonts.add(r.font.name)
        for tbl in doc.tables[:5]:
            for row in tbl.rows:
                for cell in row.cells:
                    for p in cell.paragraphs:
                        for r in p.runs:
                            if r.font and r.font.name:
                                detected_fonts.add(r.font.name)

        font_list = list(detected_fonts) if detected_fonts else ["Times New Roman", "Courier New"]
        primary_font = "Times New Roman"
        if any("Times" in f for f in font_list):
            primary_font = "Times New Roman"
        elif font_list:
            primary_font = font_list[0]

        # 5. Detect Existing Experiments
        detected_experiments = []
        # Search in tables (where header table resides)
        for tbl in doc.tables:
            for row in tbl.rows:
                for cell in row.cells:
                    m = re.search(r'EX\s*NO\s*[:.\-]?\s*([0-9A-Za-z.\-_]+)', cell.text, re.IGNORECASE)
                    if m:
                        exp_id = m.group(1).strip()
                        if exp_id and exp_id not in detected_experiments:
                            detected_experiments.append(exp_id)
        # Search in paragraphs as fallback
        for p in doc.paragraphs:
            m = re.search(r'(?:EX\s*NO|EXPT\s*NO|EXPERIMENT\s*NO)\s*[:.\-]?\s*([0-9A-Za-z.\-_]+)', p.text, re.IGNORECASE)
            if m:
                exp_id = m.group(1).strip()
                if exp_id and exp_id not in detected_experiments:
                    detected_experiments.append(exp_id)

        # 6. Page Estimation
        # Count explicit page breaks in XML
        xml_str = doc._element.xml
        page_break_count = xml_str.count('<w:br w:type="page"/>') + xml_str.count('w:type="page"')
        # Plus 1 for initial page
        total_pages = max(1, page_break_count + 1)
        if detected_experiments and total_pages < len(detected_experiments) * 4:
            # If 3 experiments and 4-page structure, estimate 12 pages
            total_pages = len(detected_experiments) * 4

        # 7. Construct TemplateConfig
        tmpl_config = TemplateConfig(
            id=os.path.splitext(filename)[0].lower().replace(" ", "_"),
            name=f"Template from {filename}",
            description="Calibrated laboratory record template",
            page_size=page_dim,
            margins=margins,
            has_page_border=has_page_border,
            font_family=primary_font,
            code_font_family="Times New Roman",
            title_font_size=14,
            heading_font_size=14,
            body_font_size=12,
            code_font_size=12,
            header_table_xml=header_table_xml,
            evaluation_table_xml=evaluation_table_xml,
            footer_left=footer_left,
            footer_right=footer_right,
            page_pairing="facing_pages",
            is_locked=True
        )

        return AnalysisResult(
            success=True,
            filename=filename,
            total_pages_estimated=total_pages,
            detected_experiments=detected_experiments,
            detected_fonts=font_list,
            has_page_border=has_page_border,
            has_evaluation_table=has_evaluation_table,
            has_header_table=has_header_table,
            student_name_detected=student_name_detected,
            register_number_detected=register_number_detected,
            template_config=tmpl_config,
            warnings=warnings
        )
