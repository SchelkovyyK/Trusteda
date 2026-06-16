from fastapi import APIRouter

from app.services.file_service import FileService
from app.services.analysis_service import analyze
from app.services.suggestion_service import SuggestionService
from app.services.suggestion_history_service import (
    SuggestionHistoryService
)

router = APIRouter()


@router.post("/analyze")
def run_analysis(
    file_id: str,
    col1: str,
    col2: str
):

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

    suggestion_id = (
        SuggestionHistoryService.save_suggestions(
            file_id,
            suggestions
        )
    )

    return {
        "suggestion_id": suggestion_id,
        "count": len(suggestions),
        "suggestions": suggestions
    }