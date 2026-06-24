from fastapi import APIRouter
from app.services.suggestion_history_service import (
    SuggestionHistoryService
)
from app.utils.serialization import clean_json

router = APIRouter()


@router.get("/suggestions/{file_id}")
def get_suggestions(file_id: str):
    return clean_json(SuggestionHistoryService.list_by_file(
        file_id
    ))


@router.get("/suggestion/{suggestion_id}")
def get_suggestion(suggestion_id: str):
    data = SuggestionHistoryService.load_suggestion(suggestion_id)

    if not data:
        return {"error": "suggestion not found"}

    return clean_json(data)


@router.delete("/suggestion/{suggestion_id}")
def delete_suggestion(suggestion_id: str):
    if not SuggestionHistoryService.delete_suggestion(suggestion_id):
        return {"error": "suggestion not found"}

    return {"success": True}
