"""
Main FastAPI Application for the College Laboratory Record Automation System.
"""
import os
import uuid
import shutil
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from .models.schemas import (
    ExperimentData,
    TemplateConfig,
    AnalysisResult,
    ContinuationRequest,
    GenerationRequest,
    GenerationResponse,
    ValidationReport,
    Draft,
    AiAssistRequest,
    AiAssistResponse
)
from .template.analyzer import TemplateAnalyzer
from .template.template_store import TemplateStore
from .generator.docx_generator import DocxGenerator
from .parser.section_parser import SectionParser
from .parser.ai_parser import AiParser
from .validator.page_checker import PageChecker
from .layout.page_engine import PageEngine

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
GENERATED_DIR = os.path.join(BASE_DIR, "generated")
DRAFTS_DIR = os.path.join(BASE_DIR, "drafts")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

for d in [UPLOAD_DIR, GENERATED_DIR, DRAFTS_DIR]:
    os.makedirs(d, exist_ok=True)

app = FastAPI(
    title="College Lab Record Automation System",
    description="Automates creation and continuation of college laboratory record documents with facing-page print layout.",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Template Store
template_store = TemplateStore()

@app.get("/health")
def health_check():
    """Health check endpoint for deployment monitoring."""
    return {"status": "ok", "version": "1.0.0", "service": "record-ai"}

@app.get("/api/templates", response_model=List[TemplateConfig])
def list_templates():
    """Returns all available laboratory record templates."""
    return template_store.list_templates()

@app.post("/api/template/save")
def save_template(config: TemplateConfig):
    """Saves a calibrated template configuration."""
    tmpl_id = template_store.save_template(config)
    return {"success": True, "template_id": tmpl_id}

@app.post("/api/upload/template", response_model=AnalysisResult)
async def upload_template(file: UploadFile = File(...)):
    """Uploads and analyzes a DOCX template file."""
    if not file.filename.endswith(".docx"):
        raise HTTPException(status_code=400, detail="Only .docx files are accepted as templates.")

    file_id = f"template_{uuid.uuid4().hex[:8]}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, file_id)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    analysis = TemplateAnalyzer.analyze_docx(file_path)
    if analysis.success and analysis.template_config:
        template_store.save_template(analysis.template_config)

    return analysis

@app.post("/api/upload/document", response_model=AnalysisResult)
async def upload_existing_document(file: UploadFile = File(...)):
    """Uploads and analyzes an existing lab record document for continuation."""
    if not file.filename.endswith(".docx"):
        raise HTTPException(status_code=400, detail="Only .docx files are accepted.")

    file_id = f"record_{uuid.uuid4().hex[:8]}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, file_id)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    analysis = TemplateAnalyzer.analyze_docx(file_path)
    analysis.filename = file_id  # pass back stored filename for continuation request
    return analysis

@app.post("/api/experiment/parse-text")
def parse_experiment_text(payload: dict):
    """Parses raw text into structured experiment fields."""
    raw_text = payload.get("text", "")
    parsed = SectionParser.parse_raw_text(raw_text)
    return {"success": True, "data": parsed}

@app.post("/api/experiment/preview")
def preview_experiment(payload: GenerationRequest):
    """
    Generates preview data for facing-page simulation (Left Output, Right Experiment).
    """
    exp = payload.experiment
    tmpl = template_store.get_template(payload.template_id or "python_lab_reference")
    plan = PageEngine.plan_experiment(exp, tmpl)
    return {
        "success": True,
        "experiment_number": exp.experiment_number,
        "title": exp.title,
        "subtitle": exp.subtitle,
        "date": exp.date,
        "total_pages": plan.total_pages,
        "pages": [p.model_dump() for p in plan.pages]
    }

@app.post("/api/experiment/generate", response_model=GenerationResponse)
def generate_new_record(req: GenerationRequest):
    """Generates a new laboratory record document from scratch."""
    exp = req.experiment
    tmpl = template_store.get_template(req.template_id or "python_lab_reference")

    clean_num = exp.experiment_number.replace(".", "_").replace(" ", "_")
    output_filename = f"Lab_Record_Exp_{clean_num}_{uuid.uuid4().hex[:6]}.docx"
    output_path = os.path.join(GENERATED_DIR, output_filename)

    DocxGenerator.generate_new_record(exp, tmpl, output_path)

    # Validate output
    val_report = PageChecker.validate_document(output_path, exp)

    return GenerationResponse(
        success=val_report.is_valid,
        filename=output_filename,
        download_url=f"/api/download/{output_filename}",
        message="Laboratory record successfully generated.",
        experiment_number=exp.experiment_number,
        total_pages_estimated=4,
        is_continuation=False,
        warnings=val_report.warnings
    )

@app.post("/api/record/continue", response_model=GenerationResponse)
def continue_record(req: ContinuationRequest):
    """
    Appends a new experiment to an existing uploaded document,
    strictly protecting the original file.
    """
    exp = req.experiment
    tmpl = template_store.get_template(req.template_id or "python_lab_reference")

    original_path = os.path.join(UPLOAD_DIR, req.original_filename)
    # Check fallback in saved_templates if testing with reference
    if not os.path.exists(original_path):
        ref_path = os.path.join(BASE_DIR, "templates", "saved_templates", req.original_filename)
        if os.path.exists(ref_path):
            original_path = ref_path
        else:
            raise HTTPException(status_code=404, detail=f"Original document not found: {req.original_filename}")

    base_name = os.path.splitext(os.path.basename(req.original_filename))[0]
    output_filename = f"{base_name}_Updated.docx"
    output_path = os.path.join(GENERATED_DIR, output_filename)

    DocxGenerator.continue_existing_record(original_path, exp, tmpl, output_path)

    # Validate output
    val_report = PageChecker.validate_document(output_path, exp)

    return GenerationResponse(
        success=val_report.is_valid,
        filename=output_filename,
        download_url=f"/api/download/{output_filename}",
        message=f"Experiment {exp.experiment_number} successfully appended to existing record.",
        experiment_number=exp.experiment_number,
        total_pages_estimated=4,
        is_continuation=True,
        warnings=val_report.warnings
    )

@app.get("/api/download/{filename}")
def download_generated_file(filename: str):
    """Downloads a generated record file."""
    # Prevent path traversal
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(GENERATED_DIR, safe_filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Requested file not found.")

    return FileResponse(
        path=file_path,
        filename=safe_filename,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

@app.post("/api/record/validate", response_model=ValidationReport)
def validate_record(payload: dict):
    """Validates an uploaded or generated DOCX."""
    fname = payload.get("filename")
    if not fname:
        raise HTTPException(status_code=400, detail="Filename required.")
    fpath = os.path.join(GENERATED_DIR, fname)
    if not os.path.exists(fpath):
        fpath = os.path.join(UPLOAD_DIR, fname)
    if not os.path.exists(fpath):
        raise HTTPException(status_code=404, detail="File not found.")

    return PageChecker.validate_document(fpath)

@app.post("/api/ai/suggest", response_model=AiAssistResponse)
def ai_assist(req: AiAssistRequest):
    """Optional AI assistant for algorithm formatting, code indentation, and spelling."""
    return AiParser.assist(req)

# Serve Frontend static files if directory exists
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
