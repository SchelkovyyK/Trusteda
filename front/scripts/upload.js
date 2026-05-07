console.log("upload.js loaded");
let currentFileId = null;
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("file-name");
const analyzeBtn = document.getElementById("analyzeBtn");

uploadBtn.addEventListener("click", uploadFile);
analyzeBtn.addEventListener("click", runAnalysis);


fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) {
    fileName.textContent = fileInput.files[0].name;
  } else {
    fileName.textContent = "Файл не вибрано";
  }
});

async function uploadFile(e) {
  e.preventDefault();

  const file = fileInput.files[0];

  if (!file) {
    alert("Оберіть файл");
    return;
  }

  const btn = uploadBtn;
  btn.textContent = "Uploading...";
  btn.disabled = true;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    currentFileId = data.file_id;
    fillColumns(data.columns);

    analyzeBtn.disabled = false;

    btn.textContent = "Uploaded ✓";
  } catch (e) {
    btn.textContent = "Error";
  } finally {
    setTimeout(() => {
      btn.textContent = "Upload";
      btn.disabled = false;
    }, 1500);
  }
}

function fillColumns(columns) {
  const col1 = document.getElementById("col1");
  const col2 = document.getElementById("col2");

  col1.innerHTML = "";
  col2.innerHTML = "";

  columns.forEach((col) => {
    col1.add(new Option(col, col));
    col2.add(new Option(col, col));
  });
}

async function runAnalysis() {
  const col1 = document.getElementById("col1").value;
  const col2 = document.getElementById("col2").value;

  const res = await fetch(
    `/analyze?file_id=${currentFileId}&col1=${col1}&col2=${col2}`,
    {
      method: "POST",
    }
  );

  const data = await res.json();

  document.getElementById("result").textContent = JSON.stringify(data, null, 2);
}

const dropZone = document.getElementById("dropZone");

dropZone.addEventListener("click", () => {
  fileInput.click();
});

function updateFileName(file) {
  fileName.textContent = file ? file.name : "Файл не вибрано";
}

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("active");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("active");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("active");

  const file = e.dataTransfer.files[0];
  fileInput.files = e.dataTransfer.files;

  updateFileName(file);
});

async function loadFiles() {
  try {
    const res = await fetch("/files");

    if (!res.ok) {
      console.error("Failed to load files:", res.status);
      return;
    }

    const files = await res.json();
    console.log("FILES FROM BACKEND:", files);

    const container = document.getElementById("fileList");
    container.innerHTML = "";

    files.forEach((file) => {
      const div = document.createElement("div");
      div.classList.add("file-item");

      div.innerHTML = `
        <div class="file-top">
          <span>${file.filename}</span>
          <span>${file.created_at}</span>
        </div>
        <div class="file-id">ID: ${file.file_id}</div>
      `;

      div.addEventListener("click", async () => {
        currentFileId = file.file_id;

        document
          .querySelectorAll(".file-item")
          .forEach((el) => el.classList.remove("active"));

        div.classList.add("active");

        const res = await fetch(`/file-info?file_id=${file.file_id}`);
        const data = await res.json();

        fillColumns(data.columns);
        analyzeBtn.disabled = false;
      });

      container.appendChild(div);
    });

  } catch (err) {
    console.error("loadFiles error:", err);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  loadFiles();
});