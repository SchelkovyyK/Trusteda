from fastapi import APIRouter
from app.services.suggestion_history_service import (
    SuggestionHistoryService
)

router = APIRouter()


@router.get("/suggestions/{file_id}")
def get_suggestions(file_id: str):
    return SuggestionHistoryService.list_by_file(
        file_id
    )