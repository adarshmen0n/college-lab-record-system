"""
Pydantic schemas for the College Laboratory Record Automation System.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, model_validator

try:
    from ..sanitizer import sanitize_text
except (ImportError, ValueError):
    from backend.sanitizer import sanitize_text

class ExperimentData(BaseModel):
    experiment_number: str = Field(..., description="Explicit user-provided experiment number (e.g. '1.D', '24')")
    title: str = Field(..., description="Main experiment title (e.g. 'COMPREHENSION')")
    subtitle: Optional[str] = Field("", description="Optional experiment subtitle or topic (e.g. 'TUPLE COMPREHENSION')")
    date: Optional[str] = Field("", description="Date of experiment (e.g. '23-09-2026')")
    aim: str = Field(..., description="Aim / Objective of the experiment")
    procedure_heading: Optional[str] = Field("ALGORITHM", description="Procedure heading: ALGORITHM, PROCEDURE, METHODOLOGY")
    algorithm: str = Field(..., description="Algorithm or procedure steps (numbered, multiline, or bulleted)")
    code_heading: Optional[str] = Field("CODING", description="Code/Command heading: CODING, PROGRAM, SQL QUERY, COMMANDS")
    coding: str = Field(..., description="Source code, queries, or command listing (indentation preserved)")
    output: Optional[str] = Field("", description="Execution output or terminal log text")
    output_images: Optional[List[str]] = Field(default_factory=list, description="Base64 encoded strings or file paths of output screenshots")
    result: str = Field(..., description="Result statement")
    subject: Optional[str] = Field("General", description="Subject domain: Python, Java, C/C++, DBMS, Linux, Networks, AIML, etc.")
    student_name: Optional[str] = Field("ADARSH MENON", description="Student Name for footer")
    register_number: Optional[str] = Field("714025247005", description="Register / Roll Number for footer")

    @model_validator(mode="before")
    @classmethod
    def sanitize_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for f in ["title", "subtitle", "aim", "algorithm", "coding", "output", "result"]:
                if f in data and isinstance(data[f], str):
                    data[f] = sanitize_text(data[f], field_name=f)
        return data

class MarginConfig(BaseModel):
    top: float = 0.75
    bottom: float = 0.75
    left: float = 0.75
    right: float = 0.75

class PageDimensions(BaseModel):
    width: float = 8.27
    height: float = 11.69

class TemplateConfig(BaseModel):
    id: str = "general_lab_reference"
    name: str = "General College Lab Record Template"
    description: Optional[str] = "Standard university format with facing Output/Experiment pages and Evaluation table"
    subject: str = "General"
    page_size: PageDimensions = Field(default_factory=PageDimensions)
    margins: MarginConfig = Field(default_factory=MarginConfig)
    has_page_border: bool = True
    font_family: str = "Times New Roman"
    code_font_family: str = "Times New Roman"
    title_font_size: int = 14
    heading_font_size: int = 14
    body_font_size: int = 12
    code_font_size: int = 12
    header_table_xml: Optional[str] = None
    evaluation_table_xml: Optional[str] = None
    footer_left: Optional[str] = "ADARSH MENON"
    footer_right: Optional[str] = "714025247005"
    page_pairing: str = "facing_pages"  # Output Left, Experiment Right
    is_locked: bool = False

class AnalysisResult(BaseModel):
    success: bool
    filename: str
    total_pages_estimated: int = 0
    detected_experiments: List[str] = Field(default_factory=list)
    detected_fonts: List[str] = Field(default_factory=list)
    has_page_border: bool = False
    has_evaluation_table: bool = False
    has_header_table: bool = False
    student_name_detected: Optional[str] = None
    register_number_detected: Optional[str] = None
    template_config: Optional[TemplateConfig] = None
    warnings: List[str] = Field(default_factory=list)

class ContinuationRequest(BaseModel):
    original_filename: str
    experiment: ExperimentData
    template_id: Optional[str] = "python_lab_reference"
    preserve_original: bool = True

class GenerationRequest(BaseModel):
    experiment: ExperimentData
    template_id: Optional[str] = "python_lab_reference"

class GenerationResponse(BaseModel):
    success: bool
    filename: str
    download_url: str
    message: str
    experiment_number: str
    total_pages_estimated: int
    is_continuation: bool = False
    warnings: List[str] = Field(default_factory=list)

class ValidationReport(BaseModel):
    is_valid: bool
    checks: Dict[str, Any]
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)

class Draft(BaseModel):
    id: str
    title: str
    experiment_number: str
    updated_at: str
    data: ExperimentData

class AiSuggestionItem(BaseModel):
    field: str
    original: str
    suggested: str
    rationale: str

class AiAssistRequest(BaseModel):
    field: str  # "algorithm", "coding", "aim", "result", "all"
    content: str
    mode: str = "format"  # "format", "indentation", "spellcheck", "section_detect"

class AiAssistResponse(BaseModel):
    success: bool
    field: str
    suggestions: List[AiSuggestionItem] = Field(default_factory=list)
    message: Optional[str] = None

class WorkspaceExperiment(BaseModel):
    id: str
    experiment_number: str
    title: str
    subtitle: Optional[str] = ""
    date: Optional[str] = ""
    aim: str
    procedure_heading: Optional[str] = "ALGORITHM"
    algorithm: str
    code_heading: Optional[str] = "CODING"
    coding: str
    output: Optional[str] = ""
    output_images: Optional[List[str]] = Field(default_factory=list)
    result: str
    student_name: Optional[str] = "ADARSH MENON"
    register_number: Optional[str] = "714025247005"
    status: str = "Saved"
    last_saved: Optional[str] = None

class WorkspaceGenerationRequest(BaseModel):
    experiments: List[ExperimentData]
    template_id: Optional[str] = "python_lab_reference"
    original_filename: Optional[str] = None

class WorkspacePreviewRequest(BaseModel):
    experiments: List[ExperimentData]
    template_id: Optional[str] = "python_lab_reference"
    original_filename: Optional[str] = None

class PagePreviewData(BaseModel):
    page_number: int
    total_pages: int
    experiment_number: Optional[str] = None
    experiment_title: Optional[str] = None
    page_type: str  # "EXP_START", "OUTPUT", "EXP_CONT", "BLANK_BACK", "EXISTING_PAGE"
    side: str  # "RIGHT" or "LEFT"
    is_blank: bool = False
    has_header_table: bool = False
    header_ex_no: Optional[str] = None
    header_date: Optional[str] = None
    header_title: Optional[str] = None
    header_subtitle: Optional[str] = None
    aim_heading: Optional[str] = None
    aim_text: Optional[str] = None
    procedure_heading: Optional[str] = None
    algorithm_steps: List[str] = Field(default_factory=list)
    code_heading: Optional[str] = None
    code_lines: List[str] = Field(default_factory=list)
    output_heading: Optional[str] = None
    output_lines: List[str] = Field(default_factory=list)
    output_images: List[str] = Field(default_factory=list)
    has_evaluation_table: bool = False
    result_heading: Optional[str] = None
    result_text: Optional[str] = None
    footer_left: Optional[str] = None
    footer_right: Optional[str] = None
    page_width_mm: float = 210.0
    page_height_mm: float = 297.0
    margins_in: Dict[str, float] = Field(default_factory=lambda: {"top": 0.75, "bottom": 0.75, "left": 0.75, "right": 0.75})
    has_border: bool = True

class WorkspacePreviewResponse(BaseModel):
    success: bool
    total_experiments: int
    total_pages: int
    pages: List[PagePreviewData]
    validation_report: Optional[ValidationReport] = None
