from fastapi import APIRouter
from app.services.file_service import FileService
from app.services.analysis_service import analyze

router = APIRouter()


@router.post("/analyze")
def run_analysis(file_id: str, col1: str, col2: str):

    df = FileService.load_df(file_id)

    return analyze(df, col1, col2)