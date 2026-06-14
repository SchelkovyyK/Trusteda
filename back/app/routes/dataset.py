from fastapi import APIRouter
from app.services.file_service import FileService
from app.services.report_service import ReportService

router = APIRouter()


@router.get("/dataset/{file_id}")
def get_dataset(file_id: str):

    file_meta = FileService.get_file_meta(file_id)

    if not file_meta:
        return {"error": "file not found"}

    reports = []

    for report_id in file_meta.get("report_ids", []):
        report = ReportService.load_report(report_id)
        if report:
            reports.append(report)

    return {
        "file": file_meta,
        "reports": reports
    }