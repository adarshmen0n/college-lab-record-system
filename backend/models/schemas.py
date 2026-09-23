"""
Pydantic schemas for the College Laboratory Record Automation System.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ExperimentData(BaseModel):
    experiment_number: str = Field(..., description="Explicit user-provided experiment number (e.g. '1.D', '24')")
    title: str = Field(..., description="Main experiment title (e.g. 'COMPREHENSION')")
    subtitle: Optional[str] = Field("", description="Optional experiment subtitle or topic (e.g. 'TUPLE COMPREHENSION')")
    date: Optional[str] = Field("", description="Date of experiment (e.g. '23-09-2026')")
    aim: str = Field(..., description="Aim / Objective of the experiment")
    algorithm: str = Field(..., description="Algorithm steps (numbered, multiline, or bulleted)")
    coding: str = Field(..., description="Source code or program listing (indentation preserved)")
    output: Optional[str] = Field("", description="Program execution output text")
    output_images: Optional[List[str]] = Field(default_factory=list, description="Base64 encoded strings or file paths of output screenshots")
    result: str = Field(..., description="Result statement")
    student_name: Optional[str] = Field("ADARSH MENON", description="Student Name for footer")
    register_number: Optional[str] = Field("714025247005", description="Register / Roll Number for footer")

class MarginConfig(BaseModel):
    top: float = 0.75
    bottom: float = 0.75
    left: float = 0.75
    right: float = 0.75

class PageDimensions(BaseModel):
    width: float = 8.27
    height: float = 11.69

class TemplateConfig(BaseModel):
    id: str = "python_lab_reference"
    name: str = "Python / AI-ML Lab Record Template"
    description: Optional[str] = "Standard university format with facing Output/Experiment pages and Evaluation table"
    page_size: PageDimensions = Field(default_factory=PageDimensions)
    margins: MarginConfig = Field(default_factory=MarginConfig)
    has_page_border: bool = True
    font_family: str = "Times New Roman"
    code_font_family: str = "Courier New"
    title_font_size: int = 12
    heading_font_size: int = 12
    body_font_size: int = 11
    code_font_size: int = 10
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
