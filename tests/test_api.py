"""
Integration tests for FastAPI endpoints.
"""
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "version" in data

def test_list_templates():
    res = client.get("/api/templates")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_parse_experiment_text():
    sample_text = """
    EX NO: 25
    DATE: 23-09-2026
    TITLE: DECISION TREE
    AIM:
    To build a decision tree classifier.
    ALGORITHM:
    1. Load data.
    2. Fit tree.
    CODING:
    clf.fit(X, y)
    OUTPUT:
    Accuracy = 95%
    RESULT:
    Successfully classified.
    """
    res = client.post("/api/experiment/parse-text", json={"text": sample_text})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    parsed = data["data"]
    assert parsed["experiment_number"] == "25"
    assert parsed["title"] == "DECISION TREE"
    assert "build a decision tree" in parsed["aim"]
    assert "clf.fit" in parsed["coding"]
    assert "Accuracy = 95%" in parsed["output"]

def test_preview_experiment():
    payload = {
        "experiment": {
            "experiment_number": "1.D",
            "title": "GENERATOR TEST",
            "subtitle": "PYTHON",
            "date": "23-09-2026",
            "aim": "To test preview",
            "algorithm": "1. Do step 1\n2. Do step 2",
            "coding": "print(1)",
            "output": "1",
            "result": "Passed"
        }
    }
    res = client.post("/api/experiment/preview", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["total_pages"] == 4
    assert len(data["pages"]) == 4

def test_generate_experiment():
    payload = {
        "experiment": {
            "experiment_number": "1.F",
            "title": "API GENERATION TEST",
            "subtitle": "UNIT TEST",
            "date": "23-09-2026",
            "aim": "Testing API generate endpoint.",
            "algorithm": "1. Call API.",
            "coding": "response = client.post(...)",
            "output": "Status 200",
            "result": "Generated successfully."
        }
    }
    res = client.post("/api/experiment/generate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "filename" in data
    assert data["download_url"].startswith("/api/download/")

def test_ai_assist_endpoint():
    res = client.post("/api/ai/suggest", json={
        "field": "algorithm",
        "content": "Load the dataset\nSplit train test\nFit the model",
        "mode": "format"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["suggestions"]) > 0
    assert "Step 1: Load the dataset." in data["suggestions"][0]["suggested"]
    assert "Step 2: Split train test." in data["suggestions"][0]["suggested"]
    assert "Step 3: Fit the model." in data["suggestions"][0]["suggested"]
