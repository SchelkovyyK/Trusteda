const params = new URLSearchParams(window.location.search);
const fileId = params.get("file_id");

const fileNameElement = document.getElementById("fileName");
const datasetInfoElement = document.getElementById("datasetInfo");
const previewHeadElement = document.getElementById("previewHead");
const previewBodyElement = document.getElementById("previewBody");
const historyBodyElement = document.getElementById("historyBody");
const suggestionsBodyElement = document.getElementById("suggestionsBody");
const reportElement = document.getElementById("report");
const historySearchElement = document.getElementById("historySearch");

const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const modalConfirm = document.getElementById("modalConfirm");
const modalCancel = document.getElementById("modalCancel");
const modalClose = document.getElementById("modalClose");

let currentFile = null;
let allReports = [];
let allSuggestions = [];

async function loadDataset() {
  if (!fileId) return;
  try {
    const res = await fetch(`/dataset/${fileId}`);
    const data = await res.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    currentFile = data.file;
    allReports = data.reports || [];
    allSuggestions = data.suggestion_history || [];

    if (fileNameElement) {
      fileNameElement.textContent = currentFile.filename;
    }

    renderDatasetInfo(currentFile);
    renderPreview(currentFile.preview || [], currentFile.columns || []);
    renderHistory(allReports);
    renderSuggestions(allSuggestions);
  } catch (err) {
    console.error(err);
  }
}

function renderDatasetInfo(file) {
  if (!datasetInfoElement) return;
  datasetInfoElement.innerHTML = `
    <div class="file-card">
      <div class="file-main">
        <strong>${file.filename}</strong>
        <div class="file-date">${file.created_at}</div>
      </div>
      <div class="file-meta">
        ${file.stats?.rows ?? "-"} rows * ${file.stats?.columns ?? "-"} columns
      </div>
      <div class="file-actions">
        <button class="actions-btn menu-toggle-trigger">⋮</button>
        <div class="actions-menu hidden">
          <button class="menu-item open-file-trigger">Open</button>
          <button class="menu-item delete file-delete-trigger">Delete Project</button>
        </div>
      </div>
    </div>
  `;

  const container = datasetInfoElement.querySelector(".file-card");

  const toggleBtn = container.querySelector(".menu-toggle-trigger");
  toggleBtn.onclick = (e) => {
    e.stopPropagation();
    const menu = container.querySelector(".actions-menu");
    closeAllMenus(menu);
    if (menu) menu.classList.toggle("hidden");
  };

  container.querySelector(".open-file-trigger").onclick = () => {
    if (!currentFile) return;
    updateSelectedBlock(currentFile);
  };

  container.querySelector(".file-delete-trigger").onclick = () => {
    openModal({
      title: "Delete Dataset Project",
      content: `
        <div class="modal-subtitle">ID: ${fileId}</div>
        <p>Are you sure you want to delete <strong>${file.filename}</strong>?</p>
        <p class="modal-warning">Warning: This action will instantly wipe all analysis reports and suggestion histories linked to this file.</p>
      `,
      showConfirm: true,
      confirmText: "Delete Project",
      onConfirm: async () => {
        try {
          await fetch(`/files/${fileId}`, { method: "DELETE" });
          window.location.href = "/";
        } catch (err) {
          console.error(err);
        }
      },
    });
  };
}
function renderPreview(rows = [], columns = []) {
  if (!previewHeadElement || !previewBodyElement) return;
  previewHeadElement.innerHTML = "";
  previewBodyElement.innerHTML = "";

  if (!rows.length || !columns.length) {
    previewBodyElement.innerHTML = `<tr><td colspan="1">No preview available.</td></tr>`;
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
  if (!historyBodyElement) return;
  historyBodyElement.innerHTML = "";

  if (!reports.length) {
    historyBodyElement.innerHTML = `<tr><td colspan="5">No reports generated yet.</td></tr>`;
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
        <button class="actions-btn history-menu-trigger">⋮</button>
        <div class="actions-menu hidden">
          <button class="menu-item open-report-trigger">Open</button>
          <button class="menu-item delete delete-report-trigger">Delete</button>
        </div>
      </td>
    `;

    const toggleBtn = tr.querySelector(".history-menu-trigger");
    const menu = tr.querySelector(".actions-menu");

    toggleBtn.onclick = (e) => {
      e.stopPropagation();
      closeAllMenus(menu);
      if (menu) menu.classList.toggle("hidden");
    };

    tr.querySelector(".open-report-trigger").onclick = () => {
      openReport(report.report_id);
    };

    tr.querySelector(".delete-report-trigger").onclick = () => {
      openModal({
        title: "Delete Analysis Report",
        content: `
          <div class="modal-subtitle">Report ID: ${report.report_id}</div>
          <p>Are you sure you want to delete this report from <strong>${currentFile.filename}</strong>?</p>
        `,
        showConfirm: true,
        confirmText: "Delete Report",
        onConfirm: () => deleteReport(report.report_id),
      });
    };

    historyBodyElement.appendChild(tr);
  });
}

function renderSuggestions(history = []) {
  if (!suggestionsBodyElement) return;
  suggestionsBodyElement.innerHTML = "";

  if (!history.length) {
    suggestionsBodyElement.innerHTML = `<tr><td colspan="4">No suggestion history.</td></tr>`;
    return;
  }

  history.forEach((h) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${h.created_at || "-"}</td>
      <td>${h.count || 0}</td>
      <td>${h.suggestion_id?.slice(0, 12) || "-"}...</td>
      <td class="actions-cell">
        <button class="actions-btn suggestion-menu-trigger">⋮</button>
        <div class="actions-menu hidden">
          <button class="menu-item open-suggestion-trigger">Open</button>
          <button class="menu-item delete delete-suggestion-trigger">Delete</button>
        </div>
      </td>
    `;

    const toggleBtn = tr.querySelector(".suggestion-menu-trigger");
    const menu = tr.querySelector(".actions-menu");

    toggleBtn.onclick = (e) => {
      e.stopPropagation();
      closeAllMenus(menu);
      if (menu) menu.classList.toggle("hidden");
    };

    tr.querySelector(".open-suggestion-trigger").onclick = () => {
      openSuggestion(h.suggestion_id);
    };

    tr.querySelector(".delete-suggestion-trigger").onclick = () => {
      openModal({
        title: "Delete Suggestion",
        content: `
          <div class="modal-subtitle">Suggestion ID: ${h.suggestion_id}</div>
          <p>Are you sure you want to delete this suggestion block for <strong>${currentFile.filename}</strong>?</p>
        `,
        showConfirm: true,
        confirmText: "Delete Suggestion",
        onConfirm: () => deleteSuggestion(h.suggestion_id),
      });
    };

    suggestionsBodyElement.appendChild(tr);
  });
}

function updateSelectedBlock(jsonData) {
  if (!reportElement) return;

  const parentCard = reportElement.closest(".dataset-card");
  if (parentCard) {
    let headerBlock = parentCard.querySelector(".selected-header-tools");
    if (!headerBlock) {
      headerBlock = document.createElement("div");
      headerBlock.className = "selected-header-tools";
      headerBlock.innerHTML = `<button class="copy-json-btn">Copy JSON</button>`;
      parentCard.insertBefore(headerBlock, reportElement);
    }

    headerBlock.querySelector(".copy-json-btn").onclick = () => {
      navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
      const btn = headerBlock.querySelector(".copy-json-btn");
      btn.textContent = "Copied!";
      setTimeout(() => {
        btn.textContent = "Copy JSON";
      }, 2000);
    };
  }

  reportElement.textContent = JSON.stringify(jsonData, null, 2);
  reportElement.scrollIntoView({ behavior: "smooth", block: "center" });
}
async function openSuggestion(suggestionId) {
  try {
    const res = await fetch(`/suggestion/${suggestionId}`);
    const data = await res.json();
    updateSelectedBlock(data);
  } catch (err) {
    console.error(err);
  }
}

async function openReport(reportId) {
  try {
    const res = await fetch(`/report/${reportId}`);
    const data = await res.json();
    updateSelectedBlock(data);
  } catch (err) {
    console.error(err);
    if (reportElement) {
      reportElement.style.display = "block";
      reportElement.textContent = "Failed to load report.";
    }
  }
}

function closeAllMenus(exceptMenu) {
  document.querySelectorAll(".actions-menu").forEach((m) => {
    if (m !== exceptMenu) m.classList.add("hidden");
  });
}

document.addEventListener("click", () => {
  closeAllMenus(null);
});

function deleteReport(reportId) {
  loadDataset();
}

function deleteSuggestion(suggestionId) {
  loadDataset();
}

if (historySearchElement) {
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

  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  };

  const modalWindow = modalOverlay.querySelector(".modal");
  if (modalWindow) {
    modalWindow.onclick = (e) => {
      e.stopPropagation();
    };
  }

  modalCancel.focus();
}

function closeModal() {
  if (modalOverlay) modalOverlay.classList.add("hidden");
}

if (modalClose) modalClose.onclick = closeModal;
if (modalCancel) modalCancel.onclick = closeModal;

loadDataset();
