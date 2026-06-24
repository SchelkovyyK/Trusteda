from fastapi import APIRouter
from app.services.file_service import FileService
from app.services.report_service import ReportService
from app.services.suggestion_history_service import SuggestionHistoryService
from app.utils.serialization import clean_json

router = APIRouter()


@router.get("/dataset/{file_id}")
def get_dataset(file_id: str):
    try:
        file_meta = FileService.get_file_meta(file_id)

        if not file_meta:
            return {"error": "file not found"}

        reports = []
        for report_id in file_meta.get("report_ids", []):
            report = ReportService.load_report(report_id)
            if report:
                reports.append(report)

        suggestion_history = SuggestionHistoryService.list_by_file(file_id)

        return clean_json({
            "file": file_meta,
            "reports": reports,
            "suggestion_history": suggestion_history
        })

    except Exception as e:
        return {"error": str(e)}
