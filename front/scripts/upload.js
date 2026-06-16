console.log("upload.js loaded");

let currentFileId = null;
let currentSuggestions = [];
let filteredSuggestions = [];

const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("file-name");
const analyzeBtn = document.getElementById("analyzeBtn");

const dropZone = document.getElementById("dropZone");
const suggestBtn = document.getElementById("suggestBtn");

suggestBtn.addEventListener("click", suggestAnalysis);
uploadBtn.addEventListener("click", uploadFile);
analyzeBtn.addEventListener("click", runAnalysis);

if (dropZone) {
  dropZone.addEventListener("click", () => fileInput.click());
}

fileInput.addEventListener("change", () => {
  fileName.textContent =
    fileInput.files?.[0]?.name || "No file selected";
});

async function uploadFile(e) {
  e.preventDefault();

  const file = fileInput.files[0];

  if (!file) {
    return alert("Select file");
  }

  uploadBtn.disabled = true;
  uploadBtn.textContent = "Uploading...";

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Upload failed");
    }

    const data = await res.json();

    currentFileId = data.file_id;

    fillColumns(data.columns || []);
    renderTable(
      data.preview || [],
      data.columns || []
    );

    analyzeBtn.disabled = false;

    clearSuggestions();

    await loadFiles();

  } catch (err) {

    console.error(err);

    uploadBtn.textContent = "Error";

  } finally {

    setTimeout(() => {

      uploadBtn.textContent = "Upload";
      uploadBtn.disabled = false;

    }, 1000);
  }
}

function fillColumns(columns) {

  const col1 = document.getElementById("col1");
  const col2 = document.getElementById("col2");

  col1.innerHTML = "";
  col2.innerHTML = "";

  columns.forEach((column) => {

    col1.add(
      new Option(column, column)
    );

    col2.add(
      new Option(column, column)
    );
  });
}

async function runAnalysis() {

  if (!currentFileId) {
    return alert("Select dataset first");
  }

  const col1 =
    document.getElementById("col1").value;

  const col2 =
    document.getElementById("col2").value;

  try {

    const res = await fetch(
      `/analyze?file_id=${currentFileId}&col1=${encodeURIComponent(col1)}&col2=${encodeURIComponent(col2)}`,
      {
        method: "POST",
      }
    );

    const data = await res.json();

    renderInsight(data);

  } catch (err) {

    console.error(err);

    renderInsight({
      error: "Analysis failed",
    });
  }
}

async function loadFiles() {

  const res = await fetch("/files");

  const files = await res.json();

  const container =
    document.getElementById("fileList");

  container.innerHTML = "";

  files.forEach((file) => {

    const div =
      document.createElement("div");

    div.className = "file-item";

    div.innerHTML = `
      <div class="file-top">
        <span>📁 ${file.filename}</span>
        <span>${file.created_at}</span>
      </div>

      <div class="file-meta">
        ${file.stats?.rows ?? "?"} rows •
        ${file.stats?.columns ?? "?"} cols
      </div>

      <div class="file-actions">
        <button class="open-btn">Open</button>
        <button class="history-btn">History</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;

    const openBtn =
      div.querySelector(".open-btn");

    const historyBtn =
      div.querySelector(".history-btn");

    const deleteBtn =
      div.querySelector(".delete-btn");

    deleteBtn.addEventListener(
      "click",
      async (e) => {

        e.stopPropagation();

        await fetch(
          `/files/${file.file_id}`,
          {
            method: "DELETE",
          }
        );

        loadFiles();
      }
    );

    openBtn.addEventListener(
      "click",
      async (e) => {

        e.stopPropagation();

        await openFile(file.file_id);
      }
    );

    historyBtn.addEventListener(
      "click",
      (e) => {

        e.stopPropagation();

        window.location.href =
          `/static/dataset.html?file_id=${file.file_id}`;
      }
    );

    container.appendChild(div);
  });
}

async function openFile(fileId) {

  currentFileId = fileId;

  const res = await fetch(
    `/file-info?file_id=${fileId}`
  );

  const data = await res.json();

  renderTable(
    data.preview || [],
    data.columns || []
  );

  fillColumns(
    data.columns || []
  );

  clearSuggestions();

  analyzeBtn.disabled = false;
}

window.addEventListener(
  "DOMContentLoaded",
  loadFiles
);

function renderTable(rows, columns) {

  const container =
    document.getElementById(
      "tableContainer"
    );

  const thead =
    document.getElementById(
      "table-head"
    );

  const tbody =
    document.getElementById(
      "table-body"
    );

  thead.innerHTML = "";
  tbody.innerHTML = "";

  if (!rows?.length) {

    container.style.display = "none";

    return;
  }

  const headerRow =
    document.createElement("tr");

  columns.forEach((column) => {

    const th =
      document.createElement("th");

    th.textContent = column;

    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);

  rows.forEach((row) => {

    const tr =
      document.createElement("tr");

    columns.forEach((column) => {

      const td =
        document.createElement("td");

      td.textContent =
        row[column] ?? "";

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  container.style.display = "block";
}

function renderInsight(data) {

  const result =
    document.getElementById("result");

  if (!result) return;

  if (data.error) {

    result.textContent =
      `❌ ${data.error}`;

    return;
  }

  result.textContent = `
Insight:
${data.insight}

Analysis Type:
${data.analysis_type}

Metrics:
${JSON.stringify(
  data.metrics,
  null,
  2
)}

Bootstrap Stability:
${data.stability}

Reliability:
${data.reliability}

Report ID:
${data.report_id ?? "N/A"}

LLM Report:
${data.llm_report ?? "Not generated"}
`;
}

async function suggestAnalysis() {

  if (!currentFileId) {
    return alert("Select dataset first");
  }

  try {

    const res = await fetch(
      `/suggest-analysis?file_id=${currentFileId}`,
      {
        method: "POST",
      }
    );

    const data = await res.json();

    currentSuggestions =
      data.suggestions || [];

    renderSuggestions(
      currentSuggestions
    );

  } catch (err) {

    console.error(err);

    alert("Suggestion failed");
  }
}

function renderSuggestions(suggestions) {

  const container =
    document.getElementById(
      "suggestionsContainer"
    );

  if (!container) return;

  container.innerHTML = "";

  if (!suggestions.length) {

    container.innerHTML =
      "<p>No suggestions found.</p>";

    return;
  }

  suggestions.forEach((s) => {

    const card =
      document.createElement("div");

    card.className =
      "suggestion-card";

    card.innerHTML = `
      <h4>${s.col1} ↔ ${s.col2}</h4>

      <p>${s.reason}</p>

      <small>
        Type: ${s.type}
      </small>

      <button>
        Use this analysis
      </button>
    `;

    card
      .querySelector("button")
      .addEventListener(
        "click",
        () => {

          document.getElementById(
            "col1"
          ).value = s.col1;

          document.getElementById(
            "col2"
          ).value = s.col2;
        }
      );

    container.appendChild(card);
  });
}

function clearSuggestions() {

  currentSuggestions = [];

  const container =
    document.getElementById(
      "suggestionsContainer"
    );

  if (container) {
    container.innerHTML = "";
  }
}