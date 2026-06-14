from fastapi import APIRouter
from app.services.file_service import FileService
from app.services.analysis_service import analyze
from app.services.suggestion_service import SuggestionService

router = APIRouter()


@router.post("/analyze")
def run_analysis(file_id: str, col1: str, col2: str):

    df = FileService.load_df(file_id)

    return analyze(
        file_id,
        df,
        col1,
        col2
    )

@router.post("/suggest-analysis")
def suggest_analysis(file_id: str):

    df = FileService.load_df(file_id)

    suggestions = SuggestionService.generate(df)

    return {
        "suggestions": suggestions
    }