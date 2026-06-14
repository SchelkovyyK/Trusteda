const params = new URLSearchParams(window.location.search);

const fileId = params.get("file_id");

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

    renderHistory(data.reports || []);
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
                <td>No preview available.</td>
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
  const container = document.getElementById("history");

  container.innerHTML = "";

  if (!reports.length) {
    container.innerHTML = "<p>No reports generated yet.</p>";

    return;
  }

  reports.forEach((report) => {
    const div = document.createElement("div");

    div.className = "report-card";

    div.innerHTML = `
            <div class="report-title">
                ${report.insight || "Analysis"}
            </div>

            <div class="report-meta">
                ${report.created_at}
            </div>

            <div class="report-actions">
                <button
                    onclick="openReport('${report.report_id}')"
                >
                    Open Report
                </button>
            </div>
        `;

    container.appendChild(div);
  });
}

async function openReport(reportId) {
  const res = await fetch(`/report/${reportId}`);

  const data = await res.json();

  document.getElementById("report").textContent = JSON.stringify(data, null, 2);
}

loadDataset();
