"""
Unit tests for Document Validator.
"""
import os
from backend.models.schemas import ExperimentData, TemplateConfig
from backend.generator.docx_generator import DocxGenerator
from backend.validator.page_checker import PageChecker

def test_validator_with_valid_document(tmp_path):
    exp = ExperimentData(
        experiment_number="1.E",
        title="VALIDATION TEST",
        aim="Testing validator pass conditions.",
        algorithm="1. Execute checks.",
        coding="assert True",
        output="Passed",
        result="Success."
    )
    tmpl = TemplateConfig()
    fpath = str(tmp_path / "valid_doc.docx")
    DocxGenerator.generate_new_record(exp, tmpl, fpath)

    report = PageChecker.validate_document(fpath, exp)
    assert report.is_valid is True
    assert len(report.errors) == 0
    assert report.checks["can_open_docx"] is True
    assert report.checks["has_header_table"] is True
    assert report.checks["has_evaluation_table"] is True
    assert report.checks["experiment_number_matches"] is True

def test_validator_with_nonexistent_file():
    report = PageChecker.validate_document("nonexistent_file.docx")
    assert report.is_valid is False
    assert len(report.errors) > 0
