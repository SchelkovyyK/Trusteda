# 📊 Data Analysis Platform

A full-stack web application for uploading CSV datasets, generating statistical analysis, and exploring AI-driven column relationship suggestions.

---

## 🚀 Features

- Upload CSV datasets
- Automatic dataset preview
- Smart column-pair suggestion engine
- Statistical analysis (t-test, correlation, comparisons)
- Suggestion history per dataset
- Interactive frontend for exploring insights
- FastAPI backend with pandas + SciPy
- Optional LLM-powered reporting via GROQ API

---

## 🏗️ Tech Stack

### Backend
- FastAPI
- Python 3.10+
- pandas
- NumPy
- SciPy

### Frontend
- Vanilla JavaScript
- HTML / CSS
- Fetch API

### Storage
- Local filesystem (CSV + JSON metadata)

---

## ⚙️ Setup Instructions

### 1. Clone repository
```bash
git clone <your-repo-url>
cd trusteda
```

### 2. Backend setup
```bash
cd back
```

### 3. Create virtual environment
```bash
python -m venv venv
```

**Activate environment:**
- **Windows:**
  ```cmd
  venv\Scripts\activate
  ```
- **Mac/Linux:**
  ```bash
  source venv/bin/activate
  ```

### 4. Install dependencies
```bash
pip install -r requirements.txt
```

### 5. Environment variables
Create a `.env` file in the `back/` directory:
```bash
cp .env.example .env
```
Configure your credentials inside `back/.env`:
```env
GROQ_KEY=gsk_xxxxxxxxxxxxxxxxx
```

### 6. Run backend
```bash
uvicorn app.main:app --reload
```
The server will be available at: `http://127.0.0.1:8000`

---

## 📂 Project Structure

```text
trusteda/
│
├── back/
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/
│   │   ├── services/
│   │   ├── tools/
│   │   └── ...
│   │
│   ├── uploads/
│   │   ├── *.csv
│   │   ├── meta.json
│   │   └── suggestions/
│   │       └── *.json
│   │
│   ├── .env.example
│   └── requirements.txt
│
├── frontend/
│   ├── index.html
│   ├── upload.js
│   ├── index.js
│   └── styles.css
│
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/upload` | Upload a new CSV dataset |
| **GET** | `/files` | List all available datasets |
| **GET** | `/file-info?file_id=` | Get metadata and preview for a specific file |
| **POST** | `/analyze?file_id=&col1=&col2=` | Run statistical analysis on two columns |
| **POST** | `/suggest-analysis?file_id=` | Trigger AI engine to suggest interesting column pairs |
| **GET** | `/suggestions/{file_id}` | Retrieve historical suggestions for a dataset |

---

## ⚠️ Known Issues

- **Correlation Errors:** Calculations can fail on constant arrays (triggers Pearson warning).
- **Data Serialization:** NaN values must be cleaned or handled before JSON serialization.
- **Data Flattening:** Suggestions are stored in batches and must be flattened on the frontend after a page reload.

---

## 🧠 Architecture Notes

- Each dataset is assigned a unique `file_id`.
- Suggestions are stored per-file in JSON batch files.
- The frontend flattens suggestion batches into a single list for rendering.
- Analysis endpoints remain completely stateless.
- File metadata is tracked centrally in `meta.json`.
