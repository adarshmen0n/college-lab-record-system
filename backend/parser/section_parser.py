"""
Section Parser: Extracts structured experiment sections (Aim, Algorithm, Code, Output, Result)
from unstructured text or imported documents, preserving indentation and line structure.
"""
import re
from typing import Dict, Any, Optional

try:
    from ..sanitizer import sanitize_text
except (ImportError, ValueError):
    from backend.sanitizer import sanitize_text

class SectionParser:
    @staticmethod
    def parse_raw_text(text: str) -> Dict[str, Any]:
        """
        Parses raw text containing experiment notes into structured dictionary fields,
        strictly sanitizing any prompt leakage or developer instructions.
        """
        result = {
            "experiment_number": "",
            "title": "",
            "subtitle": "",
            "date": "",
            "aim": "",
            "algorithm": "",
            "coding": "",
            "output": "",
            "result": ""
        }

        # Normalize carriage returns and sanitize prompt instructions upfront
        cleaned = sanitize_text(text.replace("\r\n", "\n").replace("\r", "\n"))

        # 1. Look for Header fields
        exp_match = re.search(r'(?:EX\s*NO|EXPERIMENT\s*(?:NO)?|EXPT\s*NO)\s*[:.\-]?\s*([^\n]+)', cleaned, re.IGNORECASE)
        if exp_match:
            result["experiment_number"] = exp_match.group(1).strip()

        date_match = re.search(r'DATE\s*[:.\-]?\s*([0-9\/\-\.]+)', cleaned, re.IGNORECASE)
        if date_match:
            result["date"] = date_match.group(1).strip()

        title_match = re.search(r'TITLE\s*[:.\-]?\s*([^\n]+)', cleaned, re.IGNORECASE)
        if title_match:
            result["title"] = title_match.group(1).strip()

        subtitle_match = re.search(r'SUBTITLE\s*[:.\-]?\s*([^\n]+)', cleaned, re.IGNORECASE)
        if subtitle_match:
            result["subtitle"] = subtitle_match.group(1).strip()

        # 2. Section Headings: AIM, ALGORITHM, CODING/PROGRAM, OUTPUT, RESULT
        section_regex = r'(AIM|ALGORITHM|CODING|PROGRAM|CODE|OUTPUT|RESULT)\s*[:.\-]?'
        matches = list(re.finditer(section_regex, cleaned, re.IGNORECASE))

        if matches:
            for i, match in enumerate(matches):
                tag = match.group(1).upper()
                start_pos = match.end()
                end_pos = matches[i + 1].start() if (i + 1 < len(matches)) else len(cleaned)
                section_content = cleaned[start_pos:end_pos].strip()

                if "AIM" in tag:
                    result["aim"] = sanitize_text(section_content, "aim")
                elif "ALGO" in tag:
                    result["algorithm"] = sanitize_text(section_content, "algorithm")
                elif "COD" in tag or "PROG" in tag:
                    result["coding"] = sanitize_text(section_content, "coding")
                elif "OUT" in tag:
                    result["output"] = sanitize_text(section_content, "output")
                elif "RES" in tag:
                    result["result"] = sanitize_text(section_content, "result")

        return result
