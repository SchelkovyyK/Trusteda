from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.routes import upload, analyze, files
from fastapi.middleware.cors import CORSMiddleware


BASE_DIR = Path(__file__).resolve().parent.parent.parent

app = FastAPI(title="TrustEDA API")

# API
app.include_router(upload.router)
app.include_router(analyze.router)
app.include_router(files.router)


app.mount("/static", StaticFiles(directory=BASE_DIR / "front"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return FileResponse(BASE_DIR / "front" / "index.html")