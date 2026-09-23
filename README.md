# College Laboratory Record Automation System

A production-grade, template-aware document automation platform that eliminates the repetitive formatting workload faced by college students when preparing laboratory records.

The system learns the exact visual layout, table structures, page borders, typography, and duplex facing-page arrangement of an uploaded Word document (`.docx`) and deterministically reproduces it for new experiments or safely appends them to ongoing records.

---

## 🎯 The Real-World Problem Solved

College students do not just type experiment text—they have to reproduce strict departmental Word templates with exact formatting requirements:

* **Facing-Page Layout**: Physical records are bound such that the **Left-side page** is reserved for Output (console logs/screenshots) while the **Right-side page** contains Experiment Title, Aim, Algorithm, Program, Result, and Evaluation marks table.
* **Continuing Records**: A student with Experiments 1–23 already written cannot risk re-creating or corrupting the document to add Experiment 24.
* **Non-Sequential Numbering**: Experiments are often numbered `1.A`, `1.B`, `1.C` or non-consecutive integers (`20`, `21`, `23`). The system treats experiment numbers as explicit user inputs and never invents missing experiments.
* **Code Indentation**: Code formatting and 4-space indents are preserved verbatim in monospace Courier New without Word destroying the indentation.
* **Master Evaluation Table**: The 4-row evaluation marks table (`PROGRAM AND EXECUTION`, `CLASS PERFORMANCE`, `VIVA`, `TOTAL`) is cloned directly from the template XML and is never generated or altered by AI.

---

## 🏛️ Architecture Overview

```
[ User Input / Template Upload ]
               │
               ▼
┌───────────────────────────────────────────────┐
│              FastAPI Backend                  │
│                                               │
│  ┌───────────────────┐  ┌──────────────────┐  │
│  │ Template Analyzer │  │  Section Parser  │  │
│  │ (XML, Fonts,      │  │ (Aim, Algorithm, │  │
│  │  Tables, Margins) │  │  Code, Output)   │  │
│  └─────────┬─────────┘  └────────┬─────────┘  │
│            │                     │            │
│            ▼                     ▼            │
│  ┌─────────────────────────────────────────┐  │
│  │   Deterministic Page & Pairing Engine   │  │
│  │  - Left Page: Output (Text / Image)     │  │
│  │  - Right Page: Exp Header, Aim, Algo,   │  │
│  │    Coding, Evaluation Table, Result     │  │
│  │  - Overflow & Blank-Page Guard          │  │
│  └──────────────────┬──────────────────────┘  │
│                     │                         │
│                     ▼                         │
│  ┌─────────────────────────────────────────┐  │
│  │        DOCX Generator & Cloner          │  │
│  │  - Table-based Experiment Header        │  │
│  │  - Master Evaluation Table              │  │
│  │  - Section Page Borders (w:pgBorders)   │  │
│  │  - Student Footer (Name & Roll No)      │  │
│  │  - Continuation Mode (SHA-256 Protected)│  │
│  └──────────────────┬──────────────────────┘  │
│                     │                         │
│                     ▼                         │
│  ┌─────────────────────────────────────────┐  │
│  │   Document Validator & XML Inspector    │  │
│  └─────────────────────────────────────────┘  │
└──────────────────────┬────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────┐
│               Frontend Web App                │
│  - Dashboard & Dual-Mode Selector             │
│  - Mode A: Create New Record                  │
│  - Mode B: Continue Existing Record           │
│  - Facing-Pages (Left/Right) Print Preview    │
│  - Code Editor with Indentation Preservation  │
│  - Output Screenshot & Text Upload            │
│  - Template Manager & Calibration Lock        │
└───────────────────────────────────────────────┘
```

---

## ✨ Key Features

1. **Mode A: Create New Record**:
   - Selects a calibrated template or uploads a custom `.docx`.
   - Populates structured fields (Number, Title, Subtitle, Date, Aim, Algorithm, Code, Output, Result).
   - Generates an accurate `.docx` with facing-page alignment.
2. **Mode B: Continue Existing Record**:
   - Uploads an existing completed/partial record.
   - Detects all existing experiments (e.g., `1.A`, `1.B`, `1.C`) and total pages.
   - Appends the new experiment to a new file `{Original}_Updated.docx`.
   - **SHA-256 Integrity Verification**: Guarantees the original file remains 100% untouched.
3. **Facing-Page Print Layout**:
   - **Page 1 (Right Page)**: Header Table, AIM, ALGORITHM, CODING (Part 1).
   - **Page 2 (Left Page)**: OUTPUT (console output and/or screenshot).
   - **Page 3 (Right Page)**: CODING continuation, Master Evaluation Table, RESULT.
   - **Page 4 (Left Page)**: Blank/Back page (with running footer & page border).
4. **Interactive Print Preview**:
   - Live dual-page spread simulation directly in the browser showing Left Output and Right Experiment side-by-side.
5. **Code Indentation Preservation**:
   - Strict preservation of spaces, tabs, and indentation structure.
6. **Optional AI Formatting Assistant**:
   - Auto-numbers algorithm steps, normalizes 4-space code indentation, and fixes typos.
   - **Zero silent changes**: Every suggestion is displayed with a side-by-side diff requiring explicit user acceptance.
7. **Document Validator**:
   - Automated post-generation checks verifying XML syntax, mandatory academic sections, evaluation table presence, and user experiment number matching.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Python 3.10+
- `pip`

### 2. Clone and Setup
```bash
git clone https://github.com/adarshmenon/college-lab-record-system.git
cd college-lab-record-system

# Optional: Create virtual environment
python -m venv venv
venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On Linux/macOS

# Install dependencies
pip install -r requirements.txt
```

### 3. Generate Golden Reference Template
```bash
python templates/saved_templates/create_reference_template.py
```

### 4. Run the Application
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
Open your browser at **`http://localhost:8000`**.

---

## 🧪 Running Automated Tests

Run the complete test suite:
```bash
pytest tests/ -v
```

Test coverage includes:
- `test_analyzer.py`: Table detection, font profiling, footer extraction, and margin analysis.
- `test_generator.py`: Short experiments, long algorithms, long code (>50 lines), image output, text+image, custom numbers.
- `test_continuation.py`: Record continuation, SHA-256 integrity of original file, non-sequential numbering.
- `test_page_engine.py`: Page budget calculations, overflow line distribution, facing page classification.
- `test_validator.py`: Post-generation XML validation and pass conditions.
- `test_api.py`: FastAPI endpoints integration.

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health check and deployment status |
| `GET` | `/api/templates` | Lists all saved and calibrated templates |
| `POST` | `/api/upload/template` | Uploads and calibrates a new `.docx` template |
| `POST` | `/api/upload/document` | Analyzes an existing record for continuation |
| `POST` | `/api/experiment/parse-text` | Parses unstructured experiment notes into fields |
| `POST` | `/api/experiment/preview` | Generates facing-page preview layout |
| `POST` | `/api/experiment/generate` | Generates a new laboratory record `.docx` |
| `POST` | `/api/record/continue` | Appends an experiment to an existing record |
| `GET` | `/api/download/{filename}` | Downloads generated `.docx` document |
| `POST` | `/api/ai/suggest` | Optional AI formatting suggestions |

---

## ☁️ Deployment (Render)

This repository includes a `render.yaml` configuration for one-click deployment:

1. Connect this repository to Render.
2. Render automatically uses:
   - **Build Command**: `pip install -r requirements.txt && python templates/saved_templates/create_reference_template.py`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`

> **Note on Render Ephemeral Storage**: Render free-tier web services use ephemeral local storage. In production, generated files are served directly via `/api/download/{filename}` for immediate client-side download.
