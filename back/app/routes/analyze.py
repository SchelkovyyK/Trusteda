from fastapi import APIRouter, HTTPException
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
    try:
        df = FileService.load_df(file_id)

        result = analyze(
            file_id,
            df,
            col1,
            col2
        )

        if result.get("error"):
            raise HTTPException(status_code=400, detail=result["error"])

        return result
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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