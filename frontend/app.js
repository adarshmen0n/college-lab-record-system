/**
 * Frontend Application Logic for College Lab Record Automation System
 */

document.addEventListener("DOMContentLoaded", () => {
  // State
  let currentMode = "continue"; // "continue" or "new"
  let uploadedRecordFileId = null;
  let selectedTemplateId = "python_lab_reference";
  let attachedImageData = null;
  let activeAiTargetField = null;
  let activeAiSuggestion = null;

  // DOM Elements
  const tabBtns = document.querySelectorAll(".nav-tabs .tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  const selectTemplate = document.getElementById("select-template");

  // Form Inputs
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

  // Output Tabs
  const outputTabBtns = document.querySelectorAll(".output-tab-btn");
  const outputTextArea = document.getElementById("output-text-area");
  const outputImageArea = document.getElementById("output-image-area");
  const imageUploader = document.getElementById("image-uploader");
  const outputImgInput = document.getElementById("output-img-input");
  const imagePreview = document.getElementById("image-preview");

  // Dropzone Elements
  const recordDropzone = document.getElementById("record-dropzone");
  const recordFileInput = document.getElementById("input-record-file");
  const recordAnalysisBox = document.getElementById("record-analysis-box");
  const analyzedFilename = document.getElementById("analyzed-filename");
  const detectedExpTags = document.getElementById("detected-exp-tags");
  const statTotalPages = document.getElementById("stat-total-pages");
  const statStudentRoll = document.getElementById("stat-student-roll");

  // Buttons
  const btnSampleData = document.getElementById("btn-sample-data");
  const btnPreview = document.getElementById("btn-preview");
  const btnGenerate = document.getElementById("btn-generate");
  const btnDownloadFile = document.getElementById("btn-download-file");
  const generationBanner = document.getElementById("generation-banner");
  const btnSaveDraft = document.getElementById("btn-save-draft");

  // Modals
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

  // Preview elements
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

  // --- INITIALIZATION ---
  fetchTemplates();
  loadDrafts();
  updateLivePreview();

  // --- TAB SWITCHING ---
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));
      btn.classList.add("active");

      const targetId = btn.getAttribute("data-tab");
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add("active");

      if (targetId === "tab-continue") {
        currentMode = "continue";
      } else if (targetId === "tab-new") {
        currentMode = "new";
      }
    });
  });

  // --- FETCH TEMPLATES ---
  async function fetchTemplates() {
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        const templates = await res.json();
        selectTemplate.innerHTML = "";
        const grid = document.getElementById("templates-grid");
        if (grid) grid.innerHTML = "";

        templates.forEach(t => {
          const opt = document.createElement("option");
          opt.value = t.id;
          opt.textContent = `${t.name} (Font: ${t.font_family})`;
          selectTemplate.appendChild(opt);

          if (grid) {
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
              <div class="card-header">
                <strong>${t.name}</strong>
                <span class="badge badge-success">Calibrated</span>
              </div>
              <div class="card-body">
                <p style="font-size:0.85rem;color:#64748b;">${t.description || "Standard format"}</p>
                <div style="margin-top:0.75rem;font-size:0.8rem;">
                  <div>Font: <strong>${t.font_family}</strong></div>
                  <div>Code Font: <strong>${t.code_font_family}</strong></div>
                  <div>Margins: <strong>${t.margins.top}"</strong></div>
                  <div>Page Border: <strong>${t.has_page_border ? 'Active' : 'None'}</strong></div>
                </div>
              </div>
            `;
            grid.appendChild(card);
          }
        });
      }
    } catch (e) {
      console.warn("Could not fetch templates:", e);
    }
  }

  // --- DROPZONE FOR EXISTING RECORD ---
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
  recordFileInput.addEventListener("change", () => {
    if (recordFileInput.files.length) {
      handleRecordUpload(recordFileInput.files[0]);
    }
  });

  async function handleRecordUpload(file) {
    if (!file.name.endsWith(".docx")) {
      alert("Please upload a valid .docx Word document.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    recordDropzone.querySelector("h3").textContent = "Analyzing document structure...";

    try {
      const res = await fetch("/api/upload/document", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        uploadedRecordFileId = data.filename;
        analyzedFilename.textContent = file.name;
        recordAnalysisBox.classList.remove("hidden");
        recordDropzone.classList.add("hidden");

        // Experiments badges
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

        updateLivePreview();
      } else {
        alert("Could not analyze document: " + (data.warnings.join(", ") || "Unknown error"));
        recordDropzone.querySelector("h3").innerHTML = 'Drop your existing lab record here, or <span class="browse-link">browse</span>';
      }
    } catch (err) {
      alert("Upload failed: " + err.message);
      recordDropzone.querySelector("h3").innerHTML = 'Drop your existing lab record here, or <span class="browse-link">browse</span>';
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
      } else {
        outputTextArea.classList.remove("hidden");
        outputImageArea.classList.remove("hidden");
      }
      updateLivePreview();
    });
  });

  // --- IMAGE UPLOADER ---
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

  // --- FILL SAMPLE DATA ---
  btnSampleData.addEventListener("click", () => {
    expNumberInput.value = "1.D";
    expDateInput.value = "23-09-2026";
    expTitleInput.value = "COMPREHENSION";
    expSubtitleInput.value = "GENERATOR COMPREHENSION";
    expAimInput.value = "To create a generator using generator comprehension and iterate over elements using functions.";
    expAlgoInput.value = "1. Define a generator function to create squared values.\n2. Use generator comprehension syntax with parentheses.\n3. Iterate over the generator object.\n4. Display the yielded values.";
    expCodeInput.value = `def generate_squares(n):
    return (x**2 for x in range(n))

def main():
    print("Generating squares up to 5:")
    squares = generate_squares(5)
    for val in squares:
        print(f"Square: {val}")

if __name__ == "__main__":
    main()`;
    expOutputInput.value = `Generating squares up to 5:
Square: 0
Square: 1
Square: 4
Square: 9
Square: 16`;
    expResultInput.value = "The generator comprehension was implemented successfully and values were yielded on demand.";
    updateLivePreview();
  });

  // --- LIVE PREVIEW UPDATES ---
  const allInputs = [
    expNumberInput, expDateInput, expTitleInput, expSubtitleInput,
    studentNameInput, registerNumberInput, expAimInput, expAlgoInput,
    expCodeInput, expOutputInput, expResultInput
  ];

  allInputs.forEach(input => {
    input.addEventListener("input", updateLivePreview);
  });

  function updateLivePreview() {
    prevExNo.textContent = expNumberInput.value || "1.D";
    prevDate.textContent = expDateInput.value || "23-09-2026";
    prevTitle.textContent = (expTitleInput.value || "COMPREHENSION").toUpperCase();
    prevSubtitle.textContent = (expSubtitleInput.value || "").toUpperCase();

    const sName = studentNameInput.value || "ADARSH MENON";
    const rNum = registerNumberInput.value || "714025247005";
    previewFootLeft1.textContent = sName;
    previewFootRight1.textContent = rNum;
    previewFootLeft2.textContent = sName;
    previewFootRight2.textContent = rNum;

    prevAim.textContent = expAimInput.value || "Enter aim of the experiment...";

    // Algorithm list
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

    // Code
    prevCode.textContent = expCodeInput.value || "def main():\n    pass";

    // Output
    previewOutputBody.textContent = expOutputInput.value || "Execution output...";

    // Output Image Preview
    previewOutputImgContainer.innerHTML = "";
    if (attachedImageData) {
      const img = document.createElement("img");
      img.src = attachedImageData;
      img.style.maxWidth = "100%";
      img.style.marginTop = "8px";
      img.style.borderRadius = "4px";
      previewOutputImgContainer.appendChild(img);
    }

    // Result
    prevResult.textContent = expResultInput.value || "The experiment was conducted successfully.";
  }

  // --- AI ASSIST BUTTONS ---
  document.getElementById("btn-ai-algo").addEventListener("click", () => triggerAiAssist("algorithm", "format"));
  document.getElementById("btn-ai-code").addEventListener("click", () => triggerAiAssist("coding", "indentation"));
  document.getElementById("btn-ai-aim").addEventListener("click", () => triggerAiAssist("aim", "spellcheck"));
  document.getElementById("btn-ai-result").addEventListener("click", () => triggerAiAssist("result", "spellcheck"));

  async function triggerAiAssist(field, mode) {
    activeAiTargetField = field;
    let content = "";
    if (field === "algorithm") content = expAlgoInput.value;
    else if (field === "coding") content = expCodeInput.value;
    else if (field === "aim") content = expAimInput.value;
    else if (field === "result") content = expResultInput.value;

    if (!content.trim()) {
      alert("Please enter content before running assistant.");
      return;
    }

    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, content, mode })
      });
      const data = await res.json();
      if (data.suggestions && data.suggestions.length > 0) {
        activeAiSuggestion = data.suggestions[0];
        modalRationale.textContent = activeAiSuggestion.rationale;
        diffOriginal.textContent = activeAiSuggestion.original;
        diffSuggested.textContent = activeAiSuggestion.suggested;
        aiModal.classList.remove("hidden");
      } else {
        alert(data.message || "No improvements needed! Content is clean.");
      }
    } catch (e) {
      alert("AI Assistant error: " + e.message);
    }
  }

  btnCloseModal.addEventListener("click", () => aiModal.classList.add("hidden"));
  btnRejectAi.addEventListener("click", () => aiModal.classList.add("hidden"));
  btnAcceptAi.addEventListener("click", () => {
    if (activeAiSuggestion && activeAiTargetField) {
      if (activeAiTargetField === "algorithm") expAlgoInput.value = activeAiSuggestion.suggested;
      else if (activeAiTargetField === "coding") expCodeInput.value = activeAiSuggestion.suggested;
      else if (activeAiTargetField === "aim") expAimInput.value = activeAiSuggestion.suggested;
      else if (activeAiTargetField === "result") expResultInput.value = activeAiSuggestion.suggested;

      updateLivePreview();
      aiModal.classList.add("hidden");
    }
  });

  // --- RAW NOTES IMPORT MODAL ---
  btnImportNotes.addEventListener("click", () => importModal.classList.remove("hidden"));
  btnCloseImport.addEventListener("click", () => importModal.classList.add("hidden"));
  btnCancelImport.addEventListener("click", () => importModal.classList.add("hidden"));
  btnApplyImport.addEventListener("click", async () => {
    const raw = importRawText.value.trim();
    if (!raw) return;

    try {
      const res = await fetch("/api/experiment/parse-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: raw })
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
      }
    } catch (e) {
      alert("Failed to parse notes: " + e.message);
    }
  });

  // --- GENERATE DOCX ---
  btnGenerate.addEventListener("click", async () => {
    const expData = {
      experiment_number: expNumberInput.value.trim(),
      title: expTitleInput.value.trim(),
      subtitle: expSubtitleInput.value.trim(),
      date: expDateInput.value.trim(),
      aim: expAimInput.value.trim(),
      algorithm: expAlgoInput.value.trim(),
      coding: expCodeInput.value,
      output: expOutputInput.value,
      output_images: attachedImageData ? [attachedImageData] : [],
      result: expResultInput.value.trim(),
      student_name: studentNameInput.value.trim(),
      register_number: registerNumberInput.value.trim()
    };

    if (!expData.experiment_number || !expData.title || !expData.aim || !expData.coding || !expData.result) {
      alert("Please fill in all required fields (Experiment Number, Title, Aim, Coding, Result).");
      return;
    }

    btnGenerate.disabled = true;
    btnGenerate.textContent = "⚡ Generating Print-Ready DOCX...";

    try {
      let endpoint = "/api/experiment/generate";
      let payload = {
        experiment: expData,
        template_id: selectTemplate.value
      };

      if (currentMode === "continue") {
        if (!uploadedRecordFileId) {
          // If user clicked continue without uploading, offer reference template
          const useSample = confirm("No existing record was uploaded yet. Would you like to append to the reference 12-page laboratory record?");
          if (useSample) {
            uploadedRecordFileId = "AI_ML_Python_Lab_Record_Reference.docx";
          } else {
            btnGenerate.disabled = false;
            btnGenerate.textContent = "⚡ Generate DOCX";
            return;
          }
        }
        endpoint = "/api/record/continue";
        payload = {
          original_filename: uploadedRecordFileId,
          experiment: expData,
          template_id: selectTemplate.value,
          preserve_original: true
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (result.success) {
        generationBanner.classList.remove("hidden");
        btnDownloadFile.href = result.download_url;
        btnDownloadFile.setAttribute("download", result.filename);
        document.getElementById("banner-title").textContent = `Document Ready (${result.filename})`;
        document.getElementById("banner-desc").textContent = result.message;

        // Smooth scroll to banner
        generationBanner.scrollIntoView({ behavior: "smooth" });
      } else {
        alert("Generation failed: " + (result.warnings ? result.warnings.join(", ") : "Unknown error"));
      }
    } catch (e) {
      alert("Generation failed: " + e.message);
    } finally {
      btnGenerate.disabled = false;
      btnGenerate.textContent = "⚡ Generate DOCX";
    }
  });

  // --- DRAFTS SYSTEM ---
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
    alert("Draft saved successfully!");
  });

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
      expNumberInput.value = d.experiment_number;
      expTitleInput.value = d.title;
      expSubtitleInput.value = d.subtitle || "";
      expDateInput.value = d.date || "";
      expAimInput.value = d.aim || "";
      expAlgoInput.value = d.algorithm || "";
      expCodeInput.value = d.coding || "";
      expOutputInput.value = d.output || "";
      expResultInput.value = d.result || "";
      if (d.student_name) studentNameInput.value = d.student_name;
      if (d.register_number) registerNumberInput.value = d.register_number;

      updateLivePreview();
      // Switch to experiment tab
      tabBtns[0].click();
      alert(`Loaded draft: Exp ${d.experiment_number}`);
    }
  };

  window.deleteDraftByIndex = (idx) => {
    let drafts = JSON.parse(localStorage.getItem("lab_record_drafts") || "[]");
    drafts.splice(idx, 1);
    localStorage.setItem("lab_record_drafts", JSON.stringify(drafts));
    loadDrafts();
  };
});
