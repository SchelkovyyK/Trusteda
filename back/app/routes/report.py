from fastapi import APIRouter
from app.services.report_service import ReportService
from app.services.file_service import FileService
from app.utils.serialization import clean_json

router = APIRouter()


@router.get("/report/{report_id}")
def get_report(report_id: str):
    report = ReportService.load_report(report_id)

    if not report:
        return {"error": "report not found"}

    return clean_json(report)


@router.delete("/report/{report_id}")
def delete_report(report_id: str):
    report = ReportService.load_report(report_id)

    if not report:
        return {"error": "report not found"}

    file_id = report.get("file_id")
    ReportService.delete_report(report_id)

    if file_id:
        FileService.remove_report_from_file(file_id, report_id)

    return {"success": True}
