"""
Unit tests for Template Analyzer.
"""
import os
import pytest
from backend.template.analyzer import TemplateAnalyzer
from backend.template.template_store import TemplateStore

REF_DOCX = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "templates", "saved_templates", "AI_ML_Python_Lab_Record_Reference.docx"
)

def test_analyze_reference_document():
    assert os.path.exists(REF_DOCX), f"Reference docx not found at {REF_DOCX}"
    result = TemplateAnalyzer.analyze_docx(REF_DOCX)

    assert result.success is True
    assert result.has_page_border is True
    assert result.has_header_table is True
    assert result.has_evaluation_table is True
    assert "1.A" in result.detected_experiments
    assert "1.B" in result.detected_experiments
    assert "1.C" in result.detected_experiments
    assert result.student_name_detected == "ADARSH MENON"
    assert result.register_number_detected == "714025247005"
    assert "Times New Roman" in result.detected_fonts

def test_template_store_integration():
    store = TemplateStore()
    templates = store.list_templates()
    assert len(templates) >= 1
    tmpl = store.get_template("python_lab_reference")
    assert tmpl is not None
    assert tmpl.has_page_border is True
    assert tmpl.evaluation_table_xml is not None
