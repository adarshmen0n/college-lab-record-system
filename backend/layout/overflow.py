"""
Overflow Handler: Calculates vertical space budget and partitions code, algorithm,
and output content across pages to prevent text collisions and maintain readability.
"""
from typing import List, Tuple

class OverflowHandler:
    PAGE_HEIGHT_PT = 734.0  # Usable height on A4 with 0.75" margins
    HEADER_TABLE_PT = 65.0  # Compact header table
    AIM_ESTIMATE_PT = 55.0
    ALGO_HEADING_PT = 26.0  # 14pt bold heading
    ALGO_STEP_PT = 19.5     # 12pt body font
    CODE_HEADING_PT = 26.0  # 14pt bold heading
    CODE_LINE_PT = 14.5     # 12pt Times New Roman code line
    EVAL_TABLE_PT = 115.0
    RESULT_ESTIMATE_PT = 55.0
    OUTPUT_HEADING_PT = 26.0 # 14pt bold heading
    OUTPUT_LINE_PT = 15.5   # 12pt Times New Roman output line

    @classmethod
    def calculate_code_split(cls, code_lines: List[str], algo_steps_count: int, aim_text: str) -> Tuple[List[str], List[str]]:
        """
        Determines how many lines of code fit on Page 1 along with Header, Aim, and Algorithm,
        and returns (page1_code, page2_code).
        """
        # Estimate Page 1 fixed elements
        aim_pt = cls.AIM_ESTIMATE_PT if len(aim_text) < 150 else cls.AIM_ESTIMATE_PT + 25.0
        algo_pt = cls.ALGO_HEADING_PT + (algo_steps_count * cls.ALGO_STEP_PT)
        used_p1 = cls.HEADER_TABLE_PT + aim_pt + algo_pt + cls.CODE_HEADING_PT + 30.0  # Spacers

        available_for_code_p1 = max(0.0, cls.PAGE_HEIGHT_PT - used_p1)
        max_lines_p1 = max(5, int(available_for_code_p1 // cls.CODE_LINE_PT))

        if len(code_lines) <= max_lines_p1:
            # Everything fits on Page 1 or is short enough
            return code_lines, []

        return code_lines[:max_lines_p1], code_lines[max_lines_p1:]

    @classmethod
    def calculate_output_split(cls, output_lines: List[str], has_images: bool = False) -> Tuple[List[str], List[str]]:
        """
        Splits output across output pages if it exceeds page capacity.
        """
        available_pt = cls.PAGE_HEIGHT_PT - cls.OUTPUT_HEADING_PT - 20.0
        if has_images:
            available_pt -= 250.0  # Reserve height for screenshot

        max_lines = max(5, int(available_pt // cls.OUTPUT_LINE_PT))
        if len(output_lines) <= max_lines:
            return output_lines, []
        return output_lines[:max_lines], output_lines[max_lines:]
