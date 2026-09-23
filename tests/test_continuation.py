"""
Tests for Continuation Mode and Original Document Protection.
"""
import os
import shutil
import hashlib
import pytest
from backend.models.schemas import ExperimentData, TemplateConfig
from backend.generator.docx_generator import DocxGenerator
from backend.template.analyzer import TemplateAnalyzer
from backend.validator.page_checker import PageChecker

REF_DOCX = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "templates", "saved_templates", "AI_ML_Python_Lab_Record_Reference.docx"
)

def test_continuation_and_sha256_integrity(tmp_path):
    # Copy reference doc to a test workspace
    orig_copy = str(tmp_path / "My_Lab_Record.docx")
    shutil.copyfile(REF_DOCX, orig_copy)

    # Compute initial hash of original
    with open(orig_copy, "rb") as f:
        hash_before = hashlib.sha256(f.read()).hexdigest()

    new_exp = ExperimentData(
        experiment_number="1.D",
        title="COMPREHENSION",
        subtitle="GENERATOR COMPREHENSION",
        aim="To demonstrate generator comprehension in Python.",
        algorithm="1. Define generator expression.\n2. Iterate and print.",
        coding="squares = (x**2 for x in range(5))\nprint(list(squares))",
        output="[0, 1, 4, 9, 16]",
        result="Generator tested successfully."
    )

    tmpl = TemplateConfig(font_family="Times New Roman", has_page_border=True)
    updated_copy = str(tmp_path / "My_Lab_Record_Updated.docx")

    # Run continuation
    DocxGenerator.continue_existing_record(orig_copy, new_exp, tmpl, updated_copy)

    # 1. Verify original file hash has not changed by a single bit
    with open(orig_copy, "rb") as f:
        hash_after = hashlib.sha256(f.read()).hexdigest()
    assert hash_before == hash_after, "Original document was modified!"

    # 2. Verify updated document contains all old experiments PLUS the new one
    analysis = TemplateAnalyzer.analyze_docx(updated_copy)
    assert "1.A" in analysis.detected_experiments
    assert "1.B" in analysis.detected_experiments
    assert "1.C" in analysis.detected_experiments
    assert "1.D" in analysis.detected_experiments

    # 3. Validate updated document integrity
    val = PageChecker.validate_document(updated_copy, new_exp)
    assert val.is_valid is True

def test_non_sequential_experiments_continuation(tmp_path):
    # Create a base document with non-sequential experiments: 20, 21, 23
    tmpl = TemplateConfig(font_family="Times New Roman", has_page_border=True)
    base_file = str(tmp_path / "nonseq_record.docx")

    for num in ["20", "21", "23"]:
        exp = ExperimentData(
            experiment_number=num,
            title=f"EXPERIMENT {num}",
            aim=f"Aim for {num}",
            algorithm=f"1. Step for {num}",
            coding=f"x = {num}",
            output=f"Output {num}",
            result=f"Result {num}"
        )
        if not os.path.exists(base_file):
            DocxGenerator.generate_new_record(exp, tmpl, base_file)
        else:
            temp_out = str(tmp_path / f"temp_{num}.docx")
            DocxGenerator.continue_existing_record(base_file, exp, tmpl, temp_out)
            shutil.copyfile(temp_out, base_file)

    # Now append Experiment 24
    exp_24 = ExperimentData(
        experiment_number="24",
        title="K-MEANS CLUSTERING",
        aim="To implement clustering.",
        algorithm="1. Initialize centroids.",
        coding="kmeans.fit(X)",
        output="Clusters found: 3",
        result="Clustering successful."
    )
    final_file = str(tmp_path / "final_updated.docx")
    DocxGenerator.continue_existing_record(base_file, exp_24, tmpl, final_file)

    analysis = TemplateAnalyzer.analyze_docx(final_file)
    # Ensure experiments are exactly 20, 21, 23, 24 — and that 22 was NEVER invented!
    assert "20" in analysis.detected_experiments
    assert "21" in analysis.detected_experiments
    assert "23" in analysis.detected_experiments
    assert "24" in analysis.detected_experiments
    assert "22" not in analysis.detected_experiments
