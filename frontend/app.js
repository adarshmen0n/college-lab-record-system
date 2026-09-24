/**
 * RECORDEXT - College Laboratory Record Automation System
 * Frontend Application Logic (v4.5 - Multi-Experiment Workspace & Paginated Document Preview)
 */

document.addEventListener("DOMContentLoaded", () => {
  // Smart API Base determination:
  const API_BASE = (window.location.protocol === "file:" || !window.location.host)
    ? "https://college-lab-record-system.onrender.com"
    : "";

  // State
  let currentMode = "create"; // "create", "workspace", "continue", "drafts"
  let uploadedRecordFileId = null;
  let attachedImageData = null;
  let activeAiTargetField = null;
  let activeAiSuggestion = null;
  let editingWorkspaceId = null;

  // Viewer State
  let currentViewMode = "spread"; // "spread", "single", "all"
  let currentPageIndex = 1;
  let currentZoom = 1.0;
  let cachedPages = [];
  let previewDebounceTimer = null;

  // DOM Elements - Navigation
  const tabBtns = document.querySelectorAll(".nav-tabs .tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  const workspaceCountSpan = document.getElementById("workspace-count");
  const draftCountSpan = document.getElementById("draft-count");

  // DOM Elements - Form Inputs
  const expNumberInput = document.getElementById("exp-number");
  const expDateInput = document.getElementById("exp-date");
  const expTitleInput = document.getElementById("exp-title");
  const expSubtitleInput = document.getElementById("exp-subtitle");
  const studentNameInput = document.getElementById("student-name");
  const registerNumberInput = document.getElementById("register-number");
  const expAimInput = document.getElementById("exp-aim");
  const expAlgoInput = document.getElementById("exp-algo");
  const expCodeInput = document.getElementById("exp-code");
  const expOutputInput = document.getElementById("exp-output");
  const expResultInput = document.getElementById("exp-result");

  // DOM Elements - Output Tabs
  const outputTabBtns = document.querySelectorAll(".output-tab-btn");
  const outputTextArea = document.getElementById("output-text-area");
  const outputImageArea = document.getElementById("output-image-area");
  const imageUploader = document.getElementById("image-uploader");
  const outputImgInput = document.getElementById("output-img-input");
  const imagePreview = document.getElementById("image-preview");

  // DOM Elements - Dropzone
  const recordDropzone = document.getElementById("record-dropzone");
  const recordFileInput = document.getElementById("input-record-file");
  const recordAnalysisBox = document.getElementById("record-analysis-box");
  const analyzedFilename = document.getElementById("analyzed-filename");
  const detectedExpTags = document.getElementById("detected-exp-tags");
  const statTotalPages = document.getElementById("stat-total-pages");
  const statStudentRoll = document.getElementById("stat-student-roll");

  // DOM Elements - Workspace Tab & Card Elements
  const wsStatCount = document.getElementById("ws-stat-count");
  const wsStatPages = document.getElementById("ws-stat-pages");
  const wsBtnExpCount = document.getElementById("ws-btn-exp-count");
  const workspaceCardsList = document.getElementById("workspace-cards-list");
  const btnWsNewExp = document.getElementById("btn-ws-new-exp");
  const btnWsClear = document.getElementById("btn-ws-clear");
  const btnWsGenerate = document.getElementById("btn-ws-generate");
  const btnWsPreview = document.getElementById("btn-ws-preview");
  const btnWsAddSample = document.getElementById("btn-ws-add-sample");
  const workspaceEditAlert = document.getElementById("workspace-edit-alert");
  const wsEditingLabel = document.getElementById("ws-editing-label");
  const btnCancelWsEdit = document.getElementById("btn-cancel-ws-edit");
  const btnSaveWorkspace = document.getElementById("btn-save-workspace");

  // DOM Elements - Form Action Buttons & Banners
  const btnSampleData = document.getElementById("btn-sample-data");
  const btnClearForm = document.getElementById("btn-clear-form");
  const btnPreview = document.getElementById("btn-preview");
  const btnGenerate = document.getElementById("btn-generate");
  const btnDownloadFile = document.getElementById("btn-download-file");
  const generationBanner = document.getElementById("generation-banner");
  const inlineStatusBanner = document.getElementById("inline-status-banner");
  const btnSaveDraft = document.getElementById("btn-save-draft");
  const btnFloatingPreview = document.getElementById("btn-floating-preview");

  // DOM Elements - Paginated Viewer
  const paginatedPagesContainer = document.getElementById("paginated-pages-container");
  const viewerPageInput = document.getElementById("viewer-page-input");
  const viewerTotalPages = document.getElementById("viewer-total-pages");
  const btnPrevPage = document.getElementById("btn-prev-page");
  const btnNextPage = document.getElementById("btn-next-page");
  const viewModeBtns = document.querySelectorAll(".view-mode-toggle .view-btn");
  const btnZoomOut = document.getElementById("btn-zoom-out");
  const btnZoomIn = document.getElementById("btn-zoom-in");
  const btnZoomFit = document.getElementById("btn-zoom-fit");
  const zoomLabel = document.getElementById("zoom-label");
  const btnPrintPreview = document.getElementById("btn-print-preview");

  // DOM Elements - Modals
  const aiModal = document.getElementById("ai-modal");
  const btnCloseModal = document.getElementById("btn-close-modal");
  const btnAcceptAi = document.getElementById("btn-accept-ai");
  const btnRejectAi = document.getElementById("btn-reject-ai");
  const modalRationale = document.getElementById("modal-rationale");
  const diffOriginal = document.getElementById("diff-original");
  const diffSuggested = document.getElementById("diff-suggested");

  const importModal = document.getElementById("import-modal");
  const btnImportNotes = document.getElementById("btn-import-notes");
  const btnCloseImport = document.getElementById("btn-close-import");
  const btnCancelImport = document.getElementById("btn-cancel-import");
  const btnApplyImport = document.getElementById("btn-apply-import");
  const importRawText = document.getElementById("import-raw-text");

  // --- DEFAULT STANDARD EXPERIMENTS ---
  const DEFAULT_EXPERIMENT = {
    id: "exp_default_1",
    experiment_number: "1.D",
    date: "23-09-2026",
    title: "COMPREHENSION",
    subtitle: "GENERATOR COMPREHENSION",
    student_name: "ADARSH MENON",
    register_number: "714025247005",
    procedure_heading: "ALGORITHM",
    aim: "To create a generator using generator comprehension and iterate over elements using functions.",
    algorithm: "1. Define a generator function to create squared values.\n2. Use generator comprehension syntax with parentheses.\n3. Iterate over the generator object.\n4. Display the yielded values.",
    code_heading: "CODING",
    coding: `def generate_squares(n):
    return (x**2 for x in range(n))

def main():
    print("Generating squares up to 5:")
    squares = generate_squares(5)
    for val in squares:
        print(f"Square: {val}")

if __name__ == "__main__":
    main()`,
    output: "Generating squares up to 5:\nSquare: 0\nSquare: 1\nSquare: 4\nSquare: 9\nSquare: 16",
    output_images: [],
    result: "The generator comprehension was implemented successfully and values were yielded on demand."
  };

  const SAMPLE_EXPERIMENT_2 = {
    id: "exp_sample_2",
    experiment_number: "2.A",
    date: "24-09-2026",
    title: "LAMBDA FUNCTIONS AND MAP FILTER REDUCE",
    subtitle: "FUNCTIONAL PROGRAMMING",
    student_name: "ADARSH MENON",
    register_number: "714025247005",
    procedure_heading: "ALGORITHM",
    aim: "To implement anonymous lambda functions and apply map, filter, and reduce operations in Python.",
    algorithm: "1. Start the program.\n2. Define a list of integer values.\n3. Apply lambda with map to double the elements.\n4. Use filter to select even numbers.\n5. Compute sum of filtered elements using reduce.\n6. Display transformed results and stop.",
    code_heading: "CODING",
    coding: `from functools import reduce

nums = [1, 2, 3, 4, 5, 6]
doubled = list(map(lambda x: x * 2, nums))
evens = list(filter(lambda x: x % 2 == 0, doubled))
total = reduce(lambda a, b: a + b, evens)

print(f"Original: {nums}")
print(f"Doubled: {doubled}")
print(f"Evens: {evens}")
print(f"Sum: {total}")`,
    output: "Original: [1, 2, 3, 4, 5, 6]\nDoubled: [2, 4, 6, 8, 10, 12]\nEvens: [2, 4, 6, 8, 10, 12]\nSum: 42",
    output_images: [],
    result: "The functional programming tools (lambda, map, filter, reduce) were implemented and verified."
  };

  const allInputs = [
    expNumberInput, expDateInput, expTitleInput, expSubtitleInput,
    studentNameInput, registerNumberInput, expAimInput, expAlgoInput,
    expCodeInput, expOutputInput, expResultInput
  ];

  // Utility: HTML Escaper
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Helper to display status banner
  function showStatus(type, message, htmlContent = null) {
    if (!inlineStatusBanner) return;
    inlineStatusBanner.className = `inline-status-banner status-${type}`;
    if (htmlContent) {
      inlineStatusBanner.innerHTML = htmlContent;
    } else {
      inlineStatusBanner.textContent = message;
    }
    inlineStatusBanner.classList.remove("hidden");
  }

  // --- PROMPT LEAKAGE SANITIZER ---
  const LEAKAGE_PATTERNS = [
    /#?\s*PROJECT\s+UPDATE/i,
    /EXPERIMENT\s+HEADER\s*\+?\s*TYPOGRAPHY\s+CORRECTION/i,
    /You\s+are\s+modifying\s+the\s+existing/i,
    /You\s+are\s+working\s+on\s+the\s+existing/i,
    /You\s+are\s+fixing\s+an\s+existing/i,
    /Do\s+NOT\s+rebuild\s+the\s+project/i,
    /Inspect\s+the\s+current\s+implementation/i,
    /FINAL\s+MASTER\s+EXECUTION\s+PROMPT/i,
    /FINAL\s+MASTER\s+FIX/i,
    /STOP\s*[—–-]\s*CURRENT\s+OUTPUT/i,
    /CURRENT\s+OUTPUT\s+HAS\s+FAILED/i,
    /THE\s+CURRENT\s+OUTPUT\s+IS\s+NOT\s+ACCEPTED/i,
    /FIRST\s+FIX/i,
    /TRACE\s+THE\s+ENTIRE\s+DATA\s+PIPELINE/i,
    /GENERAL\s+COLLEGE\s+LABORATORY\s+RECORD\s+AUTOMATION\s+SYSTEM/i,
    /COMPLETE\s+TEMPLATE\s+MATCHING/i,
    /DO\s+NOT\s+APPROXIMATE/i,
    /DO\s+NOT\s+DESIGN\s+THE\s+DOCUMENT/i,
    /MASTER\s+UPDATE\s+PROMPT/i,
    /ANTIGRAVITY/i,
    /DEVELOPER\s+INSTRUCTIONS/i,
    /SYSTEM\s+PROMPT/i
  ];

  function sanitizeFieldText(text) {
    if (!text) return "";
    const lines = text.split("\n");
    const filtered = lines.filter(line => !LEAKAGE_PATTERNS.some(pat => pat.test(line)));
    return filtered.join("\n").trim();
  }

  function sanitizeExperiment(exp) {
    if (!exp) return exp;
    return {
      ...exp,
      title: sanitizeFieldText(exp.title) || "LAB EXPERIMENT",
      subtitle: sanitizeFieldText(exp.subtitle),
      aim: sanitizeFieldText(exp.aim) || "To execute and verify the laboratory experiment.",
      algorithm: sanitizeFieldText(exp.algorithm) || "1. Initialize variables.\n2. Execute logic.\n3. Display results.",
      coding: sanitizeFieldText(exp.coding) || "def main():\n    print(\"Executed successfully\")",
      output: sanitizeFieldText(exp.output),
      result: sanitizeFieldText(exp.result) || "The experiment was successfully executed."
    };
  }

  // --- WORKSPACE STORAGE HELPERS ---
  const WS_STORAGE_KEY = "recordext_workspace_v2";

  function getWorkspaceExperiments() {
    try {
      const data = localStorage.getItem(WS_STORAGE_KEY);
      if (!data) {
        // Initialize with default experiment on first run
        const initial = [DEFAULT_EXPERIMENT];
        localStorage.setItem(WS_STORAGE_KEY, JSON.stringify(initial));
        return initial;
      }
      const list = JSON.parse(data);
      // Cleanse any old cached instructions from localStorage
      return list.map(exp => sanitizeExperiment(exp));
    } catch (e) {
      console.error("Workspace load error:", e);
      return [];
    }
  }

  function saveWorkspaceExperiments(list) {
    try {
      localStorage.setItem(WS_STORAGE_KEY, JSON.stringify(list));
      renderWorkspaceUI();
    } catch (e) {
      console.error("Workspace save error:", e);
    }
  }

  function getCurrentFormExperiment() {
    const raw = {
      id: editingWorkspaceId || `exp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      experiment_number: (expNumberInput.value.trim()) || "1.D",
      title: (expTitleInput.value.trim()) || "LAB EXPERIMENT",
      subtitle: (expSubtitleInput.value.trim()) || "",
      date: (expDateInput.value.trim()) || "23-09-2026",
      student_name: (studentNameInput.value.trim()) || "ADARSH MENON",
      register_number: (registerNumberInput.value.trim()) || "714025247005",
      aim: (expAimInput.value.trim()) || "To execute and verify the laboratory experiment.",
      procedure_heading: "ALGORITHM",
      algorithm: (expAlgoInput.value.trim()) || "1. Start\n2. Execute program\n3. Stop",
      code_heading: "CODING",
      coding: expCodeInput.value || "def main():\n    pass",
      output: expOutputInput.value || "Program execution output...",
      output_images: attachedImageData ? [attachedImageData] : [],
      result: (expResultInput.value.trim()) || "The program was executed and verified successfully."
    };
    return sanitizeExperiment(raw);
  }

  function fillExperimentForm(data) {
    if (!data) return;
    if (expNumberInput) expNumberInput.value = data.experiment_number || data.num || "1.D";
    if (expDateInput) expDateInput.value = data.date || "23-09-2026";
    if (expTitleInput) expTitleInput.value = data.title || "COMPREHENSION";
    if (expSubtitleInput) expSubtitleInput.value = data.subtitle || data.sub || "";
    if (studentNameInput) studentNameInput.value = data.student_name || "ADARSH MENON";
    if (registerNumberInput) registerNumberInput.value = data.register_number || "714025247005";
    if (expAimInput) expAimInput.value = data.aim || "";
    if (expAlgoInput) expAlgoInput.value = data.algorithm || data.algo || "";
    if (expCodeInput) expCodeInput.value = data.coding || data.code || "";
    if (expOutputInput) expOutputInput.value = data.output || "";
    if (expResultInput) expResultInput.value = data.result || "";

    if (data.output_images && data.output_images.length > 0) {
      attachedImageData = data.output_images[0];
      if (imagePreview) {
        imagePreview.innerHTML = `<img src="${attachedImageData}" alt="Screenshot">`;
        imagePreview.classList.remove("hidden");
      }
    } else {
      attachedImageData = null;
      if (imagePreview) {
        imagePreview.innerHTML = "";
        imagePreview.classList.add("hidden");
      }
    }

    allInputs.forEach(i => { if (i) i.classList.remove("has-error"); });
    if (inlineStatusBanner) inlineStatusBanner.classList.add("hidden");

    schedulePreviewUpdate();
  }

  function clearExperimentForm() {
    editingWorkspaceId = null;
    if (workspaceEditAlert) workspaceEditAlert.classList.add("hidden");
    if (expNumberInput) expNumberInput.value = "";
    if (expDateInput) expDateInput.value = new Date().toLocaleDateString("en-GB").replace(/\//g, "-");
    if (expTitleInput) expTitleInput.value = "";
    if (expSubtitleInput) expSubtitleInput.value = "";
    if (expAimInput) expAimInput.value = "";
    if (expAlgoInput) expAlgoInput.value = "";
    if (expCodeInput) expCodeInput.value = "";
    if (expOutputInput) expOutputInput.value = "";
    if (expResultInput) expResultInput.value = "";
    attachedImageData = null;
    if (imagePreview) {
      imagePreview.innerHTML = "";
      imagePreview.classList.add("hidden");
    }
    allInputs.forEach(i => { if (i) i.classList.remove("has-error"); });
    if (inlineStatusBanner) inlineStatusBanner.classList.add("hidden");
    schedulePreviewUpdate();
  }

  // --- WORKSPACE UI RENDERER ---
  function renderWorkspaceUI() {
    const list = getWorkspaceExperiments();

    if (workspaceCountSpan) workspaceCountSpan.textContent = list.length;
    if (wsStatCount) wsStatCount.textContent = list.length;
    if (wsStatPages) wsStatPages.textContent = list.length * 4;
    if (wsBtnExpCount) wsBtnExpCount.textContent = list.length;

    if (!workspaceCardsList) return;

    if (list.length === 0) {
      workspaceCardsList.innerHTML = `
        <div class="empty-state" id="workspace-empty-state">
          <div class="empty-icon">📂</div>
          <h3>Your workspace is empty</h3>
          <p>Create an experiment in the editor and click "Save to Workspace", or click below to start with a sample experiment.</p>
          <button class="btn btn-secondary btn-sm" id="btn-ws-add-sample" type="button" style="margin-top: 0.75rem;">Add Sample Experiment</button>
        </div>
      `;
      const sBtn = document.getElementById("btn-ws-add-sample");
      if (sBtn) sBtn.addEventListener("click", () => addSampleToWorkspace());
      return;
    }

    workspaceCardsList.innerHTML = "";
    list.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = `ws-card ${editingWorkspaceId === item.id ? 'is-active-editing' : ''}`;
      card.innerHTML = `
        <div class="ws-card-left">
          <div class="ws-card-order">#${index + 1}</div>
          <div class="ws-card-details">
            <div class="ws-card-header">
              <span class="ws-card-badge">Exp ${escapeHtml(item.experiment_number)}</span>
              <strong class="ws-card-title">${escapeHtml(item.title)}</strong>
            </div>
            <div class="ws-card-meta">
              <span>📅 ${escapeHtml(item.date || 'No Date')}</span>
              ${item.subtitle ? `<span>• 🏷 ${escapeHtml(item.subtitle)}</span>` : ''}
              <span>• 📄 4 Pages (Facing Spread)</span>
            </div>
            <div class="ws-card-snippet">
              <strong>Aim:</strong> ${escapeHtml(item.aim || 'No aim specified')}
            </div>
          </div>
        </div>
        <div class="ws-card-actions">
          <button class="btn btn-secondary btn-xs" title="Edit this experiment" data-action="edit" data-id="${item.id}">✏ Edit</button>
          <button class="btn btn-secondary btn-xs" title="Duplicate experiment" data-action="duplicate" data-id="${item.id}">📑 Duplicate</button>
          <button class="btn btn-secondary btn-xs" title="Move Up" data-action="up" data-id="${item.id}" ${index === 0 ? 'disabled' : ''}>▲</button>
          <button class="btn btn-secondary btn-xs" title="Move Down" data-action="down" data-id="${item.id}" ${index === list.length - 1 ? 'disabled' : ''}>▼</button>
          <button class="btn btn-secondary btn-xs" style="color:#dc2626;" title="Delete experiment" data-action="delete" data-id="${item.id}">🗑</button>
        </div>
      `;
      workspaceCardsList.appendChild(card);
    });

    // Wire up workspace card actions
    workspaceCardsList.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const action = btn.getAttribute("data-action");
        const id = btn.getAttribute("data-id");
        handleWorkspaceAction(action, id);
      });
    });
  }

  function handleWorkspaceAction(action, id) {
    const list = getWorkspaceExperiments();
    const index = list.findIndex(i => i.id === id);
    if (index === -1) return;

    if (action === "edit") {
      const item = list[index];
      editingWorkspaceId = item.id;
      fillExperimentForm(item);

      if (workspaceEditAlert && wsEditingLabel) {
        wsEditingLabel.textContent = `Exp ${item.experiment_number} - ${item.title}`;
        workspaceEditAlert.classList.remove("hidden");
      }

      // Switch to editor tab
      tabBtns[0].click();
      showStatus("success", `Loaded Exp ${item.experiment_number} for editing.`);
    } else if (action === "duplicate") {
      const original = list[index];
      const copy = JSON.parse(JSON.stringify(original));
      copy.id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      copy.experiment_number = `${original.experiment_number}_Copy`;
      copy.title = `${original.title} (Copy)`;
      list.splice(index + 1, 0, copy);
      saveWorkspaceExperiments(list);
      showStatus("success", `Duplicated Exp ${original.experiment_number}.`);
      schedulePreviewUpdate();
    } else if (action === "up" && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
      saveWorkspaceExperiments(list);
      schedulePreviewUpdate();
    } else if (action === "down" && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
      saveWorkspaceExperiments(list);
      schedulePreviewUpdate();
    } else if (action === "delete") {
      if (confirm(`Remove Experiment ${list[index].experiment_number} from workspace?`)) {
        if (editingWorkspaceId === id) {
          editingWorkspaceId = null;
          if (workspaceEditAlert) workspaceEditAlert.classList.add("hidden");
        }
        list.splice(index, 1);
        saveWorkspaceExperiments(list);
        showStatus("success", "Experiment removed from workspace.");
        schedulePreviewUpdate();
      }
    }
  }

  function addSampleToWorkspace() {
    const list = getWorkspaceExperiments();
    list.push(DEFAULT_EXPERIMENT);
    list.push(SAMPLE_EXPERIMENT_2);
    saveWorkspaceExperiments(list);
    showStatus("success", "Added sample experiments to workspace.");
    schedulePreviewUpdate();
  }

  // --- SAVE TO WORKSPACE FROM FORM ---
  if (btnSaveWorkspace) {
    btnSaveWorkspace.addEventListener("click", () => {
      const expData = getCurrentFormExperiment();

      // Basic validation
      if (!expData.experiment_number || !expData.title) {
        showStatus("error", "Please provide Experiment Number and Title to save to workspace.");
        return;
      }

      let list = getWorkspaceExperiments();
      if (editingWorkspaceId) {
        const idx = list.findIndex(i => i.id === editingWorkspaceId);
        if (idx !== -1) {
          list[idx] = expData;
          showStatus("success", `Updated Experiment ${expData.experiment_number} in workspace.`);
        } else {
          list.push(expData);
        }
      } else {
        list.push(expData);
        showStatus("success", `Added Experiment ${expData.experiment_number} to workspace.`);
      }

      saveWorkspaceExperiments(list);
      editingWorkspaceId = expData.id;
      if (workspaceEditAlert && wsEditingLabel) {
        wsEditingLabel.textContent = `Exp ${expData.experiment_number} - ${expData.title}`;
        workspaceEditAlert.classList.remove("hidden");
      }
      schedulePreviewUpdate();
    });
  }

  if (btnCancelWsEdit) {
    btnCancelWsEdit.addEventListener("click", () => {
      editingWorkspaceId = null;
      if (workspaceEditAlert) workspaceEditAlert.classList.add("hidden");
      showStatus("success", "Exited workspace edit mode.");
      renderWorkspaceUI();
    });
  }

  if (btnWsNewExp) {
    btnWsNewExp.addEventListener("click", () => {
      clearExperimentForm();
      tabBtns[0].click();
      showStatus("success", "Cleared form for a new experiment.");
    });
  }

  if (btnWsClear) {
    btnWsClear.addEventListener("click", () => {
      if (confirm("Are you sure you want to clear all experiments in the workspace?")) {
        localStorage.removeItem(WS_STORAGE_KEY);
        editingWorkspaceId = null;
        if (workspaceEditAlert) workspaceEditAlert.classList.add("hidden");
        renderWorkspaceUI();
        showStatus("success", "Workspace cleared.");
        schedulePreviewUpdate();
      }
    });
  }

  // --- PAGINATED DOCUMENT PREVIEW ENGINE ---
  function schedulePreviewUpdate() {
    if (previewDebounceTimer) clearTimeout(previewDebounceTimer);
    previewDebounceTimer = setTimeout(fetchAndRenderPreview, 250);
  }

  async function fetchAndRenderPreview() {
    let experimentsToPreview = [];

    if (currentMode === "workspace") {
      // In workspace mode, preview all workspace experiments
      experimentsToPreview = getWorkspaceExperiments();
      if (experimentsToPreview.length === 0) {
        experimentsToPreview = [getCurrentFormExperiment()];
      }
    } else {
      // In editor mode, preview the current experiment in the form
      experimentsToPreview = [getCurrentFormExperiment()];
    }

    try {
      const res = await fetch(`${API_BASE}/api/record/preview-workspace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experiments: experimentsToPreview,
          template_id: "python_lab_reference"
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success && data.pages) {
        cachedPages = data.pages;
        renderPaginatedSheets(cachedPages);
      }
    } catch (err) {
      console.warn("Backend preview fetch failed, rendering local model:", err);
      // Fallback local planning for immediate offline feedback
      const localPages = generateLocalPages(experimentsToPreview);
      cachedPages = localPages;
      renderPaginatedSheets(cachedPages);
    }
  }

  function generateLocalPages(experiments) {
    const pages = [];
    const total = experiments.length * 4;
    let pageNo = 1;

    experiments.forEach(exp => {
      const sName = exp.student_name || "ADARSH MENON";
      const rNum = exp.register_number || "714025247005";
      const algoSteps = (exp.algorithm || "").split("\n").map(s => s.replace(/^[0-9]+[.)-]\s*/, "").trim()).filter(Boolean);
      const codeLines = (exp.coding || "").split("\n");
      const outLines = (exp.output || "").split("\n").filter(Boolean);

      // Split code lines approximately
      const splitIdx = Math.min(22, Math.max(12, Math.floor(codeLines.length * 0.6)));
      const codeP1 = codeLines.slice(0, splitIdx);
      const codeP3 = codeLines.slice(splitIdx);

      // Page 1: EXP_START (RIGHT)
      pages.push({
        page_number: pageNo++,
        total_pages: total,
        experiment_number: exp.experiment_number,
        experiment_title: exp.title,
        page_type: "EXP_START",
        side: "RIGHT",
        is_blank: false,
        has_header_table: true,
        header_ex_no: exp.experiment_number,
        header_date: exp.date,
        header_title: exp.title,
        header_subtitle: exp.subtitle,
        aim_heading: "AIM:",
        aim_text: exp.aim,
        procedure_heading: "ALGORITHM:",
        algorithm_steps: algoSteps,
        code_heading: "CODING:",
        code_lines: codeP1,
        footer_left: sName,
        footer_right: rNum
      });

      // Page 2: OUTPUT (LEFT)
      pages.push({
        page_number: pageNo++,
        total_pages: total,
        experiment_number: exp.experiment_number,
        experiment_title: exp.title,
        page_type: "OUTPUT",
        side: "LEFT",
        is_blank: false,
        output_heading: "OUTPUT:",
        output_lines: outLines,
        output_images: exp.output_images || [],
        footer_left: sName,
        footer_right: rNum
      });

      // Page 3: EXP_CONT (RIGHT)
      pages.push({
        page_number: pageNo++,
        total_pages: total,
        experiment_number: exp.experiment_number,
        experiment_title: exp.title,
        page_type: "EXP_CONT",
        side: "RIGHT",
        is_blank: false,
        code_heading: codeP3.length ? "CODING (CONTINUED):" : null,
        code_lines: codeP3,
        has_evaluation_table: true,
        result_heading: "RESULT:",
        result_text: exp.result,
        footer_left: sName,
        footer_right: rNum
      });

      // Page 4: BLANK_BACK (LEFT)
      pages.push({
        page_number: pageNo++,
        total_pages: total,
        experiment_number: exp.experiment_number,
        experiment_title: exp.title,
        page_type: "BLANK_BACK",
        side: "LEFT",
        is_blank: true,
        output_lines: [],
        footer_left: sName,
        footer_right: rNum
      });
    });

    return pages;
  }

  function renderPaginatedSheets(pages) {
    if (!paginatedPagesContainer) return;

    if (viewerTotalPages) viewerTotalPages.textContent = pages.length;
    if (viewerPageInput) {
      viewerPageInput.max = pages.length;
      viewerPageInput.value = Math.min(currentPageIndex, pages.length);
    }

    paginatedPagesContainer.innerHTML = "";
    paginatedPagesContainer.className = `paginated-pages-container mode-${currentViewMode}`;

    pages.forEach((p, idx) => {
      const pageIndex = idx + 1;

      // In single-page mode, only render the active page
      if (currentViewMode === "single" && pageIndex !== currentPageIndex) {
        return;
      }

      const sheet = document.createElement("div");
      sheet.className = "a4-page-sheet";
      sheet.id = `sheet-page-${pageIndex}`;
      sheet.style.transform = `scale(${currentZoom})`;
      sheet.style.transformOrigin = "top center";

      // Badge above sheet
      const badge = document.createElement("div");
      badge.className = "page-sheet-badge";
      const expTag = p.experiment_number ? ` • EXP ${escapeHtml(p.experiment_number)}` : "";
      const sideTag = p.side === "RIGHT" ? "RIGHT PAGE (FACING)" : "LEFT PAGE";
      badge.textContent = `PAGE ${p.page_number} OF ${p.total_pages} • ${sideTag}${expTag}`;
      sheet.appendChild(badge);

      // Inner 1.5pt Border Container
      const border = document.createElement("div");
      border.className = "a4-page-border";

      // 1. Compact Header Table (Direct child of border - touches top, left, right border with 0 gaps)
      if (p.has_header_table) {
        const tbl = document.createElement("table");
        tbl.className = "preview-header-table";
        const titleText = p.header_title || "";
        const subtitleText = (p.header_subtitle && p.header_subtitle.trim() && p.header_subtitle.toUpperCase() !== titleText.toUpperCase())
          ? `<div style="font-size:0.82rem;font-weight:700;margin-top:2px;">${escapeHtml(p.header_subtitle)}</div>`
          : "";

        tbl.innerHTML = `
          <tr>
            <td class="cell-ex-date">EX NO:${escapeHtml(p.header_ex_no || "")}</td>
            <td class="cell-title-merged" rowspan="2">
              <div>${escapeHtml(titleText)}</div>
              ${subtitleText}
            </td>
          </tr>
          <tr>
            <td class="cell-ex-date">DATE:${escapeHtml(p.header_date || "")}</td>
          </tr>
        `;
        border.appendChild(tbl);
      }

      // Inner Printable Content (Padded inside the border for AIM, ALGO, CODE, etc.)
      const content = document.createElement("div");
      content.className = "a4-page-content";

      // 2. AIM
      if (p.aim_heading && p.aim_text) {
        const hAim = document.createElement("div");
        hAim.className = "doc-heading";
        hAim.textContent = p.aim_heading;
        content.appendChild(hAim);

        const pAim = document.createElement("div");
        pAim.className = "doc-body";
        pAim.textContent = p.aim_text;
        content.appendChild(pAim);
      }

      // 3. ALGORITHM
      if (p.procedure_heading && p.algorithm_steps && p.algorithm_steps.length > 0) {
        const hAlgo = document.createElement("div");
        hAlgo.className = "doc-heading";
        hAlgo.textContent = p.procedure_heading;
        content.appendChild(hAlgo);

        const olAlgo = document.createElement("ol");
        olAlgo.className = "doc-steps";
        p.algorithm_steps.forEach(st => {
          const li = document.createElement("li");
          li.textContent = st;
          olAlgo.appendChild(li);
        });
        content.appendChild(olAlgo);
      }

      // 4. CODING
      if (p.code_heading && p.code_lines && p.code_lines.length > 0) {
        const hCode = document.createElement("div");
        hCode.className = "doc-heading";
        hCode.textContent = p.code_heading;
        content.appendChild(hCode);

        const preCode = document.createElement("pre");
        preCode.className = "doc-code";
        preCode.textContent = p.code_lines.join("\n");
        content.appendChild(preCode);
      }

      // 5. OUTPUT
      if (p.output_heading && (p.output_lines.length > 0 || (p.output_images && p.output_images.length > 0))) {
        const hOut = document.createElement("div");
        hOut.className = "doc-heading";
        hOut.textContent = p.output_heading;
        content.appendChild(hOut);

        if (p.output_lines && p.output_lines.length > 0) {
          const preOut = document.createElement("div");
          preOut.className = "doc-output";
          preOut.textContent = p.output_lines.join("\n");
          content.appendChild(preOut);
        }

        if (p.output_images && p.output_images.length > 0) {
          p.output_images.forEach(imgSrc => {
            const imgWrap = document.createElement("div");
            imgWrap.className = "doc-image-wrap";
            const img = document.createElement("img");
            img.src = imgSrc;
            imgWrap.appendChild(img);
            content.appendChild(imgWrap);
          });
        }
      }

      // 6. EVALUATION TABLE
      if (p.has_evaluation_table) {
        const evalWrap = document.createElement("div");
        evalWrap.className = "preview-eval-container";
        evalWrap.innerHTML = `
          <table class="preview-eval-table">
            <tr><td>PROGRAM AND EXECUTION</td><td style="width:37.5%;text-align:center;"></td></tr>
            <tr><td>CLASS PERFORMANCE</td><td style="text-align:center;"></td></tr>
            <tr><td>VIVA</td><td style="text-align:center;"></td></tr>
            <tr><td>TOTAL</td><td style="text-align:center;"></td></tr>
          </table>
        `;
        content.appendChild(evalWrap);
      }

      // 7. RESULT
      if (p.result_heading && p.result_text) {
        const hRes = document.createElement("div");
        hRes.className = "doc-heading";
        hRes.textContent = p.result_heading;
        content.appendChild(hRes);

        const pRes = document.createElement("div");
        pRes.className = "doc-body";
        pRes.textContent = p.result_text;
        content.appendChild(pRes);
      }

      // 8. INTENTIONALLY BLANK BACK PAGE
      if (p.is_blank) {
        const blankNotice = document.createElement("div");
        blankNotice.className = "doc-blank-notice";
        blankNotice.innerHTML = `
          <div style="font-size:1.25rem;margin-bottom:8px;">📄</div>
          <strong style="color:#64748b;letter-spacing:0.04em;">INTENTIONALLY BLANK PAGE</strong>
          <p style="margin-top:6px;font-size:0.72rem;color:#94a3b8;max-width:320px;">
            Left-side blank backing page maintained according to university lab record facing-page convention for duplex printing.
          </p>
        `;
        content.appendChild(blankNotice);
      }

      border.appendChild(content);

      // 9. RUNNING FOOTER
      const footer = document.createElement("div");
      footer.className = "doc-footer";
      const sName = p.footer_left || "ADARSH MENON";
      const rNum = p.footer_right || "714025247005";
      footer.innerHTML = `<span>${escapeHtml(sName)}</span><span>${escapeHtml(rNum)}</span>`;
      border.appendChild(footer);

      sheet.appendChild(border);
      paginatedPagesContainer.appendChild(sheet);
    });
  }

  // --- VIEWER CONTROLS ---
  if (btnPrevPage) {
    btnPrevPage.addEventListener("click", () => {
      if (currentPageIndex > 1) {
        currentPageIndex--;
        if (viewerPageInput) viewerPageInput.value = currentPageIndex;
        if (currentViewMode === "single") {
          renderPaginatedSheets(cachedPages);
        } else {
          scrollToPage(currentPageIndex);
        }
      }
    });
  }

  if (btnNextPage) {
    btnNextPage.addEventListener("click", () => {
      if (currentPageIndex < cachedPages.length) {
        currentPageIndex++;
        if (viewerPageInput) viewerPageInput.value = currentPageIndex;
        if (currentViewMode === "single") {
          renderPaginatedSheets(cachedPages);
        } else {
          scrollToPage(currentPageIndex);
        }
      }
    });
  }

  if (viewerPageInput) {
    viewerPageInput.addEventListener("change", () => {
      let val = parseInt(viewerPageInput.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      if (val > cachedPages.length) val = cachedPages.length;
      currentPageIndex = val;
      viewerPageInput.value = currentPageIndex;
      if (currentViewMode === "single") {
        renderPaginatedSheets(cachedPages);
      } else {
        scrollToPage(currentPageIndex);
      }
    });
  }

  function scrollToPage(pageNo) {
    const el = document.getElementById(`sheet-page-${pageNo}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  viewModeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      viewModeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentViewMode = btn.getAttribute("data-view");
      renderPaginatedSheets(cachedPages);
    });
  });

  if (btnZoomIn) {
    btnZoomIn.addEventListener("click", () => {
      if (currentZoom < 1.4) {
        currentZoom = Math.round((currentZoom + 0.1) * 10) / 10;
        applyZoom();
      }
    });
  }

  if (btnZoomOut) {
    btnZoomOut.addEventListener("click", () => {
      if (currentZoom > 0.6) {
        currentZoom = Math.round((currentZoom - 0.1) * 10) / 10;
        applyZoom();
      }
    });
  }

  if (btnZoomFit) {
    btnZoomFit.addEventListener("click", () => {
      currentZoom = 1.0;
      applyZoom();
    });
  }

  function applyZoom() {
    if (zoomLabel) zoomLabel.textContent = `${Math.round(currentZoom * 100)}%`;
    document.querySelectorAll(".a4-page-sheet").forEach(sheet => {
      sheet.style.transform = `scale(${currentZoom})`;
    });
  }

  if (btnPrintPreview) {
    btnPrintPreview.addEventListener("click", () => {
      // In single view mode, switch temporarily to all so all pages print
      const prevMode = currentViewMode;
      currentViewMode = "all";
      renderPaginatedSheets(cachedPages);
      setTimeout(() => {
        window.print();
        currentViewMode = prevMode;
        renderPaginatedSheets(cachedPages);
      }, 200);
    });
  }

  // --- TAB NAVIGATION ---
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.add("hidden"));
      btn.classList.add("active");

      const targetId = btn.getAttribute("data-tab");
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.remove("hidden");

      if (targetId === "tab-continue") {
        currentMode = "continue";
      } else if (targetId === "tab-workspace") {
        currentMode = "workspace";
        renderWorkspaceUI();
      } else if (targetId === "tab-drafts") {
        currentMode = "drafts";
        loadDrafts();
      } else {
        currentMode = "create";
      }

      schedulePreviewUpdate();
    });
  });

  if (btnWsPreview) {
    btnWsPreview.addEventListener("click", () => {
      currentMode = "workspace";
      schedulePreviewUpdate();
      const pCol = document.querySelector(".preview-column");
      if (pCol) pCol.scrollIntoView({ behavior: "smooth" });
    });
  }

  // Clear errors when typing and schedule preview
  allInputs.forEach(input => {
    if (input) {
      input.addEventListener("input", () => {
        input.classList.remove("has-error");
        if (inlineStatusBanner && inlineStatusBanner.classList.contains("status-error")) {
          inlineStatusBanner.classList.add("hidden");
        }
        schedulePreviewUpdate();
      });
    }
  });

  // --- BUTTON ACTIONS ---
  if (btnSampleData) {
    btnSampleData.addEventListener("click", () => fillExperimentForm(DEFAULT_EXPERIMENT));
  }

  if (btnClearForm) {
    btnClearForm.addEventListener("click", () => clearExperimentForm());
  }

  if (btnPreview) {
    btnPreview.addEventListener("click", () => {
      const pCol = document.querySelector(".preview-column");
      if (pCol) pCol.scrollIntoView({ behavior: "smooth" });
      schedulePreviewUpdate();
      showStatus("success", "Preview updated with current form values.");
    });
  }

  if (btnFloatingPreview) {
    btnFloatingPreview.addEventListener("click", () => {
      const target = document.querySelector(".preview-column");
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  }

  // --- OUTPUT TABS (Text vs Image) ---
  outputTabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      outputTabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const mode = btn.getAttribute("data-output");

      if (mode === "text") {
        outputTextArea.classList.remove("hidden");
        outputImageArea.classList.add("hidden");
      } else if (mode === "image") {
        outputTextArea.classList.add("hidden");
        outputImageArea.classList.remove("hidden");
      } else if (mode === "both") {
        outputTextArea.classList.remove("hidden");
        outputImageArea.classList.remove("hidden");
      }
      schedulePreviewUpdate();
    });
  });

  // --- IMAGE UPLOADER ---
  if (imageUploader && outputImgInput) {
    imageUploader.addEventListener("click", () => outputImgInput.click());
    outputImgInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          attachedImageData = event.target.result;
          imagePreview.innerHTML = `<img src="${attachedImageData}" alt="Screenshot">`;
          imagePreview.classList.remove("hidden");
          schedulePreviewUpdate();
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // --- DROPZONE FOR EXISTING RECORD CONTINUATION ---
  if (recordDropzone) {
    recordDropzone.addEventListener("click", () => recordFileInput.click());
    recordDropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      recordDropzone.classList.add("dragover");
    });
    recordDropzone.addEventListener("dragleave", () => recordDropzone.classList.remove("dragover"));
    recordDropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      recordDropzone.classList.remove("dragover");
      if (e.dataTransfer.files.length) {
        handleRecordUpload(e.dataTransfer.files[0]);
      }
    });
  }

  if (recordFileInput) {
    recordFileInput.addEventListener("change", () => {
      if (recordFileInput.files.length) {
        handleRecordUpload(recordFileInput.files[0]);
      }
    });
  }

  async function handleRecordUpload(file) {
    if (!file.name.endsWith(".docx")) {
      showStatus("error", "Please upload a valid .docx Word document.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const heading = recordDropzone.querySelector("h3");
    if (heading) heading.textContent = "Analyzing document structure...";

    try {
      const res = await fetch(`${API_BASE}/api/upload/document`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        uploadedRecordFileId = data.filename;
        analyzedFilename.textContent = file.name;
        recordAnalysisBox.classList.remove("hidden");
        recordDropzone.classList.add("hidden");

        detectedExpTags.innerHTML = "";
        if (data.detected_experiments && data.detected_experiments.length) {
          data.detected_experiments.forEach(num => {
            const badge = document.createElement("span");
            badge.className = "tag-badge";
            badge.textContent = `Exp ${num}`;
            detectedExpTags.appendChild(badge);
          });
        } else {
          detectedExpTags.textContent = "None detected yet";
        }

        statTotalPages.textContent = data.total_pages_estimated;
        if (data.student_name_detected || data.register_number_detected) {
          const sName = data.student_name_detected || "ADARSH MENON";
          const rNum = data.register_number_detected || "714025247005";
          statStudentRoll.textContent = `${sName} • ${rNum}`;
          studentNameInput.value = sName;
          registerNumberInput.value = rNum;
        }

        showStatus("success", `Record "${file.name}" analyzed successfully. Ready to append experiment.`);
        schedulePreviewUpdate();
      } else {
        showStatus("error", "Could not analyze document: " + (data.warnings.join(", ") || "Unknown error"));
        if (heading) heading.innerHTML = 'Drop your existing lab record here, or <span class="browse-link">browse</span>';
      }
    } catch (err) {
      showStatus("error", "Upload failed: " + err.message);
      if (heading) heading.innerHTML = 'Drop your existing lab record here, or <span class="browse-link">browse</span>';
    }
  }

  // --- GENERATE SINGLE EXPERIMENT DOCX ---
  if (btnGenerate) {
    btnGenerate.addEventListener("click", async () => {
      allInputs.forEach(i => { if (i) i.classList.remove("has-error"); });
      if (inlineStatusBanner) inlineStatusBanner.classList.add("hidden");

      const expData = getCurrentFormExperiment();

      // Check required fields
      const missing = [];
      if (!expData.experiment_number) { missing.push("Experiment No"); expNumberInput.classList.add("has-error"); }
      if (!expData.title) { missing.push("Title"); expTitleInput.classList.add("has-error"); }
      if (!expData.aim) { missing.push("Aim"); expAimInput.classList.add("has-error"); }
      if (!expData.coding) { missing.push("Coding"); expCodeInput.classList.add("has-error"); }
      if (!expData.result) { missing.push("Result"); expResultInput.classList.add("has-error"); }

      if (missing.length > 0) {
        showStatus(
          "error",
          "",
          `<strong>Please fill missing required fields (${missing.join(", ")}):</strong> or <button type="button" id="btn-quick-fill-sample" style="background:#b91c1c;color:#fff;border:1px solid #f87171;padding:3px 10px;border-radius:4px;cursor:pointer;margin-left:6px;font-weight:600;font-size:0.8rem;">Auto-fill Sample Experiment</button>`
        );
        const firstErr = document.querySelector(".has-error");
        if (firstErr) {
          firstErr.focus();
          firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        const qBtn = document.getElementById("btn-quick-fill-sample");
        if (qBtn) qBtn.addEventListener("click", () => fillExperimentForm(DEFAULT_EXPERIMENT));
        return;
      }

      btnGenerate.disabled = true;
      btnGenerate.innerHTML = '<span class="spinner"></span> ⚡ Compiling DOCX...';
      showStatus("loading", "⚡ Compiling print-ready laboratory record DOCX... Please wait...");

      try {
        let endpoint = `${API_BASE}/api/experiment/generate`;
        let payload = {
          experiment: expData,
          template_id: "python_lab_reference"
        };

        if (currentMode === "continue" && uploadedRecordFileId) {
          endpoint = `${API_BASE}/api/record/continue`;
          payload = {
            original_filename: uploadedRecordFileId,
            experiment: expData,
            template_id: "python_lab_reference",
            preserve_original: true
          };
        }

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
        const result = await res.json();

        if (result.success && result.download_url) {
          const fullDownloadUrl = result.download_url.startsWith("http")
            ? result.download_url
            : `${API_BASE}${result.download_url}`;

          generationBanner.classList.remove("hidden");
          btnDownloadFile.href = fullDownloadUrl;
          btnDownloadFile.setAttribute("download", result.filename);
          const bTitle = document.getElementById("banner-title");
          const bDesc = document.getElementById("banner-desc");
          if (bTitle) bTitle.textContent = `Document Ready (${result.filename})`;
          if (bDesc) bDesc.textContent = result.message || "Your laboratory record has been successfully compiled.";

          showStatus(
            "success",
            "",
            `<span>✅ <strong>Success!</strong> ${result.filename} generated successfully.</span> <a href="${fullDownloadUrl}" download="${result.filename}" style="background:#16a34a;color:#fff;padding:6px 14px;border-radius:4px;text-decoration:none;font-weight:600;display:inline-block;margin-left:10px;">📥 Download DOCX</a>`
          );

          triggerDownload(fullDownloadUrl, result.filename);
          inlineStatusBanner.scrollIntoView({ behavior: "smooth", block: "nearest" });
        } else {
          const errMsg = (result.warnings && result.warnings.length)
            ? result.warnings.join(", ")
            : (result.error || "Generation could not be completed.");
          showStatus("error", `Generation failed: ${errMsg}`);
        }
      } catch (e) {
        console.error("Generate error:", e);
        showStatus("error", `Failed to generate document: ${e.message}. Please check connection.`);
      } finally {
        btnGenerate.disabled = false;
        btnGenerate.innerHTML = "⚡ Generate DOCX";
      }
    });
  }

  // --- GENERATE MULTI-EXPERIMENT WORKSPACE DOCX ---
  if (btnWsGenerate) {
    btnWsGenerate.addEventListener("click", async () => {
      const list = getWorkspaceExperiments();
      if (list.length === 0) {
        showStatus("error", "Your workspace is empty. Please add at least one experiment.");
        return;
      }

      btnWsGenerate.disabled = true;
      btnWsGenerate.innerHTML = '<span class="spinner"></span> ⚡ Compiling Workspace...';
      showStatus("loading", `⚡ Compiling ${list.length} workspace experiments into unified DOCX (${list.length * 4} pages)...`);

      try {
        const payload = {
          experiments: list,
          template_id: "python_lab_reference"
        };

        const res = await fetch(`${API_BASE}/api/record/generate-workspace`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
        const result = await res.json();

        if (result.success && result.download_url) {
          const fullDownloadUrl = result.download_url.startsWith("http")
            ? result.download_url
            : `${API_BASE}${result.download_url}`;

          generationBanner.classList.remove("hidden");
          btnDownloadFile.href = fullDownloadUrl;
          btnDownloadFile.setAttribute("download", result.filename);
          const bTitle = document.getElementById("banner-title");
          const bDesc = document.getElementById("banner-desc");
          if (bTitle) bTitle.textContent = `Workspace Record Ready (${result.filename})`;
          if (bDesc) bDesc.textContent = result.message || "Combined record document successfully generated.";

          showStatus(
            "success",
            "",
            `<span>✅ <strong>Success!</strong> ${result.filename} (${result.total_pages_estimated} pages) compiled successfully.</span> <a href="${fullDownloadUrl}" download="${result.filename}" style="background:#16a34a;color:#fff;padding:6px 14px;border-radius:4px;text-decoration:none;font-weight:600;display:inline-block;margin-left:10px;">📥 Download DOCX</a>`
          );

          triggerDownload(fullDownloadUrl, result.filename);
          inlineStatusBanner.scrollIntoView({ behavior: "smooth", block: "nearest" });
        } else {
          showStatus("error", `Generation failed: ${result.message || 'Unknown error'}`);
        }
      } catch (e) {
        console.error("Workspace generate error:", e);
        showStatus("error", `Failed to generate combined document: ${e.message}`);
      } finally {
        btnWsGenerate.disabled = false;
        btnWsGenerate.innerHTML = `⚡ Generate Combined DOCX (${list.length} Exps)`;
      }
    });
  }

  function triggerDownload(url, filename) {
    try {
      const dlLink = document.createElement("a");
      dlLink.href = url;
      dlLink.download = filename;
      document.body.appendChild(dlLink);
      dlLink.click();
      setTimeout(() => dlLink.remove(), 1000);
    } catch (e) {
      console.warn("Auto-download bypassed:", e);
    }
  }

  // --- AI ASSIST SYSTEM ---
  const aiAimBtn = document.getElementById("btn-ai-aim");
  const aiAlgoBtn = document.getElementById("btn-ai-algo");
  const aiCodeBtn = document.getElementById("btn-ai-code");
  const aiResultBtn = document.getElementById("btn-ai-result");

  if (aiAimBtn) aiAimBtn.addEventListener("click", () => triggerAiAssist("aim", "spell_grammar"));
  if (aiAlgoBtn) aiAlgoBtn.addEventListener("click", () => triggerAiAssist("algorithm", "format_steps"));
  if (aiCodeBtn) aiCodeBtn.addEventListener("click", () => triggerAiAssist("coding", "indent_code"));
  if (aiResultBtn) aiResultBtn.addEventListener("click", () => triggerAiAssist("result", "spell_grammar"));

  async function triggerAiAssist(fieldName, action) {
    let rawText = "";
    if (fieldName === "aim") rawText = expAimInput.value;
    else if (fieldName === "algorithm") rawText = expAlgoInput.value;
    else if (fieldName === "coding") rawText = expCodeInput.value;
    else if (fieldName === "result") rawText = expResultInput.value;

    if (!rawText.trim()) {
      showStatus("error", `Please enter some text in ${fieldName.toUpperCase()} before requesting AI formatting.`);
      return;
    }

    try {
      showStatus("loading", `Applying AI formatting to ${fieldName.toUpperCase()}...`);
      const res = await fetch(`${API_BASE}/api/ai/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field_name: fieldName,
          raw_text: rawText,
          action: action
        })
      });

      const data = await res.json();
      if (data.success) {
        activeAiTargetField = fieldName;
        activeAiSuggestion = data.suggested_text;

        modalRationale.textContent = data.rationale || "AI optimization suggestions.";
        diffOriginal.textContent = rawText;
        diffSuggested.textContent = data.suggested_text;
        aiModal.classList.remove("hidden");
        if (inlineStatusBanner) inlineStatusBanner.classList.add("hidden");
      } else {
        showStatus("error", "AI formatting could not be completed.");
      }
    } catch (e) {
      showStatus("error", "AI service connection error: " + e.message);
    }
  }

  if (btnCloseModal) btnCloseModal.addEventListener("click", () => aiModal.classList.add("hidden"));
  if (btnRejectAi) btnRejectAi.addEventListener("click", () => aiModal.classList.add("hidden"));

  if (btnAcceptAi) {
    btnAcceptAi.addEventListener("click", () => {
      if (activeAiTargetField && activeAiSuggestion !== null) {
        if (activeAiTargetField === "aim") expAimInput.value = activeAiSuggestion;
        else if (activeAiTargetField === "algorithm") expAlgoInput.value = activeAiSuggestion;
        else if (activeAiTargetField === "coding") expCodeInput.value = activeAiSuggestion;
        else if (activeAiTargetField === "result") expResultInput.value = activeAiSuggestion;

        schedulePreviewUpdate();
        aiModal.classList.add("hidden");
        showStatus("success", `AI formatting successfully applied to ${activeAiTargetField.toUpperCase()}.`);
      }
    });
  }

  // --- RAW NOTES IMPORT MODAL ---
  if (btnImportNotes) {
    btnImportNotes.addEventListener("click", () => {
      importModal.classList.remove("hidden");
      importRawText.focus();
    });
  }

  if (btnCloseImport) btnCloseImport.addEventListener("click", () => importModal.classList.add("hidden"));
  if (btnCancelImport) btnCancelImport.addEventListener("click", () => importModal.classList.add("hidden"));

  if (btnApplyImport) {
    btnApplyImport.addEventListener("click", async () => {
      const text = importRawText.value.trim();
      if (!text) {
        showStatus("error", "Please paste raw experiment text to parse.");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/experiment/parse-text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text })
        });
        const data = await res.json();
        if (data.success && data.data) {
          const d = data.data;
          if (d.experiment_number) expNumberInput.value = d.experiment_number;
          if (d.title) expTitleInput.value = d.title;
          if (d.subtitle) expSubtitleInput.value = d.subtitle;
          if (d.date) expDateInput.value = d.date;
          if (d.aim) expAimInput.value = d.aim;
          if (d.algorithm) expAlgoInput.value = d.algorithm;
          if (d.coding) expCodeInput.value = d.coding;
          if (d.output) expOutputInput.value = d.output;
          if (d.result) expResultInput.value = d.result;

          schedulePreviewUpdate();
          importModal.classList.add("hidden");
          showStatus("success", "Raw notes successfully parsed and populated into the form.");
        }
      } catch (e) {
        showStatus("error", "Failed to parse notes: " + e.message);
      }
    });
  }

  // --- DRAFTS SYSTEM ---
  if (btnSaveDraft) {
    btnSaveDraft.addEventListener("click", () => {
      const draft = {
        id: "draft_" + Date.now(),
        experiment_number: expNumberInput.value || "Untitled",
        title: expTitleInput.value || "Draft Experiment",
        subtitle: expSubtitleInput.value,
        date: expDateInput.value,
        aim: expAimInput.value,
        algorithm: expAlgoInput.value,
        coding: expCodeInput.value,
        output: expOutputInput.value,
        result: expResultInput.value,
        student_name: studentNameInput.value,
        register_number: registerNumberInput.value,
        timestamp: new Date().toLocaleTimeString()
      };

      let drafts = JSON.parse(localStorage.getItem("lab_record_drafts") || "[]");
      drafts.unshift(draft);
      localStorage.setItem("lab_record_drafts", JSON.stringify(drafts));
      loadDrafts();
      showStatus("success", `Draft "${draft.title}" saved successfully.`);
    });
  }

  function loadDrafts() {
    const drafts = JSON.parse(localStorage.getItem("lab_record_drafts") || "[]");
    if (draftCountSpan) draftCountSpan.textContent = drafts.length;

    const list = document.getElementById("drafts-list");
    if (!list) return;

    if (drafts.length === 0) {
      list.innerHTML = '<p class="empty-state">No saved drafts yet. Click "Save Draft" on any experiment form.</p>';
      return;
    }

    list.innerHTML = "";
    drafts.forEach((d, idx) => {
      const item = document.createElement("div");
      item.style.padding = "0.75rem";
      item.style.border = "1px solid #e2e8f0";
      item.style.borderRadius = "6px";
      item.style.marginBottom = "0.5rem";
      item.style.display = "flex";
      item.style.justifyContent = "space-between";
      item.style.alignItems = "center";
      item.innerHTML = `
        <div>
          <strong>Exp ${d.experiment_number}: ${d.title}</strong>
          <div style="font-size:0.75rem;color:#64748b;">Saved at ${d.timestamp}</div>
        </div>
        <div style="display:flex;gap:0.5rem;">
          <button class="btn btn-secondary btn-xs" onclick="window.loadDraftByIndex(${idx})">Load</button>
          <button class="btn btn-secondary btn-xs" onclick="window.deleteDraftByIndex(${idx})">Delete</button>
        </div>
      `;
      list.appendChild(item);
    });
  }

  window.loadDraftByIndex = (idx) => {
    const drafts = JSON.parse(localStorage.getItem("lab_record_drafts") || "[]");
    const d = drafts[idx];
    if (d) {
      fillExperimentForm(d);
      if (tabBtns[0]) tabBtns[0].click();
      showStatus("success", `Loaded draft: Exp ${d.experiment_number}`);
    }
  };

  window.deleteDraftByIndex = (idx) => {
    let drafts = JSON.parse(localStorage.getItem("lab_record_drafts") || "[]");
    drafts.splice(idx, 1);
    localStorage.setItem("lab_record_drafts", JSON.stringify(drafts));
    loadDrafts();
  };

  // --- IMPORT RAW NOTES MODAL ---
  if (btnImportNotes && importModal) {
    btnImportNotes.addEventListener("click", () => {
      importModal.classList.remove("hidden");
      if (importRawText) importRawText.focus();
    });
  }

  function closeImportModal() {
    if (importModal) importModal.classList.add("hidden");
  }

  if (btnCloseImport) btnCloseImport.addEventListener("click", closeImportModal);
  if (btnCancelImport) btnCancelImport.addEventListener("click", closeImportModal);

  if (btnApplyImport && importRawText) {
    btnApplyImport.addEventListener("click", async () => {
      const rawText = sanitizeFieldText(importRawText.value.trim());
      if (!rawText) {
        showStatus("error", "Please paste your experiment notes first.");
        return;
      }
      try {
        btnApplyImport.disabled = true;
        btnApplyImport.textContent = "Parsing...";
        const resp = await fetch("/api/experiment/parse-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: rawText })
        });
        const res = await resp.json();
        if (res.success && res.data) {
          fillExperimentForm(res.data);
          closeImportModal();
          showStatus("success", "Successfully parsed and populated experiment fields.");
          schedulePreviewUpdate();
        } else {
          showStatus("error", "Failed to parse experiment text.");
        }
      } catch (err) {
        console.error("Import error:", err);
        showStatus("error", "Error contacting parser backend.");
      } finally {
        btnApplyImport.disabled = false;
        btnApplyImport.textContent = "Parse & Populate Form";
      }
    });
  }

  // --- INITIALIZE ON PAGE LOAD ---
  fillExperimentForm(DEFAULT_EXPERIMENT);
  renderWorkspaceUI();
  loadDrafts();
  schedulePreviewUpdate();
});
