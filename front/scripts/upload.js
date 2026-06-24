const DEBUG = false;

function logDebug(title, data) {
  if (!DEBUG) return;
  console.log(`\n ${title}`);
  if (console.table) console.table(data);
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

if (suggestBtn) suggestBtn.addEventListener("click", suggestAnalysis);
if (uploadBtn) uploadBtn.addEventListener("click", uploadFile);
if (analyzeBtn) analyzeBtn.addEventListener("click", runAnalysis);

if (suggestionSearch) {
  suggestionSearch.addEventListener("input", () => {
    applyFilters();
  });
}

if (priorityFilter) {
  priorityFilter.addEventListener("change", () => {
    applyFilters();
  });
}

if (dropZone) {
  dropZone.addEventListener("click", () => fileInput.click());
}

if (fileInput) {
  fileInput.addEventListener("change", () => {
    if (fileInput.files && fileInput.files[0]) {
      fileName.textContent = fileInput.files[0].name;
    } else {
      fileName.textContent = "No file selected";
    }
  });
}
async function uploadFile(e) {
  e.preventDefault();
  if (!fileInput || !fileInput.files) return;
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
  if (!col1 || !col2) return;
  col1.innerHTML = "";
  col2.innerHTML = "";
  columns.forEach((c) => {
    col1.add(new Option(c, c));
    col2.add(new Option(c, c));
  });
}

async function loadFiles() {
  const container = document.getElementById("fileList");
  if (!container) return;
  const res = await fetch("/files");
  const files = await res.json();
  container.innerHTML = "";

  files.forEach((file) => {
    const div = document.createElement("div");
    div.className = "file-item";
    div.innerHTML = `
      <div class="file-top">
        <span>File: ${file.filename}</span>
        <span>${file.created_at}</span>
      </div>
      <div class="file-meta">
        ${file.stats?.rows ?? "?"} rows * ${file.stats?.columns ?? "?"} cols
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
        content: `<p>Are you sure you want to delete <b>${file.filename}</b>?</p>`,
        showConfirm: true,
        confirmText: "Delete",
        onConfirm: async () => {
          await fetch(`/files/${file.file_id}`, { method: "DELETE" });
          loadFiles();
        },
      });
    };

    div.querySelector(".open-btn").onclick = async (e) => {
      e.stopPropagation();
      await openFile(file.file_id, file);
    };

    div.querySelector(".history-btn").onclick = (e) => {
      e.stopPropagation();
      window.location.href = `/static/dataset.html?file_id=${file.file_id}`;
    };

    container.appendChild(div);
  });
}
async function runAnalysis() {
  if (!currentFileId) return alert("Select dataset first");
  const col1 = document.getElementById("col1").value;
  const col2 = document.getElementById("col2").value;

  if (!col1 || !col2) return alert("Select both columns");

  try {
    const res = await fetch(
      `/analyze?file_id=${currentFileId}&col1=${encodeURIComponent(
        col1
      )}&col2=${encodeURIComponent(col2)}`,
      { method: "POST" }
    );
    const data = await res.json();

    if (!res.ok) {
      renderInsight({ error: data.detail || data.error || "Analysis failed" });
      return;
    }

    if (data.tokens_exhausted || data.status === 429) {
      triggerTokenExhaustionAlert();
      return;
    }

    renderInsight(data);
  } catch (err) {
    console.error(err);
    renderInsight({ error: "Analysis failed" });
  }
}

async function openFile(fileId, fileMeta = null) {
  currentFileId = fileId;
  let columns = fileMeta?.columns ?? [];
  let preview = fileMeta?.preview ?? [];

  if (!columns.length) {
    try {
      const infoRes = await fetch(`/file-info?file_id=${fileId}`);
      const info = await infoRes.json();
      columns = info.columns || [];
      preview = info.preview || [];
    } catch (err) {
      console.error(err);
    }
  }

  fillColumns(columns);
  renderTable(preview, columns);

  const historyRes = await fetch(`/suggestions/${fileId}`);
  const historyData = await historyRes.json();
  let suggestions = [];

  if (Array.isArray(historyData)) {
    suggestions = historyData.flatMap((x) => x.suggestions || []);
  } else if (historyData?.suggestions) {
    suggestions = historyData.suggestions;
  }

  currentSuggestions = suggestions;
  applyFilters();
  if (analyzeBtn) analyzeBtn.disabled = false;
}

async function suggestAnalysis() {
  if (!currentFileId) return alert("Select dataset first");
  try {
    const res = await fetch(`/suggest-analysis?file_id=${currentFileId}`, {
      method: "POST",
    });
    const data = await res.json();

    if (data.tokens_exhausted || data.status === 429) {
      triggerTokenExhaustionAlert();
      return;
    }

    const suggestions = normalizeSuggestionsResponse(data);

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
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
    applyFilters();
  } catch (err) {
    console.error(err);
    openModal({
      title: "Suggestion Error",
      content: `<p>Failed to generate suggestions.</p>`,
    });
  }
}

function applyFilters() {
  let list = [...currentSuggestions];
  const search = suggestionSearch?.value?.toLowerCase() || "";
  const priority = priorityFilter?.value;

  if (search) {
    list = list.filter((s) =>
      `${s.col1 ?? ""} ${s.col2 ?? ""} ${s.reason ?? ""} ${s.type ?? ""}`
        .toLowerCase()
        .includes(search)
    );
  }

  if (priority) {
    list = list.filter((s) => Number(s.priority) === Number(priority));
  }

  list.sort((a, b) => {
    const pa = Number(a.priority ?? 0);
    const pb = Number(b.priority ?? 0);
    if (pa !== pb) return pb - pa;
    return (a.type ?? "").localeCompare(b.type ?? "");
  });

  filteredSuggestions = list;
  renderSuggestions(list);
}
function renderTable(rows, columns) {
  const container = document.getElementById("tableContainer");
  const thead = document.getElementById("table-head");
  const tbody = document.getElementById("table-body");
  if (!container || !thead || !tbody) return;
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

function renderSuggestions(suggestions) {
  const tbody = document.getElementById("suggestionsContainer");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">No suggestions found</td></tr>`;
    return;
  }

  suggestions.forEach((s) => {
    const tr = document.createElement("tr");
    let priorityClass = "priority-low";
    const pVal = Number(s.priority ?? 0);
    if (pVal >= 5) priorityClass = "priority-high";
    else if (pVal === 4) priorityClass = "priority-medium";

    tr.innerHTML = `
      <td class="${priorityClass}">${renderPriority(s.priority)}</td>
      <td>${s?.col1 ?? "—"} vs ${s?.col2 ?? "—"}</td>
      <td>${s?.type ?? "—"}</td>
      <td>${s?.reason ?? "—"}</td>
      <td><button class="use-btn">Use</button></td>
    `;
    tr.querySelector(".use-btn").addEventListener("click", () => {
      const col1El = document.getElementById("col1");
      const col2El = document.getElementById("col2");
      if (col1El && col2El) {
        col1El.value = s?.col1 || "";
        col2El.value = s?.col2 || "";
      }
    });
    tbody.appendChild(tr);
  });
}

function renderInsight(data) {
  const result = document.getElementById("result");
  if (!result) return;
  if (data.error) {
    result.textContent = `Error: ${data.error}`;
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

function triggerTokenExhaustionAlert() {
  openModal({
    title: "LLM System Limit Reached",
    content: `
      <div style="text-align: center; padding: 10px 0;">
        <p style="font-size: 15px; font-weight: 600; color: #ef4444; margin-bottom: 8px;">Your AI credits or generation tokens have ended.</p>
        <p style="color: var(--text-secondary); font-size: 13.5px; line-height: 1.5;">The system cannot run deep interpretations right now. Please check your backend quota configs or try again later.</p>
      </div>
    `,
    showConfirm: false,
  });
}

function renderPriority(p) {
  const val = Number(p ?? 0);
  if (val >= 5) return "High";
  if (val === 4) return "Medium";
  if (val <= 3) return "Low";
  return "—";
}

function openModal({
  title,
  content,
  showConfirm = false,
  confirmText = "Confirm",
  onConfirm = null,
}) {
  if (
    !modalTitle ||
    !modalBody ||
    !modalOverlay ||
    !modalConfirm ||
    !modalCancel
  )
    return;
  modalTitle.textContent = title;
  modalBody.innerHTML = content;
  modalOverlay.classList.remove("hidden");
  modalConfirm.style.display = showConfirm ? "block" : "none";
  modalCancel.style.display = "block";
  modalConfirm.textContent = confirmText;
  modalConfirm.onclick = () => {
    onConfirm?.();
    closeModal();
  };
}

function closeModal() {
  if (modalOverlay) modalOverlay.classList.add("hidden");
}

if (modalClose) modalClose.onclick = closeModal;
if (modalCancel) modalCancel.onclick = closeModal;

function normalize(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.suggestions)) return data.suggestions;
  return [];
}

function clearSuggestions() {
  currentSuggestions = [];
  filteredSuggestions = [];
  const t = document.getElementById("suggestionsContainer");
  if (t) t.innerHTML = "";
}

function normalizeSuggestionsResponse(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.suggestions)) return data.suggestions;
  return [];
}

if (datasetInfoBtn) {
  datasetInfoBtn.onclick = () => {
    openModal({
      title: "Supported Analysis Types",
      content: `
        <table class="analysis-info-table">
          <tr><th>Columns</th><th>Analysis</th></tr>
          <tr><td>Numeric + Numeric</td><td>Correlation</td></tr>
          <tr><td>Category + Numeric</td><td>Comparison</td></tr>
          <tr><td>Date + Numeric</td><td>Trend Analysis</td></tr>
          <tr><td>Category + Category</td><td>Association Analysis</td></tr>
        </table>
      `,
    });
  };
}

window.addEventListener("DOMContentLoaded", loadFiles);
