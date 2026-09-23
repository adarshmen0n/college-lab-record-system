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
  const expSubjectSelect = document.getElementById("exp-subject");
  const expProcHeadingInput = document.getElementById("exp-proc-heading");
  const expCodeHeadingInput = document.getElementById("exp-code-heading");
  const lblProcHeading = document.getElementById("lbl-proc-heading");
  const lblCodeHeading = document.getElementById("lbl-code-heading");
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
  const prevProcHeading = document.getElementById("prev-proc-heading");
  const prevCodeHeading = document.getElementById("prev-code-heading");
  const viewModeBtns = document.querySelectorAll(".view-mode-toggle .view-btn");
  const bookSpreadContainer = document.getElementById("book-spread-container");
  const sheetLeft = document.getElementById("sheet-left");
  const sheetRight = document.getElementById("sheet-right");
  const btnFloatingPreview = document.getElementById("btn-floating-preview");

  // Subject presets dictionary
  const SUBJECT_PRESETS = {
    python: {
      proc: "ALGORITHM",
      code: "CODING",
      codePlaceholder: "def solution():\n    # Python program here",
      sample: {
        num: "1.D",
        title: "COMPREHENSION",
        sub: "GENERATOR COMPREHENSION",
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
      }
    },
    java: {
      proc: "ALGORITHM",
      code: "PROGRAM",
      codePlaceholder: "public class Solution {\n    public static void main(String[] args) {\n        // Java code here\n    }\n}",
      sample: {
        num: "2.A",
        title: "POLYMORPHISM & INHERITANCE",
        sub: "METHOD OVERRIDING",
        aim: "To implement runtime polymorphism and dynamic method dispatch in Java.",
        algo: "1. Create parent class 'Shape' with draw() method.\n2. Create subclasses 'Circle' and 'Rectangle' overriding draw().\n3. Instantiate subclasses using parent reference.\n4. Invoke overridden methods and observe runtime binding.",
        code: `class Shape {
    void draw() {
        System.out.println("Drawing generic shape");
    }
}
class Circle extends Shape {
    @Override
    void draw() {
        System.out.println("Drawing circle with radius r");
    }
}
public class Main {
    public static void main(String[] args) {
        Shape s = new Circle();
        s.draw();
    }
}`,
        output: "Drawing circle with radius r",
        result: "Runtime polymorphism was successfully implemented and verified in Java."
      }
    },
    cpp: {
      proc: "ALGORITHM",
      code: "PROGRAM",
      codePlaceholder: "#include <iostream>\nusing namespace std;\n\nint main() {\n    // C++ code here\n    return 0;\n}",
      sample: {
        num: "3.A",
        title: "BINARY SEARCH TREE",
        sub: "BST INSERTION & INORDER",
        aim: "To construct a binary search tree and display elements in ascending order via in-order traversal.",
        algo: "1. Define Node structure with data, left, and right pointers.\n2. Implement insert() function recursively comparing keys.\n3. Implement inOrder() traversal (Left, Root, Right).\n4. Test with given input elements.",
        code: `#include <iostream>
using namespace std;

struct Node {
    int val;
    Node *left, *right;
    Node(int v) : val(v), left(nullptr), right(nullptr) {}
};

Node* insert(Node* root, int key) {
    if (!root) return new Node(key);
    if (key < root->val) root->left = insert(root->left, key);
    else root->right = insert(root->right, key);
    return root;
}

void inOrder(Node* root) {
    if (!root) return;
    inOrder(root->left);
    cout << root->val << " ";
    inOrder(root->right);
}

int main() {
    Node* root = nullptr;
    int keys[] = {50, 30, 20, 40, 70, 60, 80};
    for (int k : keys) root = insert(root, k);
    cout << "Inorder traversal: ";
    inOrder(root);
    cout << endl;
    return 0;
}`,
        output: "Inorder traversal: 20 30 40 50 60 70 80",
        result: "The binary search tree was created and traversed in order successfully."
      }
    },
    dbms: {
      proc: "PROCEDURE",
      code: "SQL QUERIES",
      codePlaceholder: "CREATE TABLE Student (\n    id INT PRIMARY KEY,\n    name VARCHAR(50)\n);",
      sample: {
        num: "4.A",
        title: "EMPLOYEE & DEPARTMENT DATABASE",
        sub: "DDL, DML & AGGREGATE FUNCTIONS",
        aim: "To create Employee and Department relational tables, enforce constraints, and execute aggregation queries.",
        algo: "1. Create Department table with DeptID as primary key.\n2. Create Employee table referencing DeptID with foreign key.\n3. Insert representative tuple records.\n4. Perform GROUP BY and aggregate functions (COUNT, AVG).",
        code: `-- DDL: Create Tables
CREATE TABLE Department (
    DeptID INT PRIMARY KEY,
    DeptName VARCHAR(50) NOT NULL
);

CREATE TABLE Employee (
    EmpID INT PRIMARY KEY,
    EmpName VARCHAR(50) NOT NULL,
    Salary DECIMAL(10, 2),
    DeptID INT,
    FOREIGN KEY (DeptID) REFERENCES Department(DeptID)
);

-- DML: Insert and Query
INSERT INTO Department VALUES (1, 'Engineering'), (2, 'Finance');
INSERT INTO Employee VALUES (101, 'Alice', 75000, 1), (102, 'Bob', 82000, 1);

SELECT d.DeptName, COUNT(e.EmpID) AS HeadCount, AVG(e.Salary) AS AvgSalary
FROM Department d JOIN Employee e ON d.DeptID = e.DeptID
GROUP BY d.DeptName;`,
        output: "DeptName    | HeadCount | AvgSalary\nEngineering | 2         | 78500.00",
        result: "Relational tables and aggregate queries were executed and verified successfully."
      }
    },
    linux: {
      proc: "PROCEDURE",
      code: "COMMANDS",
      codePlaceholder: "#!/bin/bash\n# Linux shell script here",
      sample: {
        num: "5.A",
        title: "SHELL SCRIPTING & PROCESS MONITORING",
        sub: "BASH SCRIPT AUTOMATION",
        aim: "To automate system process monitoring and disk usage logging using bash shell scripts.",
        algo: "1. Write bash script to extract disk usage using df -h.\n2. Filter root partition percentage using awk.\n3. Check threshold limit (> 80%).\n4. Output status report.",
        code: `#!/bin/bash
# Disk usage and process monitor
THRESHOLD=80
USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')

echo "=== SYSTEM HEALTH CHECK ==="
echo "Current Disk Usage: ${USAGE}%"
if [ "$USAGE" -gt "$THRESHOLD" ]; then
    echo "WARNING: Disk space exceeded ${THRESHOLD}% threshold!"
else
    echo "STATUS: Disk space is within normal operating limits."
fi

echo "Top 3 CPU Processes:"
ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%cpu | head -n 4`,
        output: "=== SYSTEM HEALTH CHECK ===\nCurrent Disk Usage: 42%\nSTATUS: Disk space is within normal operating limits.\nTop 3 CPU Processes:\n  PID  PPID CMD                         %MEM %CPU\n 1204     1 /usr/lib/systemd/systemd     0.3  1.2\n 4512  1204 /usr/bin/dockerd             2.1  0.8\n 8910  4512 /usr/bin/containerd          1.5  0.4",
        result: "The shell script was executed and system monitoring metrics were recorded successfully."
      }
    },
    networks: {
      proc: "PROCEDURE",
      code: "COMMANDS",
      codePlaceholder: "# Network socket program or packet trace commands",
      sample: {
        num: "6.A",
        title: "SOCKET PROGRAMMING (TCP CLIENT-SERVER)",
        sub: "BIDIRECTIONAL COMMUNICATION",
        aim: "To implement full-duplex client-server communication using TCP sockets.",
        algo: "1. Server initializes socket, binds to IP and port, and listens.\n2. Client connects to server socket via IP address.\n3. Client sends greeting payload; server responds.\n4. Socket connection is gracefully closed.",
        code: `# Server Code
import socket

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind(('127.0.0.1', 8080))
server.listen(1)
print("Server listening on port 8080...")
conn, addr = server.accept()
print(f"Connected by {addr}")
data = conn.recv(1024)
print(f"Received: {data.decode()}")
conn.sendall(b"ACK: Message received")
conn.close()`,
        output: "Server listening on port 8080...\nConnected by ('127.0.0.1', 54321)\nReceived: HELLO_SERVER\nACK: Message received",
        result: "TCP client-server connection was established and verified successfully."
      }
    },
    web: {
      proc: "PROCEDURE",
      code: "SOURCE CODE",
      codePlaceholder: "<!DOCTYPE html>\n<html>\n<head><title>Web App</title></head>\n<body>...</body>\n</html>",
      sample: {
        num: "7.A",
        title: "RESPONSIVE ACCESSIBLE DATA GRID",
        sub: "HTML5, CSS3 & FETCH API",
        aim: "To design a responsive, accessible client-side data viewer with live search filtering.",
        algo: "1. Create semantic HTML markup with accessible table.\n2. Style with responsive CSS Grid and Flexbox.\n3. Fetch mock JSON data using fetch() API.\n4. Bind search input to dynamically filter displayed records.",
        code: `const searchInput = document.getElementById("search");
const tableRows = document.querySelectorAll("#dataTable tbody tr");

searchInput.addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase();
  tableRows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(term) ? "" : "none";
  });
});`,
        output: "Search: 'alice'\nFound 1 matching record: [ID: 101, Name: Alice, Dept: Engineering]",
        result: "Interactive web data viewer was implemented and verified with zero console errors."
      }
    },
    custom: {
      proc: "PROCEDURE",
      code: "PROGRAM",
      codePlaceholder: "// Enter source code or commands",
      sample: null
    }
  };

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

  // --- SUBJECT SELECTION LISTENER ---
  if (expSubjectSelect) {
    expSubjectSelect.addEventListener("change", () => {
      const subKey = expSubjectSelect.value;
      const preset = SUBJECT_PRESETS[subKey] || SUBJECT_PRESETS.python;
      if (expProcHeadingInput) expProcHeadingInput.value = preset.proc;
      if (expCodeHeadingInput) expCodeHeadingInput.value = preset.code;
      if (preset.codePlaceholder && expCodeInput) {
        expCodeInput.placeholder = preset.codePlaceholder;
      }
      updateLivePreview();
    });
  }

  // --- FILL SAMPLE DATA ---
  btnSampleData.addEventListener("click", () => {
    const subKey = (expSubjectSelect && expSubjectSelect.value) || "python";
    const preset = SUBJECT_PRESETS[subKey] || SUBJECT_PRESETS.python;
    const sample = preset.sample || SUBJECT_PRESETS.python.sample;

    expNumberInput.value = sample.num;
    expDateInput.value = "23-09-2026";
    expTitleInput.value = sample.title;
    expSubtitleInput.value = sample.sub || "";
    if (expProcHeadingInput) expProcHeadingInput.value = preset.proc;
    if (expCodeHeadingInput) expCodeHeadingInput.value = preset.code;
    expAimInput.value = sample.aim;
    expAlgoInput.value = sample.algo;
    expCodeInput.value = sample.code;
    expOutputInput.value = sample.output;
    expResultInput.value = sample.result;
    updateLivePreview();
  });

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
  const allInputs = [
    expNumberInput, expDateInput, expTitleInput, expSubtitleInput,
    studentNameInput, registerNumberInput, expAimInput, expAlgoInput,
    expCodeInput, expOutputInput, expResultInput,
    expProcHeadingInput, expCodeHeadingInput
  ];

  allInputs.forEach(input => {
    if (input) {
      input.addEventListener("input", updateLivePreview);
    }
  });

  function updateLivePreview() {
    prevExNo.textContent = expNumberInput.value || "1.D";
    prevDate.textContent = expDateInput.value || "23-09-2026";
    prevTitle.textContent = (expTitleInput.value || "COMPREHENSION").toUpperCase();
    prevSubtitle.textContent = (expSubtitleInput.value || "").toUpperCase();

    // Dynamic Section Headings
    const pHeading = (expProcHeadingInput && expProcHeadingInput.value.trim()) || "ALGORITHM";
    const cHeading = (expCodeHeadingInput && expCodeHeadingInput.value.trim()) || "CODING";
    if (lblProcHeading) lblProcHeading.textContent = pHeading;
    if (lblCodeHeading) lblCodeHeading.textContent = cHeading;
    if (prevProcHeading) prevProcHeading.textContent = pHeading;
    if (prevCodeHeading) prevCodeHeading.textContent = cHeading;

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
      subject: (expSubjectSelect && expSubjectSelect.value) || "python",
      procedure_heading: (expProcHeadingInput && expProcHeadingInput.value.trim()) || "ALGORITHM",
      code_heading: (expCodeHeadingInput && expCodeHeadingInput.value.trim()) || "CODING",
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
      subject: (expSubjectSelect && expSubjectSelect.value) || "python",
      procedure_heading: (expProcHeadingInput && expProcHeadingInput.value) || "ALGORITHM",
      code_heading: (expCodeHeadingInput && expCodeHeadingInput.value) || "CODING",
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
          <div style="font-size:0.75rem;color:#64748b;">[${(d.subject || 'python').toUpperCase()}] Saved at ${d.timestamp}</div>
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
      if (d.subject && expSubjectSelect) expSubjectSelect.value = d.subject;
      if (d.procedure_heading && expProcHeadingInput) expProcHeadingInput.value = d.procedure_heading;
      if (d.code_heading && expCodeHeadingInput) expCodeHeadingInput.value = d.code_heading;
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
