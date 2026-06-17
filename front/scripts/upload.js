console.log("upload.js loaded");

const DEBUG = true;

function logDebug(title, data) {
  if (!DEBUG) return;
  console.log(`\n ${title}`);
  console.table?.(data);
  console.log(data);
}

let currentFileId = null;
let currentSuggestions = [];
let filteredSuggestions = [];

const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("file-name");
const analyzeBtn = document.getElementById("analyzeBtn");
const dropZone = document.getElementById("dropZone");
const suggestBtn = document.getElementById("suggestBtn");
const suggestionSearch = document.getElementById("suggestionSearch");
const priorityFilter = document.getElementById("priorityFilter");
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const modalConfirm = document.getElementById("modalConfirm");
const modalCancel = document.getElementById("modalCancel");
const modalClose = document.getElementById("modalClose");
const datasetInfoBtn = document.getElementById("datasetInfoBtn");

suggestBtn.addEventListener("click", suggestAnalysis);
uploadBtn.addEventListener("click", uploadFile);
analyzeBtn.addEventListener("click", runAnalysis);

if (dropZone) {
  dropZone.addEventListener("click", () => fileInput.click());
}

fileInput.addEventListener("change", () => {
  fileName.textContent = fileInput.files?.[0]?.name || "No file selected";
});

async function uploadFile(e) {
  e.preventDefault();

  const file = fileInput.files[0];

  if (!file) return alert("Select file");

  uploadBtn.disabled = true;
  uploadBtn.textContent = "Uploading...";

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Upload failed");

    const data = await res.json();

    currentFileId = data.file_id;

    fillColumns(data.columns || []);
    renderTable(data.preview || [], data.columns || []);

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

  columns.forEach((c) => {
    col1.add(new Option(c, c));
    col2.add(new Option(c, c));
  });
}

async function runAnalysis() {
  if (!currentFileId) return alert("Select dataset first");

  const col1 = document.getElementById("col1").value;
  const col2 = document.getElementById("col2").value;

  try {
    const res = await fetch(
      `/analyze?file_id=${currentFileId}&col1=${encodeURIComponent(
        col1
      )}&col2=${encodeURIComponent(col2)}`,
      { method: "POST" }
    );

    const data = await res.json();
    renderInsight(data);
  } catch (err) {
    console.error(err);
    renderInsight({ error: "Analysis failed" });
  }
}

async function loadFiles() {
  const res = await fetch("/files");
  const files = await res.json();

  const container = document.getElementById("fileList");
  container.innerHTML = "";

  files.forEach((file) => {
    const div = document.createElement("div");
    div.className = "file-item";

    div.innerHTML = `
      <div class="file-top">
        <span>📁 ${file.filename}</span>
        <span>${file.created_at}</span>
      </div>

      <div class="file-meta">
        ${file.stats?.rows ?? "?"} rows • ${file.stats?.columns ?? "?"} cols
      </div>

      <div class="file-actions">
        <button class="open-btn">Open</button>
        <button class="history-btn">History</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;

    div.querySelector(".delete-btn").onclick = (e) => {
      e.stopPropagation();

      openModal({
        title: "Delete dataset",
        content: `
      <p>
        Are you sure you want to delete
        <b>${file.filename}</b> ?
      </p>
    `,
        showConfirm: true,
        confirmText: "Delete",
        onConfirm: async () => {
          await fetch(`/files/${file.file_id}`, {
            method: "DELETE",
          });

          loadFiles();
        },
      });
    };

    div.querySelector(".open-btn").onclick = async (e) => {
      e.stopPropagation();
      await openFile(file.file_id);
    };

    div.querySelector(".history-btn").onclick = (e) => {
      e.stopPropagation();
      window.location.href = `/static/dataset.html?file_id=${file.file_id}`;
    };

    container.appendChild(div);
  });
}

// -------------------- OPEN FILE --------------------

async function openFile(fileId) {
  currentFileId = fileId;

  const historyRes = await fetch(`/suggestions/${fileId}`);
  const historyData = await historyRes.json();

  console.log("📜 RAW history:", historyData);

  // flatten ALL suggestion batches
  let suggestions = [];

  if (Array.isArray(historyData)) {
    suggestions = historyData.flatMap((x) => x.suggestions || []);
  } else if (historyData?.suggestions) {
    suggestions = historyData.suggestions;
  }

  console.log("📜 FLATTENED suggestions:", suggestions);

  currentSuggestions = suggestions;

  applyFilters();

  analyzeBtn.disabled = false;
}

// -------------------- TABLE --------------------

function renderTable(rows, columns) {
  const container = document.getElementById("tableContainer");
  const thead = document.getElementById("table-head");
  const tbody = document.getElementById("table-body");

  thead.innerHTML = "";
  tbody.innerHTML = "";

  if (!rows?.length) {
    container.style.display = "none";
    return;
  }

  const tr = document.createElement("tr");

  columns.forEach((c) => {
    const th = document.createElement("th");
    th.textContent = c;
    tr.appendChild(th);
  });

  thead.appendChild(tr);

  rows.forEach((row) => {
    const tr = document.createElement("tr");

    columns.forEach((c) => {
      const td = document.createElement("td");
      td.textContent = row?.[c] ?? "";
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  container.style.display = "block";
}

// -------------------- INSIGHT --------------------

function renderInsight(data) {
  const result = document.getElementById("result");
  if (!result) return;

  if (data.error) {
    result.textContent = `❌ ${data.error}`;
    return;
  }

  result.textContent = `
Insight:
${data.insight}

Analysis Type:
${data.analysis_type}

Metrics:
${JSON.stringify(data.metrics, null, 2)}

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

// -------------------- SUGGESTIONS --------------------

async function suggestAnalysis() {
  if (!currentFileId) {
    return alert("Select dataset first");
  }

  try {
    const res = await fetch(`/suggest-analysis?file_id=${currentFileId}`, {
      method: "POST",
    });

    const data = await res.json();

    console.log("📦 suggest-analysis response:", data);

    const suggestions = normalizeSuggestionsResponse(data);

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      console.warn("⚠️ No suggestions returned");

      openModal({
        title: "No suggestions",
        content: `
          <p>No valid column pairs found.</p>
          <p>Check backend filtering (identifiers / thresholds).</p>
        `,
      });

      return;
    }

    currentSuggestions = suggestions;

    // IMPORTANT: одразу застосовуємо сортування/фільтри
    applyFilters();
  } catch (err) {
    console.error("❌ Suggestion error:", err);

    openModal({
      title: "Suggestion Error",
      content: `<p>Failed to generate suggestions.</p>`,
    });
  }
}

// -------------------- PRIORITY RENDER --------------------

function renderPriority(p) {
  const val = Number(p ?? 0);

  if (val >= 5) return "🔥 High";
  if (val === 4) return "⚡ Medium";
  if (val <= 3) return "🧊 Low";

  return "—";
}

// -------------------- FILTERS --------------------

function applyFilters() {
  let list = [...currentSuggestions];

  const search = suggestionSearch?.value?.toLowerCase() || "";
  const priority = priorityFilter?.value;

  if (search) {
    list = list.filter((s) =>
      `${s.col1 ?? ""} ${s.col2 ?? ""} ${s.reason ?? ""}`
        .toLowerCase()
        .includes(search)
    );
  }

  if (priority) {
    list = list.filter((s) => Number(s.priority) === Number(priority));
  }

  // 🔥 FIX: стабільне сортування
  list.sort((a, b) => {
    const pa = Number(b.priority ?? 0);
    const pb = Number(a.priority ?? 0);

    if (pa !== pb) return pa - pb;

    // tie-breaker: тип
    return (a.type ?? "").localeCompare(b.type ?? "");
  });

  filteredSuggestions = list;

  renderSuggestions(list);
}

// -------------------- RENDER SUGGESTIONS --------------------

function renderSuggestions(suggestions) {
  const tbody = document.getElementById("suggestionsContainer");
  if (!tbody) return;

  console.log("🎯 renderSuggestions INPUT:", suggestions);

  tbody.innerHTML = "";

  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">No suggestions found</td>
      </tr>
    `;
    return;
  }

  const sorted = [...suggestions].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
  );

  sorted.forEach((s, index) => {
    console.log(`row ${index}:`, s);

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${renderPriority?.(s.priority) ?? s.priority ?? "—"}</td>
      <td>${s?.col1 ?? "—"} ↔ ${s?.col2 ?? "—"}</td>
      <td>${s?.type ?? "—"}</td>
      <td>${s?.reason ?? "—"}</td>
      <td><button class="use-btn">Use</button></td>
    `;

    tr.querySelector(".use-btn").addEventListener("click", () => {
      document.getElementById("col1").value = s?.col1 || "";
      document.getElementById("col2").value = s?.col2 || "";
    });

    tbody.appendChild(tr);
  });
}

// -------------------- NORMALIZER --------------------

function normalize(data) {
  if (!data) return [];

  if (Array.isArray(data)) return data;

  if (Array.isArray(data.suggestions)) return data.suggestions;

  return [];
}

// -------------------- CLEAR --------------------

function clearSuggestions() {
  currentSuggestions = [];
  filteredSuggestions = [];

  const t = document.getElementById("suggestionsContainer");
  if (t) t.innerHTML = "";
}

function normalizeSuggestionsResponse(data) {
  if (!data) return [];

  // case: backend already returns array
  if (Array.isArray(data)) return data;

  // case: /suggestions/{file_id}
  if (Array.isArray(data.suggestions)) return data.suggestions;

  // fallback
  return [];
}
// Modal
function openModal({
  title,
  content,
  showConfirm = false,
  confirmText = "Confirm",
  onConfirm = null,
}) {
  modalTitle.textContent = title;

  modalBody.innerHTML = content;

  modalOverlay.classList.remove("hidden");

  modalConfirm.style.display = showConfirm ? "block" : "none";

  modalCancel.style.display = showConfirm ? "block" : "block";

  modalConfirm.textContent = confirmText;

  modalConfirm.onclick = () => {
    onConfirm?.();

    closeModal();
  };
}
function closeModal() {
  modalOverlay.classList.add("hidden");
}

modalClose.onclick = closeModal;
modalCancel.onclick = closeModal;
if (datasetInfoBtn) {
  datasetInfoBtn.onclick = () => {
    openModal({
      title: "Supported Analysis Types",

      content: `
        <table class="analysis-info-table">

          <tr>
            <th>Columns</th>
            <th>Analysis</th>
          </tr>

          <tr>
            <td>Numeric + Numeric</td>
            <td>Correlation</td>
          </tr>

          <tr>
            <td>Category + Numeric</td>
            <td>Comparison</td>
          </tr>

          <tr>
            <td>Date + Numeric</td>
            <td>Trend Analysis</td>
          </tr>

          <tr>
            <td>Category + Category</td>
            <td>Association Analysis</td>
          </tr>

        </table>
      `,
    });
  };
}
window.addEventListener("DOMContentLoaded", loadFiles);
