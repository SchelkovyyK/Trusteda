const params = new URLSearchParams(window.location.search);
const fileId = params.get("file_id");

// DOM
const fileNameElement = document.getElementById("fileName");
const datasetInfoElement = document.getElementById("datasetInfo");
const previewHeadElement = document.getElementById("previewHead");
const previewBodyElement = document.getElementById("previewBody");
const historyBodyElement = document.getElementById("historyBody");
const suggestionsBodyElement = document.getElementById("suggestionsBody");
const reportElement = document.getElementById("report");
const historySearchElement = document.getElementById("historySearch");

// STATE
let currentFile = null;
let allReports = [];
let allSuggestions = [];

async function loadDataset() {
  try {
    const res = await fetch(`/dataset/${fileId}`);
    const data = await res.json();

    console.log("DATASET RESPONSE:", data);

    if (data.error) {
      alert(data.error);
      return;
    }

    currentFile = data.file;

    // state
    allReports = data.reports || [];
    allSuggestions = data.suggestion_history || [];

    fileNameElement.textContent = currentFile.filename;

    renderDatasetInfo(currentFile);

    // ❗ IMPORTANT: рендеримо все одразу
    renderHistory(allReports);
    renderSuggestions(allSuggestions);
  } catch (err) {
    console.error(err);
  }
}

function renderDatasetInfo(file) {
  datasetInfoElement.innerHTML = `
    <div class="file-card">

      <div class="file-main">
        <strong>${file.filename}</strong>
        <div class="file-date">${file.created_at}</div>
      </div>

      <div class="file-meta">
        ${file.stats?.rows ?? "-"} rows • ${file.stats?.columns ?? "-"} columns
      </div>

      <div class="file-actions">

        <button class="actions-btn" onclick="openFile()">
          Open
        </button>

        <button class="actions-btn" onclick="toggleFileMenu(this)">
          ⋮
        </button>

        <div class="actions-menu hidden">
          <button class="menu-item" onclick="deleteFile()">
            Delete
          </button>
        </div>

      </div>

    </div>
  `;
}

function openFile() {
  if (!currentFile) return;

  reportElement.textContent = JSON.stringify(currentFile, null, 2);
}

function toggleFileMenu(button) {
  const menu = button.nextElementSibling;

  document.querySelectorAll(".actions-menu").forEach((m) => {
    if (m !== menu) m.classList.add("hidden");
  });

  menu.classList.toggle("hidden");
}

function deleteFile() {
  console.log("DELETE FILE:", fileId);
}

function renderPreview(rows = [], columns = []) {
  previewHeadElement.innerHTML = "";
  previewBodyElement.innerHTML = "";

  if (!rows.length || !columns.length) {
    previewBodyElement.innerHTML = `
      <tr>
        <td colspan="1">No preview available.</td>
      </tr>
    `;
    return;
  }

  const headerRow = document.createElement("tr");

  columns.forEach((column) => {
    const th = document.createElement("th");
    th.textContent = column;
    headerRow.appendChild(th);
  });

  previewHeadElement.appendChild(headerRow);

  rows.forEach((row) => {
    const tr = document.createElement("tr");

    columns.forEach((column) => {
      const td = document.createElement("td");
      td.textContent = row?.[column] ?? "";
      tr.appendChild(td);
    });

    previewBodyElement.appendChild(tr);
  });
}

function renderHistory(reports = []) {
  historyBodyElement.innerHTML = "";

  if (!reports.length) {
    historyBodyElement.innerHTML = `
      <tr>
        <td colspan="5">No reports generated yet.</td>
      </tr>
    `;
    return;
  }

  reports.forEach((report) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${report.insight || "Analysis"}</td>
      <td>${report.analysis_type || "-"}</td>
      <td>${
        report.reliability != null ? Number(report.reliability).toFixed(2) : "-"
      }</td>
      <td>${report.created_at || "-"}</td>

      <td class="actions-cell">
        <button class="actions-btn" onclick="toggleActionsMenu(this)">⋮</button>

        <div class="actions-menu hidden">
          <button class="menu-item" onclick="openReport('${report.report_id}')">
            Open
          </button>

          <button class="menu-item delete" onclick="deleteReport('${
            report.report_id
          }')">
            Delete
          </button>
        </div>
      </td>
    `;

    historyBodyElement.appendChild(tr);
  });
}

function renderSuggestions(history = []) {
  suggestionsBodyElement.innerHTML = "";

  if (!history.length) {
    suggestionsBodyElement.innerHTML = `
      <tr>
        <td colspan="4">No suggestion history.</td>
      </tr>
    `;
    return;
  }

  history.forEach((h) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${h.created_at || "-"}</td>
      <td>${h.count || 0}</td>
      <td>${h.suggestion_id?.slice(0, 12) || "-"}...</td>

      <td class="actions-cell">
        <button class="actions-btn" onclick="toggleActionsMenu(this)">⋮</button>

        <div class="actions-menu hidden">
          <button class="menu-item" onclick="openSuggestion('${
            h.suggestion_id
          }')">
            Open
          </button>
        </div>
      </td>
    `;

    suggestionsBodyElement.appendChild(tr);
  });
}

function copyText(encoded) {
  const text = decodeURIComponent(encoded);
  navigator.clipboard.writeText(text);
}

async function openSuggestion(suggestionId) {
  try {
    const res = await fetch(`/suggestion/${suggestionId}`);
    const data = await res.json();

    reportElement.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    console.error(err);
  }
}

async function openReport(reportId) {
  try {
    const res = await fetch(`/report/${reportId}`);
    const data = await res.json();

    reportElement.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    console.error(err);
    reportElement.textContent = "Failed to load report.";
  }
}

function toggleActionsMenu(button) {
  const menu = button.nextElementSibling;

  document.querySelectorAll(".actions-menu").forEach((m) => {
    if (m !== menu) m.classList.add("hidden");
  });

  menu.classList.toggle("hidden");
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".actions-cell")) {
    document.querySelectorAll(".actions-menu").forEach((menu) => {
      menu.classList.add("hidden");
    });
  }
});

function deleteReport(reportId) {
  console.log("DELETE REPORT:", reportId);
}

function deleteSuggestion(suggestionId) {
  console.log("DELETE SUGGESTION:", suggestionId);
}

historySearchElement.addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();

  const filtered = allReports.filter((report) => {
    return (
      (report.insight || "").toLowerCase().includes(query) ||
      (report.analysis_type || "").toLowerCase().includes(query) ||
      (report.created_at || "").toLowerCase().includes(query)
    );
  });

  renderHistory(filtered);
});

loadDataset();
