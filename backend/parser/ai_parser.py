"""
AI Parser & Assistant: Optional assistant for algorithm formatting, code indentation check,
and spelling review. NEVER silently alters user content; returns suggestions for user review.
"""
import os
import re
from typing import List, Optional
from ..models.schemas import AiAssistRequest, AiAssistResponse, AiSuggestionItem

try:
    from ..sanitizer import format_algorithm_steps
except (ImportError, ValueError):
    from backend.sanitizer import format_algorithm_steps

class AiParser:
    @staticmethod
    def assist(request: AiAssistRequest) -> AiAssistResponse:
        field = request.field
        content = request.content.strip()
        mode = request.mode
        suggestions: List[AiSuggestionItem] = []

        if not content:
            return AiAssistResponse(success=True, field=field, suggestions=[], message="Content is empty.")

        # 1. Algorithm Step Formatting
        if field == "algorithm" or mode == "format":
            formatted_steps = format_algorithm_steps(content)
            suggested = "\n\n".join(formatted_steps)
            if suggested != content:
                suggestions.append(AiSuggestionItem(
                    field=field,
                    original=content,
                    suggested=suggested,
                    rationale="Normalized algorithm into sequential Step-by-Step format (Step 1:, Step 2:, ...)."
                ))

        # 2. Code Indentation Normalization
        if field == "coding" or mode == "indentation":
            lines = request.content.split("\n")
            cleaned_lines = []
            has_changes = False
            for line in lines:
                # Replace tabs with 4 spaces
                if "\t" in line:
                    line = line.replace("\t", "    ")
                    has_changes = True
                cleaned_lines.append(line)

            suggested = "\n".join(cleaned_lines)
            if has_changes and suggested != request.content:
                suggestions.append(AiSuggestionItem(
                    field="coding",
                    original=request.content,
                    suggested=suggested,
                    rationale="Converted tabs to standard 4-space indentation."
                ))

        # 3. Spelling & Grammar Review
        if field in ["aim", "result"] or mode == "spellcheck":
            fixes = [
                (r'\boccured\b', 'occurred'),
                (r'\bseperate\b', 'separate'),
                (r'\brecieve\b', 'receive'),
                (r'\bimpliment\b', 'implement'),
                (r'\bimplimented\b', 'implemented'),
                (r'\balgoritm\b', 'algorithm'),
                (r'\bsucessfully\b', 'successfully')
            ]
            suggested = content
            reasons = []
            for pattern, repl in fixes:
                if re.search(pattern, suggested, re.IGNORECASE):
                    suggested = re.sub(pattern, repl, suggested, flags=re.IGNORECASE)
                    reasons.append(f"Fixed typo: {repl}")

            if suggested != content:
                suggestions.append(AiSuggestionItem(
                    field=field,
                    original=content,
                    suggested=suggested,
                    rationale="; ".join(reasons)
                ))

        suggested_text = suggestions[0].suggested if suggestions else content
        rationale = suggestions[0].rationale if suggestions else ""
        return AiAssistResponse(
            success=True,
            field=field,
            suggestions=suggestions,
            suggested_text=suggested_text,
            rationale=rationale,
            message=f"Found {len(suggestions)} suggestion(s)." if suggestions else "Content looks clean and well-structured!"
        )
