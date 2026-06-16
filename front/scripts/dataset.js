const params = new URLSearchParams(window.location.search);

const fileId = params.get("file_id");

let allReports = [];

async function loadDataset() {
  try {
    const res = await fetch(`/dataset/${fileId}`);

    const data = await res.json();

    console.log("DATASET RESPONSE:", data);

    if (data.error) {
      alert(data.error);
      return;
    }

    document.getElementById("fileName").innerText = data.file.filename;

    renderDatasetInfo(data.file);

    renderPreview(data.file.preview || [], data.file.columns || []);

    allReports = data.reports || [];

    allReports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    renderHistory(allReports);
  } catch (err) {
    console.error(err);
  }
}

function renderDatasetInfo(file) {
  document.getElementById("datasetInfo").innerHTML = `
    <div>
      <strong>Created:</strong><br>
      ${file.created_at}
    </div>

    <div>
      <strong>Rows:</strong><br>
      ${file.stats?.rows ?? "-"}
    </div>

    <div>
      <strong>Columns:</strong><br>
      ${file.stats?.columns ?? "-"}
    </div>

    <div>
      <strong>Reports:</strong><br>
      ${file.report_ids?.length ?? 0}
    </div>
  `;
}

function renderPreview(rows, columns) {
  const head = document.getElementById("previewHead");

  const body = document.getElementById("previewBody");

  head.innerHTML = "";
  body.innerHTML = "";

  if (!rows.length) {
    body.innerHTML = `
      <tr>
        <td colspan="${columns.length || 1}">
          No preview available.
        </td>
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

  head.appendChild(headerRow);

  rows.forEach((row) => {
    const tr = document.createElement("tr");

    columns.forEach((column) => {
      const td = document.createElement("td");

      td.textContent = row[column] ?? "";

      tr.appendChild(td);
    });

    body.appendChild(tr);
  });
}

function renderHistory(reports) {
  const body = document.getElementById("historyBody");

  body.innerHTML = "";

  if (!reports.length) {
    body.innerHTML = `
      <tr>
        <td colspan="5">
          No reports generated yet.
        </td>
      </tr>
    `;

    return;
  }

  reports.forEach((report) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        ${report.insight || "Analysis"}
      </td>

      <td>
        ${report.analysis_type || "-"}
      </td>

      <td>
        ${
          report.reliability != null
            ? Number(report.reliability).toFixed(2)
            : "-"
        }
      </td>

      <td>
        ${report.created_at || "-"}
      </td>

      <td>
        <button
          class="open-report-btn"
          onclick="openReport('${report.report_id}')"
        >
          Open
        </button>
      </td>
    `;

    body.appendChild(tr);
  });
}

async function openReport(reportId) {
  try {
    const res = await fetch(`/report/${reportId}`);

    const data = await res.json();

    document.getElementById("report").textContent = JSON.stringify(
      data,
      null,
      2
    );
  } catch (err) {
    console.error(err);

    document.getElementById("report").textContent = "Failed to load report.";
  }
}

document.getElementById("historySearch").addEventListener("input", (e) => {
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
