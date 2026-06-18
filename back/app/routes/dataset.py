from fastapi import APIRouter
from app.services.file_service import FileService
from app.services.report_service import ReportService
import math

router = APIRouter()


def clean(obj):
    """
    Recursively convert NaN / Inf → None
    so JSON serialization never crashes
    """

    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj

    if isinstance(obj, dict):
        return {k: clean(v) for k, v in obj.items()}

    if isinstance(obj, list):
        return [clean(v) for v in obj]

    return obj


@router.get("/dataset/{file_id}")
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
                reports.append(clean(report))

        suggestion_history = FileService.get_suggestion_history(file_id)

        return {
            "file": clean(file_meta),
            "reports": clean(reports),
            "suggestion_history": clean(suggestion_history)
        }

    except Exception as e:
        return {"error": str(e)}
