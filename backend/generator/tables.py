"""
Table Manager: Clones or creates Master Evaluation Tables and Header Tables
with exact borders, widths, alignments, and typography.
Enforces fixed table layouts so external marks columns never shift or distort.
"""
import copy
import docx
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls, qn

from ..models.schemas import ExperimentData, TemplateConfig

def set_cell_width(cell, width_dxa: int):
    """Sets explicit cell width in dxa (1 inch = 1440 dxa)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcW = tcPr.find(qn('w:tcW'))
    if tcW is not None:
        tcPr.remove(tcW)
    tcW_elem = parse_xml(f'<w:tcW {nsdecls("w")} w:w="{width_dxa}" w:type="dxa"/>')
    tcPr.append(tcW_elem)

def set_cell_v_align(cell, align: str = "center"):
    """Sets cell vertical alignment (top, center, bottom)."""
    tcPr = cell._tc.get_or_add_tcPr()
    vAlign = tcPr.find(qn('w:vAlign'))
    if vAlign is not None:
        tcPr.remove(vAlign)
    vAlign_elem = parse_xml(f'<w:vAlign {nsdecls("w")} w:val="{align}"/>')
    tcPr.append(vAlign_elem)

def apply_cell_border(cell, **kwargs):
    """Applies clean single borders to a cell."""
    tcPr = cell._tc.get_or_add_tcPr()
    existing_borders = tcPr.find(qn('w:tcBorders'))
    if existing_borders is not None:
        tcPr.remove(existing_borders)
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
        """Creates the 2x2 Header Table with accurate styling, borders, and fixed column widths."""
        tbl = doc.add_table(rows=2, cols=2)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False

        # Set fixed table layout in tblPr
        tblPr = tbl._tbl.tblPr
        tblLayout = tblPr.find(qn('w:tblLayout'))
        if tblLayout is not None:
            tblPr.remove(tblLayout)
        tblPr.append(parse_xml(f'<w:tblLayout {nsdecls("w")} w:type="fixed"/>'))

        # Set table grid: Col 0 = 2.0" (2880 dxa), Col 1 = 4.77" (6868 dxa)
        col0_dxa = 2880
        col1_dxa = 6868
        tblGrid = parse_xml(f"""
            <w:tblGrid {nsdecls('w')}>
                <w:gridCol w:w="{col0_dxa}"/>
                <w:gridCol w:w="{col1_dxa}"/>
            </w:tblGrid>
        """)
        tbl._tbl.append(tblGrid)

        # Row 0: Ex No & Title
        c00 = tbl.cell(0, 0)
        set_cell_width(c00, col0_dxa)
        set_cell_v_align(c00, "center")
        apply_cell_border(c00)
        p00 = c00.paragraphs[0]
        p00.paragraph_format.space_before = Pt(4)
        p00.paragraph_format.space_after = Pt(4)
        r00 = p00.add_run(f"EX NO:{data.experiment_number}")
        r00.font.name = config.font_family
        r00.font.size = Pt(11)
        r00.font.bold = True

        c01 = tbl.cell(0, 1)
        set_cell_width(c01, col1_dxa)
        set_cell_v_align(c01, "center")
        apply_cell_border(c01)
        p01 = c01.paragraphs[0]
        p01.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p01.paragraph_format.space_before = Pt(4)
        p01.paragraph_format.space_after = Pt(2)
        r01 = p01.add_run(data.title.upper())
        r01.font.name = config.font_family
        r01.font.size = Pt(config.title_font_size)
        r01.font.bold = True

        # Row 1: Date & Subtitle
        c10 = tbl.cell(1, 0)
        set_cell_width(c10, col0_dxa)
        set_cell_v_align(c10, "center")
        apply_cell_border(c10)
        p10 = c10.paragraphs[0]
        p10.paragraph_format.space_before = Pt(4)
        p10.paragraph_format.space_after = Pt(4)
        r10 = p10.add_run(f"DATE:{data.date or ''}")
        r10.font.name = config.font_family
        r10.font.size = Pt(11)
        r10.font.bold = True

        c11 = tbl.cell(1, 1)
        set_cell_width(c11, col1_dxa)
        set_cell_v_align(c11, "center")
        apply_cell_border(c11)
        p11 = c11.paragraphs[0]
        p11.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p11.paragraph_format.space_before = Pt(2)
        p11.paragraph_format.space_after = Pt(4)
        subtitle_text = data.subtitle.upper() if data.subtitle else ""
        r11 = p11.add_run(subtitle_text)
        r11.font.name = config.font_family
        r11.font.size = Pt(config.title_font_size)
        r11.font.bold = True

        p_spacer = doc.add_paragraph()
        p_spacer.paragraph_format.space_before = Pt(4)
        p_spacer.paragraph_format.space_after = Pt(4)
        return tbl

    @staticmethod
    def create_evaluation_table(doc: docx.Document, config: TemplateConfig):
        """
        Creates or clones the Master Evaluation Marks Table.
        Features a fixed 2-column layout:
        - Column 1: Evaluation Criterion (2.5 inches = 3600 dxa)
        - Column 2: External Marks / Sign (1.5 inches = 2160 dxa)
        Table layout is strictly fixed so the external marks column never shifts or stretches.
        """
        tbl = doc.add_table(rows=4, cols=2)
        tbl.alignment = WD_TABLE_ALIGNMENT.RIGHT
        tbl.autofit = False

        # Enforce fixed table layout in tblPr
        tblPr = tbl._tbl.tblPr
        tblLayout = tblPr.find(qn('w:tblLayout'))
        if tblLayout is not None:
            tblPr.remove(tblLayout)
        tblPr.append(parse_xml(f'<w:tblLayout {nsdecls("w")} w:type="fixed"/>'))

        # Explicit table grid
        col0_dxa = 3600  # 2.5 inches
        col1_dxa = 2160  # 1.5 inches (External marks column)
        tblGrid = parse_xml(f"""
            <w:tblGrid {nsdecls('w')}>
                <w:gridCol w:w="{col0_dxa}"/>
                <w:gridCol w:w="{col1_dxa}"/>
            </w:tblGrid>
        """)
        existing_grid = tbl._tbl.find(qn('w:tblGrid'))
        if existing_grid is not None:
            tbl._tbl.remove(existing_grid)
        tblPr.addnext(tblGrid)

        labels = ["PROGRAM AND EXECUTION", "CLASS PERFORMANCE", "VIVA", "TOTAL"]

        for r_idx, label in enumerate(labels):
            row = tbl.rows[r_idx]
            
            # Row height at least 20pt (400 dxa)
            trPr = row._tr.get_or_add_trPr()
            trPr.append(parse_xml(f'<w:trHeight {nsdecls("w")} w:val="400" w:hRule="atLeast"/>'))

            # Cell 0: Criterion
            c0 = row.cells[0]
            set_cell_width(c0, col0_dxa)
            set_cell_v_align(c0, "center")
            apply_cell_border(c0)
            p0 = c0.paragraphs[0]
            p0.paragraph_format.space_before = Pt(3)
            p0.paragraph_format.space_after = Pt(3)
            r0 = p0.add_run(label)
            r0.font.name = config.font_family
            r0.font.size = Pt(10)
            r0.font.bold = True

            # Cell 1: External Marks / Signature space
            c1 = row.cells[1]
            set_cell_width(c1, col1_dxa)
            set_cell_v_align(c1, "center")
            apply_cell_border(c1)
            p1 = c1.paragraphs[0]
            p1.paragraph_format.space_before = Pt(3)
            p1.paragraph_format.space_after = Pt(3)

        p_spacer = doc.add_paragraph()
        p_spacer.paragraph_format.space_before = Pt(6)
        p_spacer.paragraph_format.space_after = Pt(4)
        return tbl
