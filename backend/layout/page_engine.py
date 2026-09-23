"""
Page Engine: Takes ExperimentData and TemplateConfig, decomposes the content
into page-by-page plans according to the university facing-page convention,
and guarantees output placement and blank-page prevention.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from ..models.schemas import ExperimentData, TemplateConfig
from .overflow import OverflowHandler

class PagePlan(BaseModel):
    page_index: int
    page_type: str  # "EXP_START", "OUTPUT", "EXP_CONT", "BLANK_BACK"
    side: str  # "RIGHT" or "LEFT"
    has_header_table: bool = False
    has_aim: bool = False
    algorithm_steps: List[str] = Field(default_factory=list)
    code_lines: List[str] = Field(default_factory=list)
    output_lines: List[str] = Field(default_factory=list)
    output_images: List[str] = Field(default_factory=list)
    has_evaluation_table: bool = False
    has_result: bool = False

class ExperimentLayoutPlan(BaseModel):
    experiment_number: str
    total_pages: int
    pages: List[PagePlan]

class PageEngine:
    @staticmethod
    def plan_experiment(data: ExperimentData, config: TemplateConfig) -> ExperimentLayoutPlan:
        """
        Creates the layout plan matching the exact 4-page reference structure:
        - Page 1 (Right): Header Table, Aim, Algorithm, Code (Part 1)
        - Page 2 (Left): Output (Text + Images)
        - Page 3 (Right): Code (Part 2), Evaluation Table, Result
        - Page 4 (Left): Blank / Spacer (with Border & Footer)
        """
        # Clean and split inputs
        algo_steps = [s.strip() for s in data.algorithm.strip().split("\n") if s.strip()]
        # Strip numbers if already present (e.g. "1. Step" -> "Step") to avoid double numbering
        cleaned_steps = []
        for step in algo_steps:
            cleaned = step.lstrip("0123456789.-) ").strip()
            cleaned_steps.append(cleaned if cleaned else step)

        code_lines = data.coding.split("\n")
        output_lines = [l for l in data.output.split("\n")] if data.output else []

        # Split code across Page 1 and Page 3
        code_p1, code_p3 = OverflowHandler.calculate_code_split(
            code_lines=code_lines,
            algo_steps_count=len(cleaned_steps),
            aim_text=data.aim
        )

        # Split output if multi-page output
        out_p2, out_p4 = OverflowHandler.calculate_output_split(
            output_lines=output_lines,
            has_images=bool(data.output_images)
        )

        pages: List[PagePlan] = []

        # Page 1: EXP_START (RIGHT)
        pages.append(PagePlan(
            page_index=0,
            page_type="EXP_START",
            side="RIGHT",
            has_header_table=True,
            has_aim=True,
            algorithm_steps=cleaned_steps,
            code_lines=code_p1
        ))

        # Page 2: OUTPUT (LEFT facing Page 3)
        pages.append(PagePlan(
            page_index=1,
            page_type="OUTPUT",
            side="LEFT",
            output_lines=out_p2,
            output_images=data.output_images or []
        ))

        # Page 3: EXP_CONT (RIGHT facing Page 2)
        pages.append(PagePlan(
            page_index=2,
            page_type="EXP_CONT",
            side="RIGHT",
            code_lines=code_p3,
            has_evaluation_table=True,
            has_result=True
        ))

        # Page 4: BLANK_BACK / OVERFLOW OUTPUT (LEFT)
        pages.append(PagePlan(
            page_index=3,
            page_type="BLANK_BACK",
            side="LEFT",
            output_lines=out_p4
        ))

        return ExperimentLayoutPlan(
            experiment_number=data.experiment_number,
            total_pages=len(pages),
            pages=pages
        )
