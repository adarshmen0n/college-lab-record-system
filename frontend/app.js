/**
 * RECORDEXT - College Laboratory Record Automation System
 * Frontend Application Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  // Smart API Base determination:
  // If running from file:// or without host, talk to the live Render backend!
  // If running from web server (Render, localhost, etc.), use same-origin relative path "".
  const API_BASE = (window.location.protocol === "file:" || !window.location.host)
    ? "https://college-lab-record-system.onrender.com"
    : "";

  // State
  let currentMode = "create"; // Default mode is "create" for zero-barrier instant generation
  let uploadedRecordFileId = null;
  let attachedImageData = null;
  let activeAiTargetField = null;
  let activeAiSuggestion = null;

  // DOM Elements - Navigation
  const tabBtns = document.querySelectorAll(".nav-tabs .tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

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

  // DOM Elements - Buttons & Banners
  const btnSampleData = document.getElementById("btn-sample-data");
  const btnClearForm = document.getElementById("btn-clear-form");
  const btnPreview = document.getElementById("btn-preview");
  const btnGenerate = document.getElementById("btn-generate");
  const btnDownloadFile = document.getElementById("btn-download-file");
  const generationBanner = document.getElementById("generation-banner");
  const inlineStatusBanner = document.getElementById("inline-status-banner");
  const btnSaveDraft = document.getElementById("btn-save-draft");

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

  // DOM Elements - Preview
  const prevExNo = document.getElementById("prev-ex-no");
  const prevDate = document.getElementById("prev-date");
  const prevTitle = document.getElementById("prev-title");
  const prevSubtitle = document.getElementById("prev-subtitle");
  const prevAim = document.getElementById("prev-aim");
  const prevAlgo = document.getElementById("prev-algo");
  const prevCode = document.getElementById("prev-code");
  const prevResult = document.getElementById("prev-result");
  const previewOutputBody = document.getElementById("preview-output-body");
  const previewOutputImgContainer = document.getElementById("preview-output-img-container");
  const previewFootLeft1 = document.getElementById("preview-foot-left-1");
  const previewFootRight1 = document.getElementById("preview-foot-right-1");
  const previewFootLeft2 = document.getElementById("preview-foot-left-2");
  const previewFootRight2 = document.getElementById("preview-foot-right-2");

  const viewModeBtns = document.querySelectorAll(".view-mode-toggle .view-btn");
  const bookSpreadContainer = document.getElementById("book-spread-container");
  const sheetLeft = document.getElementById("sheet-left");
  const sheetRight = document.getElementById("sheet-right");
  const btnFloatingPreview = document.getElementById("btn-floating-preview");

  // --- DEFAULT STANDARD EXPERIMENT (Always pre-filled on load) ---
  const DEFAULT_EXPERIMENT = {
    num: "1.D",
    date: "23-09-2026",
    title: "COMPREHENSION",
    sub: "GENERATOR COMPREHENSION",
    student_name: "ADARSH MENON",
    register_number: "714025247005",
    aim: "To create a generator using generator comprehension and iterate over elements using functions.",
    algo: "1. Define a generator function to create squared values.\n2. Use generator comprehension syntax with parentheses.\n3. Iterate over the generator object.\n4. Display the yielded values.",
    code: `def generate_squares(n):
    return (x**2 for x in range(n))

def main():
    print("Generating squares up to 5:")
    squares = generate_squares(5)
    for val in squares:
        print(f"Square: {val}")

if __name__ == "__main__":
    main()`,
    output: "Generating squares up to 5:\nSquare: 0\nSquare: 1\nSquare: 4\nSquare: 9\nSquare: 16",
    result: "The generator comprehension was implemented successfully and values were yielded on demand."
  };

  const allInputs = [
    expNumberInput, expDateInput, expTitleInput, expSubtitleInput,
    studentNameInput, registerNumberInput, expAimInput, expAlgoInput,
    expCodeInput, expOutputInput, expResultInput
  ];

  // Helper to populate experiment form
  function fillExperimentForm(data = DEFAULT_EXPERIMENT) {
    if (expNumberInput) expNumberInput.value = data.num || data.experiment_number || "1.D";
    if (expDateInput) expDateInput.value = data.date || "23-09-2026";
    if (expTitleInput) expTitleInput.value = data.title || "COMPREHENSION";
    if (expSubtitleInput) expSubtitleInput.value = data.sub || data.subtitle || "";
    if (studentNameInput) studentNameInput.value = data.student_name || "ADARSH MENON";
    if (registerNumberInput) registerNumberInput.value = data.register_number || "714025247005";
    if (expAimInput) expAimInput.value = data.aim || "";
    if (expAlgoInput) expAlgoInput.value = data.algo || data.algorithm || "";
    if (expCodeInput) expCodeInput.value = data.code || data.coding || "";
    if (expOutputInput) expOutputInput.value = data.output || "";
    if (expResultInput) expResultInput.value = data.result || "";

    allInputs.forEach(i => { if (i) i.classList.remove("has-error"); });
    if (inlineStatusBanner) inlineStatusBanner.classList.add("hidden");
    updateLivePreview();
  }

  // Helper to clear form for a new experiment
  function clearExperimentForm() {
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
    updateLivePreview();
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

  // Clear errors when typing
  allInputs.forEach(input => {
    if (input) {
      input.addEventListener("input", () => {
        input.classList.remove("has-error");
        if (inlineStatusBanner && inlineStatusBanner.classList.contains("status-error")) {
          inlineStatusBanner.classList.add("hidden");
        }
        updateLivePreview();
      });
    }
  });

  // --- TAB SWITCHING ---
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
      } else {
        currentMode = "create";
      }
    });
  });

  // --- BUTTON ACTIONS ---
  if (btnSampleData) {
    btnSampleData.addEventListener("click", () => fillExperimentForm());
  }

  if (btnClearForm) {
    btnClearForm.addEventListener("click", () => clearExperimentForm());
  }

  // --- DROPZONE FOR EXISTING RECORD ---
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
      const res = await fetch(API_BASE + "/api/upload/document", {
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
        updateLivePreview();
      } else {
        showStatus("error", "Could not analyze document: " + (data.warnings.join(", ") || "Unknown error"));
        if (heading) heading.innerHTML = 'Drop your existing lab record here, or <span class="browse-link">browse</span>';
      }
    } catch (err) {
      showStatus("error", "Upload failed: " + err.message);
      if (heading) heading.innerHTML = 'Drop your existing lab record here, or <span class="browse-link">browse</span>';
    }
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
      updateLivePreview();
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
          updateLivePreview();
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // --- VIEW MODE TOGGLE & PREVIEW CONTROLS ---
  viewModeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      viewModeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const mode = btn.getAttribute("data-view");
      applyViewMode(mode);
    });
  });

  function applyViewMode(mode) {
    if (!bookSpreadContainer || !sheetLeft || !sheetRight) return;
    bookSpreadContainer.classList.remove("view-left-only", "view-right-only", "view-stacked");
    sheetLeft.style.display = "";
    sheetRight.style.display = "";

    if (mode === "left") {
      bookSpreadContainer.classList.add("view-left-only");
      sheetLeft.style.display = "flex";
      sheetRight.style.display = "none";
    } else if (mode === "right") {
      bookSpreadContainer.classList.add("view-right-only");
      sheetLeft.style.display = "none";
      sheetRight.style.display = "flex";
    } else if (mode === "stacked") {
      bookSpreadContainer.classList.add("view-stacked");
      sheetLeft.style.display = "flex";
      sheetRight.style.display = "flex";
    }
  }

  if (btnFloatingPreview) {
    btnFloatingPreview.addEventListener("click", () => {
      const target = document.querySelector(".preview-column") || bookSpreadContainer;
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // --- LIVE PREVIEW UPDATES ---
  function updateLivePreview() {
    if (prevExNo) prevExNo.textContent = expNumberInput.value || "1.D";
    if (prevDate) prevDate.textContent = expDateInput.value || "23-09-2026";
    if (prevTitle) prevTitle.textContent = (expTitleInput.value || "COMPREHENSION").toUpperCase();
    if (prevSubtitle) prevSubtitle.textContent = (expSubtitleInput.value || "").toUpperCase();

    const sName = studentNameInput.value || "ADARSH MENON";
    const rNum = registerNumberInput.value || "714025247005";
    if (previewFootLeft1) previewFootLeft1.textContent = sName;
    if (previewFootRight1) previewFootRight1.textContent = rNum;
    if (previewFootLeft2) previewFootLeft2.textContent = sName;
    if (previewFootRight2) previewFootRight2.textContent = rNum;

    if (prevAim) prevAim.textContent = expAimInput.value || "Enter aim of the experiment...";

    // Algorithm list
    if (prevAlgo) {
      const algoLines = (expAlgoInput.value || "").split("\n").filter(l => l.trim().length > 0);
      prevAlgo.innerHTML = "";
      if (algoLines.length > 0) {
        algoLines.forEach(l => {
          const li = document.createElement("li");
          li.textContent = l.replace(/^[0-9]+[.)-]\s*/, "");
          prevAlgo.appendChild(li);
        });
      } else {
        prevAlgo.innerHTML = "<li>Define function...</li><li>Display result.</li>";
      }
    }

    // Code
    if (prevCode) prevCode.textContent = expCodeInput.value || "def main():\n    pass";

    // Output
    if (previewOutputBody) previewOutputBody.textContent = expOutputInput.value || "Execution output...";

    // Output Image Preview
    if (previewOutputImgContainer) {
      previewOutputImgContainer.innerHTML = "";
      if (attachedImageData) {
        const img = document.createElement("img");
        img.src = attachedImageData;
        img.style.maxWidth = "100%";
        img.style.marginTop = "0.75rem";
        img.style.border = "1px solid #cbd5e1";
        img.style.borderRadius = "4px";
        previewOutputImgContainer.appendChild(img);
      }
    }

    // Result
    if (prevResult) prevResult.textContent = expResultInput.value || "Enter experiment result...";
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
      const res = await fetch(API_BASE + "/api/ai/suggest", {
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

        updateLivePreview();
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
        const res = await fetch(API_BASE + "/api/experiment/parse-text", {
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

          updateLivePreview();
          importModal.classList.add("hidden");
          showStatus("success", "Raw notes successfully parsed and populated into the form.");
        }
      } catch (e) {
        showStatus("error", "Failed to parse notes: " + e.message);
      }
    });
  }

  // --- PREVIEW BUTTON LISTENER ---
  if (btnPreview) {
    btnPreview.addEventListener("click", () => {
      const previewCol = document.querySelector(".preview-column") || document.getElementById("book-spread-container");
      if (previewCol) {
        previewCol.scrollIntoView({ behavior: "smooth" });
      }
      updateLivePreview();
      showStatus("success", "Preview updated with current form values.");
    });
  }

  // --- GENERATE DOCX ---
  if (btnGenerate) {
    btnGenerate.addEventListener("click", async () => {
      allInputs.forEach(i => { if (i) i.classList.remove("has-error"); });
      if (inlineStatusBanner) inlineStatusBanner.classList.add("hidden");

      // Gather form data with safe fallbacks
      const expData = {
        experiment_number: (expNumberInput.value.trim()) || "1.D",
        title: (expTitleInput.value.trim()) || "LAB EXPERIMENT",
        subtitle: (expSubtitleInput.value.trim()) || "",
        date: (expDateInput.value.trim()) || "23-09-2026",
        subject: "standard",
        procedure_heading: "ALGORITHM",
        code_heading: "CODING",
        aim: (expAimInput.value.trim()) || "To execute and verify the laboratory experiment.",
        algorithm: (expAlgoInput.value.trim()) || "1. Start\n2. Execute program\n3. Stop",
        coding: expCodeInput.value || "def main():\n    pass",
        output: expOutputInput.value || "Program execution output...",
        output_images: attachedImageData ? [attachedImageData] : [],
        result: (expResultInput.value.trim()) || "The program was executed and verified successfully.",
        student_name: (studentNameInput.value.trim()) || "ADARSH MENON",
        register_number: (registerNumberInput.value.trim()) || "714025247005"
      };

      // Check required fields
      const missing = [];
      if (!expNumberInput.value.trim()) { missing.push("Experiment No"); expNumberInput.classList.add("has-error"); }
      if (!expTitleInput.value.trim()) { missing.push("Title"); expTitleInput.classList.add("has-error"); }
      if (!expAimInput.value.trim()) { missing.push("Aim"); expAimInput.classList.add("has-error"); }
      if (!expCodeInput.value.trim()) { missing.push("Coding"); expCodeInput.classList.add("has-error"); }
      if (!expResultInput.value.trim()) { missing.push("Result"); expResultInput.classList.add("has-error"); }

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
        if (qBtn) qBtn.addEventListener("click", () => fillExperimentForm());
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

        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
        }

        const result = await res.json();
        if (result.success && result.download_url) {
          const fullDownloadUrl = result.download_url.startsWith("http")
            ? result.download_url
            : `${API_BASE}${result.download_url}`;

          // Top Banner
          generationBanner.classList.remove("hidden");
          btnDownloadFile.href = fullDownloadUrl;
          btnDownloadFile.setAttribute("download", result.filename);
          const bTitle = document.getElementById("banner-title");
          const bDesc = document.getElementById("banner-desc");
          if (bTitle) bTitle.textContent = `Document Ready (${result.filename})`;
          if (bDesc) bDesc.textContent = result.message || "Your laboratory record has been successfully compiled.";

          // Inline Banner with Direct Download Button
          showStatus(
            "success",
            "",
            `<span>✅ <strong>Success!</strong> ${result.filename} generated successfully.</span> <a href="${fullDownloadUrl}" download="${result.filename}" style="background:#16a34a;color:#fff;padding:6px 14px;border-radius:4px;text-decoration:none;font-weight:600;display:inline-block;margin-left:10px;">📥 Download DOCX</a>`
          );

          // Auto-trigger browser download
          try {
            const dlLink = document.createElement("a");
            dlLink.href = fullDownloadUrl;
            dlLink.download = result.filename;
            document.body.appendChild(dlLink);
            dlLink.click();
            setTimeout(() => dlLink.remove(), 1000);
          } catch (dlErr) {
            console.warn("Auto-download bypassed:", dlErr);
          }

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
    const draftCountSpan = document.getElementById("draft-count");
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
      // Switch back to create tab
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

  // --- INITIALIZE ON PAGE LOAD ---
  fillExperimentForm(DEFAULT_EXPERIMENT);
  loadDrafts();
});
