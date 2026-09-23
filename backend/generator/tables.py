"""
Table Manager: Clones or creates Master Evaluation Tables and Header Tables
with exact borders, widths, alignments, and typography.
"""
import copy
import docx
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls, qn

from ..models.schemas import ExperimentData, TemplateConfig

def apply_cell_border(cell, **kwargs):
    """Applies thin single borders to a cell."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(f"""
        <w:tcBorders {nsdecls('w')}>
            <w:top w:val="{kwargs.get('top', 'single')}" w:sz="{kwargs.get('sz', '6')}" w:space="0" w:color="{kwargs.get('color', '000000')}"/>
            <w:left w:val="{kwargs.get('left', 'single')}" w:sz="{kwargs.get('sz', '6')}" w:space="0" w:color="{kwargs.get('color', '000000')}"/>
            <w:bottom w:val="{kwargs.get('bottom', 'single')}" w:sz="{kwargs.get('sz', '6')}" w:space="0" w:color="{kwargs.get('color', '000000')}"/>
            <w:right w:val="{kwargs.get('right', 'single')}" w:sz="{kwargs.get('sz', '6')}" w:space="0" w:color="{kwargs.get('color', '000000')}"/>
        </w:tcBorders>
    """)
    tcPr.append(tcBorders)

class TableManager:
    @staticmethod
    def create_header_table(doc: docx.Document, data: ExperimentData, config: TemplateConfig):
        """Creates the 2x2 Header Table with accurate styling and borders."""
        tbl = doc.add_table(rows=2, cols=2)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False

        col_widths = [Inches(2.0), Inches(4.77)]
        for row in tbl.rows:
            for idx, width in enumerate(col_widths):
                row.cells[idx].width = width

        # Row 0: Ex No & Title
        c00 = tbl.cell(0, 0)
        p00 = c00.paragraphs[0]
        p00.paragraph_format.space_before = Pt(4)
        p00.paragraph_format.space_after = Pt(4)
        r00 = p00.add_run(f"EX NO:{data.experiment_number}")
        r00.font.name = config.font_family
        r00.font.size = Pt(11)
        r00.font.bold = True
        apply_cell_border(c00)

        c01 = tbl.cell(0, 1)
        p01 = c01.paragraphs[0]
        p01.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p01.paragraph_format.space_before = Pt(4)
        p01.paragraph_format.space_after = Pt(2)
        r01 = p01.add_run(data.title.upper())
        r01.font.name = config.font_family
        r01.font.size = Pt(config.title_font_size)
        r01.font.bold = True
        apply_cell_border(c01)

        # Row 1: Date & Subtitle
        c10 = tbl.cell(1, 0)
        p10 = c10.paragraphs[0]
        p10.paragraph_format.space_before = Pt(4)
        p10.paragraph_format.space_after = Pt(4)
        r10 = p10.add_run(f"DATE:{data.date or ''}")
        r10.font.name = config.font_family
        r10.font.size = Pt(11)
        r10.font.bold = True
        apply_cell_border(c10)

        c11 = tbl.cell(1, 1)
        p11 = c11.paragraphs[0]
        p11.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p11.paragraph_format.space_before = Pt(2)
        p11.paragraph_format.space_after = Pt(4)
        subtitle_text = data.subtitle.upper() if data.subtitle else ""
        r11 = p11.add_run(subtitle_text)
        r11.font.name = config.font_family
        r11.font.size = Pt(config.title_font_size)
        r11.font.bold = True
        apply_cell_border(c11)

        p_spacer = doc.add_paragraph()
        p_spacer.paragraph_format.space_before = Pt(4)
        p_spacer.paragraph_format.space_after = Pt(4)
        return tbl

    @staticmethod
    def create_evaluation_table(doc: docx.Document, config: TemplateConfig):
        """Creates or clones the Master Evaluation Marks Table."""
        # If evaluation table XML is cached, we can clone it directly
        if config.evaluation_table_xml:
            try:
                elem = parse_xml(config.evaluation_table_xml)
                doc._body._element.append(elem)
                p_spacer = doc.add_paragraph()
                p_spacer.paragraph_format.space_before = Pt(6)
                p_spacer.paragraph_format.space_after = Pt(4)
                return
            except Exception:
                pass  # Fall back to programmatic generation

        # Deterministic master table generation
        tbl = doc.add_table(rows=4, cols=2)
        tbl.alignment = WD_TABLE_ALIGNMENT.RIGHT
        tbl.autofit = False

        col_widths = [Inches(2.5), Inches(1.5)]
        labels = ["PROGRAM AND EXECUTION", "CLASS PERFORMANCE", "VIVA", "TOTAL"]

        for r_idx, label in enumerate(labels):
            row = tbl.rows[r_idx]
            row.cells[0].width = col_widths[0]
            row.cells[1].width = col_widths[1]

            c0 = row.cells[0]
            p0 = c0.paragraphs[0]
            p0.paragraph_format.space_before = Pt(3)
            p0.paragraph_format.space_after = Pt(3)
            r0 = p0.add_run(label)
            r0.font.name = config.font_family
            r0.font.size = Pt(10)
            r0.font.bold = True
            apply_cell_border(c0)

            c1 = row.cells[1]
            p1 = c1.paragraphs[0]
            p1.paragraph_format.space_before = Pt(3)
            p1.paragraph_format.space_after = Pt(3)
            apply_cell_border(c1)

        p_spacer = doc.add_paragraph()
        p_spacer.paragraph_format.space_before = Pt(6)
        p_spacer.paragraph_format.space_after = Pt(4)
        return tbl
