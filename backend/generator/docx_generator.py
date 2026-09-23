"""
DOCX Generator: Deterministic generation engine that constructs or appends
laboratory records according to the template specifications, with strict
protection of existing content and pixel-accurate facing-page layout.
"""
import os
import io
import base64
import hashlib
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls, qn
from typing import List, Optional

from ..models.schemas import ExperimentData, TemplateConfig
from ..layout.page_engine import PageEngine, ExperimentLayoutPlan
from .tables import TableManager

class DocxGenerator:
    @staticmethod
    def _apply_section_formatting(section, config: TemplateConfig, student_name: str, roll_no: str):
        """Applies page dimensions, margins, page borders, and running footers."""
        section.page_width = Inches(config.page_size.width)
        section.page_height = Inches(config.page_size.height)
        section.top_margin = Inches(config.margins.top)
        section.bottom_margin = Inches(config.margins.bottom)
        section.left_margin = Inches(config.margins.left)
        section.right_margin = Inches(config.margins.right)

        # Page Borders
        if config.has_page_border:
            sectPr = section._sectPr
            # Remove any existing borders
            existing_borders = sectPr.find(qn('w:pgBorders'))
            if existing_borders is not None:
                sectPr.remove(existing_borders)

            pgBorders_xml = f"""
            <w:pgBorders {nsdecls('w')} w:offsetFrom="page">
                <w:top w:val="single" w:sz="12" w:space="24" w:color="000000"/>
                <w:left w:val="single" w:sz="12" w:space="24" w:color="000000"/>
                <w:bottom w:val="single" w:sz="12" w:space="24" w:color="000000"/>
                <w:right w:val="single" w:sz="12" w:space="24" w:color="000000"/>
            </w:pgBorders>
            """
            sectPr.append(parse_xml(pgBorders_xml))

        # Footer
        footer = section.footer
        for p in footer.paragraphs:
            p.text = ""
        tbl_foot = footer.add_table(rows=1, cols=2, width=Inches(6.77))
        tbl_foot.alignment = WD_TABLE_ALIGNMENT.CENTER
        c_f0 = tbl_foot.cell(0, 0)
        c_f1 = tbl_foot.cell(0, 1)
        c_f0.width = Inches(3.38)
        c_f1.width = Inches(3.38)

        p_f0 = c_f0.paragraphs[0]
        p_f0.paragraph_format.space_before = Pt(0)
        p_f0.paragraph_format.space_after = Pt(0)
        r_f0 = p_f0.add_run(student_name)
        r_f0.font.name = config.font_family
        r_f0.font.size = Pt(11)
        r_f0.font.bold = True

        p_f1 = c_f1.paragraphs[0]
        p_f1.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p_f1.paragraph_format.space_before = Pt(0)
        p_f1.paragraph_format.space_after = Pt(0)
        r_f1 = p_f1.add_run(roll_no)
        r_f1.font.name = config.font_family
        r_f1.font.size = Pt(11)
        r_f1.font.bold = True

    @staticmethod
    def _add_heading(doc, text: str, font_family: str, font_size: int = 12):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(text)
        run.font.name = font_family
        run.font.size = Pt(font_size)
        run.font.bold = True
        return p

    @staticmethod
    def _add_body_paragraph(doc, text: str, font_family: str, font_size: int = 11):
        p = doc.add_paragraph()
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(text)
        run.font.name = font_family
        run.font.size = Pt(font_size)
        return p

    @staticmethod
    def _add_algorithm_steps(doc, steps: List[str], font_family: str):
        for idx, step in enumerate(steps, 1):
            p = doc.add_paragraph()
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            p.paragraph_format.left_indent = Inches(0.4)
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.line_spacing = 1.15
            run = p.add_run(f"{idx}. {step}")
            run.font.name = font_family
            run.font.size = Pt(11)

    @staticmethod
    def _add_code_block(doc, code_lines: List[str], code_font: str = "Times New Roman", font_size: int = 12):
        for line in code_lines:
            p = doc.add_paragraph()
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.05
            run = p.add_run(line if line else " ")
            # Strictly enforce Times New Roman 12 pt for all technical content
            run.font.name = "Times New Roman"
            run.font.size = Pt(12)

    @staticmethod
    def _add_output_block(doc, output_lines: List[str], font_family: str = "Times New Roman"):
        for line in output_lines:
            p = doc.add_paragraph()
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.1
            run = p.add_run(line if line else " ")
            run.font.name = font_family
            run.font.size = Pt(11)

    @staticmethod
    def _embed_images(doc, images: List[str]):
        """Embeds screenshot images safely scaled to fit printable page boundaries."""
        for img_item in images:
            try:
                if img_item.startswith("data:image") or ";base64," in img_item:
                    # Base64 string
                    b64_data = img_item.split(";base64,")[-1]
                    img_bytes = base64.b64decode(b64_data)
                    stream = io.BytesIO(img_bytes)
                    p = doc.add_paragraph()
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    p.paragraph_format.space_before = Pt(6)
                    p.paragraph_format.space_after = Pt(6)
                    doc.add_picture(stream, width=Inches(5.5))
                elif os.path.exists(img_item):
                    p = doc.add_paragraph()
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    p.paragraph_format.space_before = Pt(6)
                    p.paragraph_format.space_after = Pt(6)
                    doc.add_picture(img_item, width=Inches(5.5))
            except Exception as e:
                p_err = doc.add_paragraph()
                r_err = p_err.add_run(f"[Screenshot attached: {os.path.basename(img_item)}]")
                r_err.font.italic = True

    @classmethod
    def _render_experiment_pages(cls, doc: docx.Document, plan: ExperimentLayoutPlan, data: ExperimentData, config: TemplateConfig):
        """Renders the planned pages into the docx Document."""
        proc_heading = f"{data.procedure_heading or 'ALGORITHM'}:"
        code_heading = f"{data.code_heading or 'CODING'}:"

        for i, page in enumerate(plan.pages):
            if page.page_type == "EXP_START":
                # Page 1 (Right): Header Table, Aim, Algorithm/Procedure, Code/Commands Part 1
                TableManager.create_header_table(doc, data, config)
                cls._add_heading(doc, "AIM:", config.font_family, config.heading_font_size)
                cls._add_body_paragraph(doc, data.aim, config.font_family, config.body_font_size)
                cls._add_heading(doc, proc_heading, config.font_family, config.heading_font_size)
                cls._add_algorithm_steps(doc, page.algorithm_steps, config.font_family)
                cls._add_heading(doc, code_heading, config.font_family, config.heading_font_size)
                cls._add_code_block(doc, page.code_lines, "Times New Roman", 12)

            elif page.page_type == "OUTPUT":
                # Page 2 (Left): OUTPUT
                cls._add_heading(doc, "OUTPUT:", config.font_family, config.heading_font_size)
                if page.output_lines:
                    cls._add_output_block(doc, page.output_lines, config.font_family)
                if page.output_images:
                    cls._embed_images(doc, page.output_images)

            elif page.page_type == "EXP_CONT":
                # Page 3 (Right): Code continuation, Evaluation Table, Result
                if page.code_lines:
                    cls._add_code_block(doc, page.code_lines, "Times New Roman", 12)
                    p_spacer = doc.add_paragraph()
                    p_spacer.paragraph_format.space_before = Pt(6)

                TableManager.create_evaluation_table(doc, config)
                cls._add_heading(doc, "RESULT:", config.font_family, config.heading_font_size)
                cls._add_body_paragraph(doc, data.result, config.font_family, config.body_font_size)

            elif page.page_type == "BLANK_BACK":
                # Page 4 (Left): Blank or overflow
                if page.output_lines:
                    cls._add_heading(doc, "OUTPUT (CONTINUED):", config.font_family, config.heading_font_size)
                    cls._add_output_block(doc, page.output_lines, config.font_family)
                else:
                    p_blank = doc.add_paragraph()
                    p_blank.paragraph_format.space_before = Pt(200)

            # Add page break between pages except after the very last page
            if i < len(plan.pages) - 1:
                doc.add_page_break()

    @classmethod
    def generate_new_record(cls, data: ExperimentData, config: TemplateConfig, output_path: str) -> str:
        """Generates a complete new laboratory record from scratch."""
        doc = docx.Document()
        student_name = data.student_name or config.footer_left or "ADARSH MENON"
        roll_no = data.register_number or config.footer_right or "714025247005"

        cls._apply_section_formatting(doc.sections[0], config, student_name, roll_no)
        plan = PageEngine.plan_experiment(data, config)
        cls._render_experiment_pages(doc, plan, data, config)

        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        doc.save(output_path)
        return output_path

    @classmethod
    def continue_existing_record(cls, original_path: str, data: ExperimentData, config: TemplateConfig, output_path: str) -> str:
        """
        Continues an existing record by appending a new experiment at the end.
        Strictly preserves the original document bytes (verified via SHA-256).
        """
        if not os.path.exists(original_path):
            raise FileNotFoundError(f"Original record not found at: {original_path}")

        # Compute initial hash of original file
        with open(original_path, "rb") as f:
            original_hash_before = hashlib.sha256(f.read()).hexdigest()

        # Load existing document
        doc = docx.Document(original_path)

        # Append page break after existing content
        doc.add_page_break()

        # Plan the new experiment
        plan = PageEngine.plan_experiment(data, config)

        # Render the new experiment pages
        cls._render_experiment_pages(doc, plan, data, config)

        # Save to output_path (never overwriting original)
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        doc.save(output_path)

        # Verify original file was strictly untouched
        with open(original_path, "rb") as f:
            original_hash_after = hashlib.sha256(f.read()).hexdigest()

        if original_hash_before != original_hash_after:
            raise RuntimeError("CRITICAL INTEGRITY FAILURE: Original document was modified during continuation!")

        return output_path
