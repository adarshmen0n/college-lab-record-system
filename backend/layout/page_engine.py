"""
Page Engine: Takes ExperimentData and TemplateConfig, decomposes the content
into page-by-page plans according to the university facing-page convention,
and guarantees output placement and blank-page prevention.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from ..models.schemas import ExperimentData, TemplateConfig, PagePreviewData
from .overflow import OverflowHandler

try:
    from ..sanitizer import sanitize_text, format_algorithm_steps
except (ImportError, ValueError):
    from backend.sanitizer import sanitize_text, format_algorithm_steps

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
        aim_clean = sanitize_text(data.aim, "aim")
        algo_clean = sanitize_text(data.algorithm, "algorithm")
        coding_clean = sanitize_text(data.coding, "coding")
        output_clean = sanitize_text(data.output, "output")
        result_clean = sanitize_text(data.result, "result")

        # Format algorithm steps dynamically into Step 1:, Step 2:, ... format
        cleaned_steps = format_algorithm_steps(algo_clean)

        code_lines = coding_clean.split("\n")
        output_lines = [l for l in output_clean.split("\n")] if output_clean else []

        # Split code across Page 1 and Page 3
        code_p1, code_p3 = OverflowHandler.calculate_code_split(
            code_lines=code_lines,
            algo_steps_count=len(cleaned_steps),
            aim_text=aim_clean
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

    @staticmethod
    def plan_workspace(experiments: List[ExperimentData], config: TemplateConfig) -> List[PagePreviewData]:
        """
        Plans all experiments in the workspace sequentially, returning detailed
        page preview models for the page-by-page document viewer.
        """
        all_pages: List[PagePreviewData] = []
        total_pages = len(experiments) * 4
        current_page_no = 1

        for exp in experiments:
            plan = PageEngine.plan_experiment(exp, config)
            exp_p1 = plan.pages[0]
            exp_p2 = plan.pages[1]
            exp_p3 = plan.pages[2]
            exp_p4 = plan.pages[3]

            student_name = exp.student_name or config.student_name
            register_number = exp.register_number or config.register_number
            margins_dict = {
                "top": config.margins.top,
                "bottom": config.margins.bottom,
                "left": config.margins.left,
                "right": config.margins.right
            }

            # Page 1: EXP_START (RIGHT)
            title_clean = sanitize_text(exp.title, "title")
            subtitle_clean = sanitize_text(exp.subtitle, "subtitle")
            aim_clean = sanitize_text(exp.aim, "aim")
            result_clean = sanitize_text(exp.result, "result")

            all_pages.append(PagePreviewData(
                page_number=current_page_no,
                total_pages=total_pages,
                experiment_number=exp.experiment_number,
                experiment_title=title_clean,
                page_type="EXP_START",
                side="RIGHT",
                is_blank=False,
                has_header_table=True,
                header_ex_no=exp.experiment_number,
                header_date=exp.date,
                header_title=title_clean,
                header_subtitle=subtitle_clean,
                aim_heading="AIM:",
                aim_text=aim_clean,
                procedure_heading=f"{exp.procedure_heading or 'ALGORITHM'}:",
                algorithm_steps=exp_p1.algorithm_steps,
                code_heading=f"{exp.code_heading or 'CODING'}:",
                code_lines=exp_p1.code_lines,
                footer_left=student_name,
                footer_right=register_number,
                margins_in=margins_dict,
                has_border=config.has_page_border
            ))
            current_page_no += 1

            # Page 2: OUTPUT (LEFT)
            all_pages.append(PagePreviewData(
                page_number=current_page_no,
                total_pages=total_pages,
                experiment_number=exp.experiment_number,
                experiment_title=title_clean,
                page_type="OUTPUT",
                side="LEFT",
                is_blank=False,
                output_heading="OUTPUT:",
                output_lines=exp_p2.output_lines,
                output_images=exp_p2.output_images,
                footer_left=student_name,
                footer_right=register_number,
                margins_in=margins_dict,
                has_border=config.has_page_border
            ))
            current_page_no += 1

            # Page 3: EXP_CONT (RIGHT)
            has_code_p3 = bool(exp_p3.code_lines)
            all_pages.append(PagePreviewData(
                page_number=current_page_no,
                total_pages=total_pages,
                experiment_number=exp.experiment_number,
                experiment_title=title_clean,
                page_type="EXP_CONT",
                side="RIGHT",
                is_blank=False,
                code_heading=f"{exp.code_heading or 'CODING'} (CONTINUED):" if has_code_p3 else None,
                code_lines=exp_p3.code_lines,
                has_evaluation_table=True,
                result_heading="RESULT:",
                result_text=result_clean,
                footer_left=student_name,
                footer_right=register_number,
                margins_in=margins_dict,
                has_border=config.has_page_border
            ))
            current_page_no += 1

            # Page 4: BLANK_BACK / OVERFLOW (LEFT)
            has_overflow_p4 = bool(exp_p4.output_lines)
            all_pages.append(PagePreviewData(
                page_number=current_page_no,
                total_pages=total_pages,
                experiment_number=exp.experiment_number,
                experiment_title=exp.title,
                page_type="BLANK_BACK",
                side="LEFT",
                is_blank=not has_overflow_p4,
                output_heading="OUTPUT (CONTINUED):" if has_overflow_p4 else None,
                output_lines=exp_p4.output_lines,
                footer_left=student_name,
                footer_right=register_number,
                margins_in=margins_dict,
                has_border=config.has_page_border
            ))
            current_page_no += 1

        return all_pages

