import os
import json
import uuid
from datetime import datetime

REPORTS_DIR = "uploads/reports"
os.makedirs(REPORTS_DIR, exist_ok=True)


class ReportService:

    @staticmethod
    def save_report(file_id: str, report_data: dict):
        report_id = str(uuid.uuid4())

        report = {
            "report_id": report_id,
            "file_id": file_id,
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
            **report_data
        }

        with open(
            os.path.join(REPORTS_DIR, f"{report_id}.json"),
            "w",
            encoding="utf-8"
        ) as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        return report_id

    @staticmethod
    def load_report(report_id: str):
        path = os.path.join(REPORTS_DIR, f"{report_id}.json")

        if not os.path.exists(path):
            return None

        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)