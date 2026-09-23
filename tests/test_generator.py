"""
Unit tests for DOCX Generator across various experiment scenarios.
"""
import os
import io
import base64
import pytest
from PIL import Image
from backend.models.schemas import ExperimentData, TemplateConfig
from backend.generator.docx_generator import DocxGenerator
from backend.validator.page_checker import PageChecker

@pytest.fixture
def base_template():
    return TemplateConfig(
        id="test_template",
        font_family="Times New Roman",
        has_page_border=True,
        footer_left="ADARSH MENON",
        footer_right="714025247005"
    )

@pytest.fixture
def sample_image_b64():
    # Generate a tiny red square in-memory as base64
    img = Image.new("RGB", (100, 100), color="red")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64_str = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64_str}"

def test_generate_short_experiment(tmp_path, base_template):
    exp = ExperimentData(
        experiment_number="1.D",
        title="HELLO WORLD",
        subtitle="BASIC PYTHON",
        date="23-09-2026",
        aim="To verify python interpreter.",
        algorithm="1. Print hello.\n2. Verify output.",
        coding="print('Hello World')",
        output="Hello World",
        result="Verified successfully."
    )
    out_file = str(tmp_path / "exp_short.docx")
    DocxGenerator.generate_new_record(exp, base_template, out_file)
    assert os.path.exists(out_file)

    val = PageChecker.validate_document(out_file, exp)
    assert val.is_valid is True

def test_generate_long_algorithm(tmp_path, base_template):
    algo_steps = "\n".join([f"{i}. Step number {i} for comprehensive data preprocessing." for i in range(1, 15)])
    exp = ExperimentData(
        experiment_number="2.A",
        title="DATA PREPROCESSING",
        aim="To test long algorithm rendering across page bounds.",
        algorithm=algo_steps,
        coding="data = [i for i in range(10)]\nprint(data)",
        output="[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]",
        result="Preprocessing pipeline completed."
    )
    out_file = str(tmp_path / "exp_long_algo.docx")
    DocxGenerator.generate_new_record(exp, base_template, out_file)
    assert os.path.exists(out_file)
    val = PageChecker.validate_document(out_file, exp)
    assert val.is_valid is True

def test_generate_long_code(tmp_path, base_template):
    # Over 55 lines of code
    code_lines = "\n".join([f"def function_{i}():\n    return {i} * 2" for i in range(30)])
    exp = ExperimentData(
        experiment_number="2.B",
        title="COMPLEX GRAPH ALGORITHMS",
        aim="To test code partitioning across pages.",
        algorithm="1. Initialize graph.\n2. Traverse vertices.\n3. Return result.",
        coding=code_lines,
        output="Execution complete.",
        result="Graph traversal successful."
    )
    out_file = str(tmp_path / "exp_long_code.docx")
    DocxGenerator.generate_new_record(exp, base_template, out_file)
    assert os.path.exists(out_file)
    val = PageChecker.validate_document(out_file, exp)
    assert val.is_valid is True

def test_generate_long_output(tmp_path, base_template):
    long_output = "\n".join([f"Epoch {i}/100: Loss = {1.0/(i+1):.4f}, Accuracy = {0.5 + i*0.005:.3f}" for i in range(40)])
    exp = ExperimentData(
        experiment_number="2.C",
        title="NEURAL NETWORK TRAINING",
        aim="To train multi-layer perceptron.",
        algorithm="1. Forward pass.\n2. Backpropagation.",
        coding="model.fit(X, y)",
        output=long_output,
        result="Model converged."
    )
    out_file = str(tmp_path / "exp_long_output.docx")
    DocxGenerator.generate_new_record(exp, base_template, out_file)
    assert os.path.exists(out_file)
    val = PageChecker.validate_document(out_file, exp)
    assert val.is_valid is True

def test_generate_output_with_image(tmp_path, base_template, sample_image_b64):
    exp = ExperimentData(
        experiment_number="2.D",
        title="IMAGE PROCESSING",
        aim="To generate filtered image.",
        algorithm="1. Load image.\n2. Apply gaussian filter.",
        coding="cv2.imshow('result', img)",
        output="Image displayed.",
        output_images=[sample_image_b64],
        result="Filter applied successfully."
    )
    out_file = str(tmp_path / "exp_image.docx")
    DocxGenerator.generate_new_record(exp, base_template, out_file)
    assert os.path.exists(out_file)
    val = PageChecker.validate_document(out_file, exp)
    assert val.is_valid is True

def test_custom_and_nonsequential_experiment_numbers(tmp_path, base_template):
    numbers = ["24", "31", "Ex-100", "3.B"]
    for num in numbers:
        exp = ExperimentData(
            experiment_number=num,
            title="CUSTOM EXPERIMENT NUMBER",
            aim="Testing exact preservation of user supplied experiment number.",
            algorithm="1. Do task.",
            coding="x = 10",
            output="10",
            result="Done."
        )
        out_file = str(tmp_path / f"exp_{num.replace('.', '_')}.docx")
        DocxGenerator.generate_new_record(exp, base_template, out_file)
        val = PageChecker.validate_document(out_file, exp)
        assert val.is_valid is True
        assert val.checks["experiment_number_matches"] is True
