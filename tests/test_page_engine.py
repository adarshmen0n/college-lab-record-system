"""
Unit tests for Layout and Page Engine.
"""
from backend.models.schemas import ExperimentData, TemplateConfig
from backend.layout.page_engine import PageEngine
from backend.layout.overflow import OverflowHandler
from backend.layout.page_pairing import PagePairingManager

def test_page_engine_plan():
    exp = ExperimentData(
        experiment_number="1.A",
        title="TEST EXPERIMENT",
        aim="Short aim",
        algorithm="1. Step one\n2. Step two",
        coding="print('test')",
        output="test output",
        result="Success"
    )
    tmpl = TemplateConfig()
    plan = PageEngine.plan_experiment(exp, tmpl)

    assert plan.total_pages == 4
    # Page 1: EXP_START (RIGHT)
    assert plan.pages[0].page_type == "EXP_START"
    assert plan.pages[0].side == "RIGHT"
    assert plan.pages[0].has_header_table is True
    assert plan.pages[0].has_aim is True

    # Page 2: OUTPUT (LEFT)
    assert plan.pages[1].page_type == "OUTPUT"
    assert plan.pages[1].side == "LEFT"

    # Page 3: EXP_CONT (RIGHT)
    assert plan.pages[2].page_type == "EXP_CONT"
    assert plan.pages[2].side == "RIGHT"
    assert plan.pages[2].has_evaluation_table is True
    assert plan.pages[2].has_result is True

    # Page 4: BLANK_BACK (LEFT)
    assert plan.pages[3].page_type == "BLANK_BACK"
    assert plan.pages[3].side == "LEFT"

def test_overflow_handler():
    code_lines = [f"line_{i}" for i in range(50)]
    p1, p2 = OverflowHandler.calculate_code_split(code_lines, algo_steps_count=5, aim_text="Short aim")
    assert len(p1) > 0
    assert len(p2) > 0
    assert len(p1) + len(p2) == 50

def test_page_pairing_manager():
    pages = PagePairingManager.classify_page_sides(4, start_page_number=1)
    assert pages[0]["side"] == "RIGHT"
    assert pages[1]["side"] == "LEFT"
    assert pages[2]["side"] == "RIGHT"
    assert pages[3]["side"] == "LEFT"
