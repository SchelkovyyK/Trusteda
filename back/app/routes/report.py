from fastapi import APIRouter
from app.services.report_service import ReportService

router = APIRouter()


@router.get("/report/{report_id}")
def get_report(report_id: str):
    return ReportService.load_report(report_id)