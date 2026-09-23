"""
Script to generate the pixel-accurate golden reference laboratory record (.docx)
extracted from the 12-page user PDF.
"""
import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def apply_cell_border(cell, **kwargs):
    """
    Apply borders to a given table cell.
    kwargs: top, bottom, left, right.
    values: dict(val="single", sz="4", color="000000", space="0")
    """
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

def add_header_table(doc, ex_no, date, title, subtitle):
    """Creates the 2x2 Header Table matching the PDF template exactly."""
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
    r00 = p00.add_run(f"EX NO:{ex_no}")
    r00.font.name = "Times New Roman"
    r00.font.size = Pt(11)
    r00.font.bold = True
    apply_cell_border(c00)

    c01 = tbl.cell(0, 1)
    p01 = c01.paragraphs[0]
    p01.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p01.paragraph_format.space_before = Pt(4)
    p01.paragraph_format.space_after = Pt(2)
    r01 = p01.add_run(title.upper())
    r01.font.name = "Times New Roman"
    r01.font.size = Pt(12)
    r01.font.bold = True
    apply_cell_border(c01)

    # Row 1: Date & Subtitle
    c10 = tbl.cell(1, 0)
    p10 = c10.paragraphs[0]
    p10.paragraph_format.space_before = Pt(4)
    p10.paragraph_format.space_after = Pt(4)
    r10 = p10.add_run(f"DATE:{date}")
    r10.font.name = "Times New Roman"
    r10.font.size = Pt(11)
    r10.font.bold = True
    apply_cell_border(c10)

    c11 = tbl.cell(1, 1)
    p11 = c11.paragraphs[0]
    p11.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p11.paragraph_format.space_before = Pt(2)
    p11.paragraph_format.space_after = Pt(4)
    r11 = p11.add_run(subtitle.upper())
    r11.font.name = "Times New Roman"
    r11.font.size = Pt(12)
    r11.font.bold = True
    apply_cell_border(c11)

    # Add spacing after table
    p_spacer = doc.add_paragraph()
    p_spacer.paragraph_format.space_before = Pt(4)
    p_spacer.paragraph_format.space_after = Pt(4)
    return tbl

def add_evaluation_table(doc):
    """Creates the 4-row Master Evaluation Marks Table."""
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
        r0.font.name = "Times New Roman"
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

def add_heading(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(4)
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(12)
    run.font.bold = True
    return p

def add_body_paragraph(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(11)
    return p

def add_algorithm_steps(doc, steps):
    for idx, step in enumerate(steps, 1):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.4)
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(f"{idx}. {step}")
        run.font.name = "Times New Roman"
        run.font.size = Pt(11)

def add_code_block(doc, code_lines):
    for line in code_lines:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.05
        run = p.add_run(line if line else " ")
        run.font.name = "Courier New"
        run.font.size = Pt(10)

def add_output_block(doc, output_lines):
    for line in output_lines:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.1
        run = p.add_run(line if line else " ")
        run.font.name = "Times New Roman"
        run.font.size = Pt(11)

def create_reference_document(output_path):
    doc = docx.Document()
    
    # 1. Section margins and Page Border
    section = doc.sections[0]
    section.page_width = Inches(8.27)
    section.page_height = Inches(11.69)
    section.top_margin = Inches(0.75)
    section.bottom_margin = Inches(0.75)
    section.left_margin = Inches(0.75)
    section.right_margin = Inches(0.75)
    
    sectPr = section._sectPr
    pgBorders_xml = f"""
    <w:pgBorders {nsdecls('w')} w:offsetFrom="page">
        <w:top w:val="single" w:sz="12" w:space="24" w:color="000000"/>
        <w:left w:val="single" w:sz="12" w:space="24" w:color="000000"/>
        <w:bottom w:val="single" w:sz="12" w:space="24" w:color="000000"/>
        <w:right w:val="single" w:sz="12" w:space="24" w:color="000000"/>
    </w:pgBorders>
    """
    sectPr.append(parse_xml(pgBorders_xml))
    
    # Running Footer: ADARSH MENON (left)       714025247005 (right)
    footer = section.footer
    p_footer = footer.paragraphs[0]
    p_footer.text = ""
    # We use a 2-column borderless table in the footer to ensure rock-solid left & right alignment
    tbl_foot = footer.add_table(rows=1, cols=2, width=Inches(6.77))
    tbl_foot.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_f0 = tbl_foot.cell(0, 0)
    c_f1 = tbl_foot.cell(0, 1)
    c_f0.width = Inches(3.38)
    c_f1.width = Inches(3.38)
    
    p_f0 = c_f0.paragraphs[0]
    p_f0.paragraph_format.space_before = Pt(0)
    p_f0.paragraph_format.space_after = Pt(0)
    r_f0 = p_f0.add_run("ADARSH MENON")
    r_f0.font.name = "Times New Roman"
    r_f0.font.size = Pt(11)
    r_f0.font.bold = True
    
    p_f1 = c_f1.paragraphs[0]
    p_f1.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_f1.paragraph_format.space_before = Pt(0)
    p_f1.paragraph_format.space_after = Pt(0)
    r_f1 = p_f1.add_run("714025247005")
    r_f1.font.name = "Times New Roman"
    r_f1.font.size = Pt(11)
    r_f1.font.bold = True

    # ==========================================
    # EXPERIMENT 1.A (Pages 1 to 4)
    # ==========================================
    # Page 1: Header, AIM, ALGORITHM, CODING part 1
    add_header_table(doc, "1.A", "  ", "COMPREHENSION", "LIST COMPREHENSION")
    add_heading(doc, "AIM:")
    add_body_paragraph(doc, "To create two matrices using user input and find the highest and lowest elements from both matrices using functions and list comprehension.")
    add_heading(doc, "ALGORITHM:")
    add_algorithm_steps(doc, [
        "Define a function to get the matrix dimensions and elements from the user.",
        "Define a function to find the highest and lowest elements.",
        "Use list comprehension to create the matrix.",
        "Pass both matrices to the function for finding the highest and lowest values.",
        "Display the two matrices.",
        "Display the highest and lowest values."
    ])
    add_heading(doc, "CODING:")
    code_1a_p1 = [
        "def get_matrix(rows, cols, name):",
        "    print(f\"\\nEnter elements of {name}:\")",
        "    matrix = [",
        "        [int(input(f\"Enter element [{i}][{j}]: \"))",
        "        for j in range(cols)]",
        "        for i in range(rows)",
        "    ]",
        "    return matrix",
        "",
        "def find_high_low(matrix_A, matrix_B):",
        "    elements = [",
        "        num",
        "        for matrix in [matrix_A, matrix_B]",
        "        for row in matrix",
        "        for num in row",
        "    ]"
    ]
    add_code_block(doc, code_1a_p1)
    doc.add_page_break()

    # Page 2: OUTPUT (Left page facing Page 3)
    add_heading(doc, "OUTPUT:")
    out_1a = [
        "Enter number of rows: 2",
        "Enter number of columns: 3",
        "Enter elements of Matrix-A:",
        "Enter element [0][0]: 1",
        "Enter element [0][1]: 2",
        "Enter element [0][2]: 3",
        "Enter element [1][0]: 4",
        "Enter element [1][1]: 5",
        "Enter element [1][2]: 6",
        "Enter elements of Matrix-B:",
        "Enter element [0][0]: 10",
        "Enter element [0][1]: 11",
        "Enter element [0][2]: 12",
        "Enter element [1][0]: 13",
        "Enter element [1][1]: 14",
        "Enter element [1][2]: 15",
        "",
        "Matrix-A",
        "[1, 2, 3]",
        "[4, 5, 6]",
        "",
        "Matrix-B",
        "[10, 11, 12]",
        "[13, 14, 15]",
        "",
        "Highest num: 15",
        "Lowest num: 1"
    ]
    add_output_block(doc, out_1a)
    doc.add_page_break()

    # Page 3: CODING continuation, Evaluation Table, RESULT
    code_1a_p2 = [
        "    high = max(elements)",
        "    low = min(elements)",
        "    return high, low",
        "",
        "def display_matrix(matrix, name):",
        "    print(f\"\\n{name}\")",
        "    for row in matrix:",
        "        print(row)",
        "",
        "rows = int(input(\"Enter number of rows: \"))",
        "cols = int(input(\"Enter number of columns: \"))",
        "matrix_A = get_matrix(rows, cols, \"Matrix-A\")",
        "matrix_B = get_matrix(rows, cols, \"Matrix-B\")",
        "high, low = find_high_low(matrix_A, matrix_B)",
        "display_matrix(matrix_A, \"Matrix-A\")",
        "display_matrix(matrix_B, \"Matrix-B\")",
        "print(\"\\nHighest num:\", high)",
        "print(\"Lowest num:\", low)"
    ]
    add_code_block(doc, code_1a_p2)
    doc.add_paragraph()  # spacer
    add_evaluation_table(doc)
    add_heading(doc, "RESULT:")
    add_body_paragraph(doc, "The two matrices were successfully obtained from the user, and the highest and lowest elements were found using functions and list comprehension.")
    doc.add_page_break()

    # Page 4: Blank page (Left page, only footer & border)
    p_blank1 = doc.add_paragraph()
    p_blank1.paragraph_format.space_before = Pt(200)
    doc.add_page_break()

    # ==========================================
    # EXPERIMENT 1.B (Pages 5 to 8)
    # ==========================================
    # Page 5: Header, AIM, ALGORITHM, CODING part 1
    add_header_table(doc, "1.B", "  ", "COMPREHENSION", "SET COMPREHENSION")
    add_heading(doc, "AIM:")
    add_body_paragraph(doc, "To find the symmetric difference of two sets by obtaining input from the user and using functions and set comprehension.")
    add_heading(doc, "ALGORITHM:")
    add_algorithm_steps(doc, [
        "Define a function to get the elements of a set from the user.",
        "Define a function to find the symmetric difference.",
        "Obtain two sets from the user.",
        "Use set comprehension to find the elements present in only one of the sets.",
        "Find the length of the symmetric difference.",
        "Display the result."
    ])
    add_heading(doc, "CODING:")
    code_1b_p1 = [
        "def get_set(name):",
        "    values = input(f\"Enter elements of {name}: \").split()",
        "    return set(map(int, values))",
        "",
        "def find_symmetric_difference(set_A, set_B):",
        "    sym_diff_set = {",
        "        item",
        "        for item in set_A.union(set_B)",
        "        if item not in set_A.intersection(set_B)",
        "    }",
        "    return sym_diff_set",
        "",
        "def display_result(set_A, set_B, sym_diff_set):",
        "    print(\"\\nSet-A:\", set_A)"
    ]
    add_code_block(doc, code_1b_p1)
    doc.add_page_break()

    # Page 6: OUTPUT
    add_heading(doc, "OUTPUT:")
    out_1b = [
        "Enter elements of Set-A: 1 2 3 4 5",
        "Enter elements of Set-B: 4 5 6 7 8",
        "",
        "Set-A: {1, 2, 3, 4, 5}",
        "Set-B: {4, 5, 6, 7, 8}",
        "",
        "Symmetric difference: {1, 2, 3, 6, 7, 8}",
        "Length of symmetric difference: 6"
    ]
    add_output_block(doc, out_1b)
    doc.add_page_break()

    # Page 7: CODING continuation, Evaluation Table, RESULT
    code_1b_p2 = [
        "    print(\"Set-B:\", set_B)",
        "    print(\"Symmetric difference:\", sym_diff_set)",
        "    print(\"Length of symmetric difference:\", len(sym_diff_set))",
        "",
        "set_A = get_set(\"Set-A\")",
        "set_B = get_set(\"Set-B\")",
        "sym_diff_set = find_symmetric_difference(set_A, set_B)",
        "display_result(set_A, set_B, sym_diff_set)"
    ]
    add_code_block(doc, code_1b_p2)
    doc.add_paragraph()
    add_evaluation_table(doc)
    add_heading(doc, "RESULT:")
    add_body_paragraph(doc, "The symmetric difference of the two user-provided sets was successfully calculated using a function and set comprehension.")
    doc.add_page_break()

    # Page 8: Blank page
    p_blank2 = doc.add_paragraph()
    p_blank2.paragraph_format.space_before = Pt(200)
    doc.add_page_break()

    # ==========================================
    # EXPERIMENT 1.C (Pages 9 to 12)
    # ==========================================
    # Page 9: Header, AIM, ALGORITHM, CODING part 1
    add_header_table(doc, "1.C", "  ", "COMPREHENSION", "DICTIONARY COMPREHENSION")
    add_heading(doc, "AIM:")
    add_body_paragraph(doc, "To create a dictionary from user-provided letters, digits, and words using functions and dictionary comprehension.")
    add_heading(doc, "ALGORITHM:")
    add_algorithm_steps(doc, [
        "Define a function to obtain letters, digits, and words from the user.",
        "Define a function to create the dictionary.",
        "Use dictionary comprehension to associate each letter with its corresponding digit and word.",
        "Display the dictionary.",
        "Verify that all three inputs contain the same number of elements."
    ])
    add_heading(doc, "CODING:")
    code_1c_p1 = [
        "def get_input():",
        "    letters = input(\"Enter letters separated by space: \").split()",
        "    digits = list(map(int, input(\"Enter digits separated by space: \").split()))",
        "    words = input(\"Enter words separated by space: \").split()",
        "    return letters, digits, words",
        "",
        "def create_dictionary(letters, digits, words):",
        "    dictionary = {",
        "        letter: {",
        "            \"digit\": digits[i],",
        "            \"word\": words[i]",
        "        }",
        "        for i, letter in enumerate(letters)",
        "    }"
    ]
    add_code_block(doc, code_1c_p1)
    doc.add_page_break()

    # Page 10: OUTPUT
    add_heading(doc, "OUTPUT:")
    out_1c = [
        "Enter letters separated by space: A B",
        "Enter digits separated by space: 1 2",
        "Enter words separated by space: Apple Banana",
        "",
        "Dictionary:",
        "{'A': {'digit': 1, 'word': 'Apple'},",
        " 'B': {'digit': 2, 'word': 'Banana'}}"
    ]
    add_output_block(doc, out_1c)
    doc.add_page_break()

    # Page 11: CODING continuation, Evaluation Table, RESULT
    code_1c_p2 = [
        "    return dictionary",
        "",
        "def display_dictionary(dictionary):",
        "    print(\"\\nDictionary:\")",
        "    print(dictionary)",
        "",
        "letters, digits, words = get_input()",
        "if len(letters) != len(digits) or len(letters) != len(words):",
        "    print(\"Error: All three inputs must contain the same number of elements.\")",
        "else:",
        "    dictionary = create_dictionary(letters, digits, words)",
        "    display_dictionary(dictionary)"
    ]
    add_code_block(doc, code_1c_p2)
    doc.add_paragraph()
    add_evaluation_table(doc)
    add_heading(doc, "RESULT:")
    add_body_paragraph(doc, "The dictionary was successfully created from user input using a function and dictionary comprehension.")
    doc.add_page_break()

    # Page 12: Blank page
    p_blank3 = doc.add_paragraph()
    p_blank3.paragraph_format.space_before = Pt(200)

    # Save to file
    doc.save(output_path)
    print(f"Golden reference document successfully generated at: {output_path}")

if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.abspath(__file__))
    ref_path = os.path.join(out_dir, "AI_ML_Python_Lab_Record_Reference.docx")
    create_reference_document(ref_path)
