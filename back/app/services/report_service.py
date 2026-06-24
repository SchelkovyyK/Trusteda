import os
import json
import uuid
from datetime import datetime

from app.utils.serialization import clean_json

REPORTS_DIR = "uploads/reports"
os.makedirs(REPORTS_DIR, exist_ok=True)


class ReportService:

    @staticmethod
    def save_report(file_id: str, report_data: dict):
        report_id = str(uuid.uuid4())

        report = clean_json({
            "report_id": report_id,
            "file_id": file_id,
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
            **report_data
        })

        with open(
            os.path.join(REPORTS_DIR, f"{report_id}.json"),
            "w",
            encoding="utf-8"
        ) as f:
            json.dump(report, f, indent=2, ensure_ascii=False, allow_nan=False)

        return report_id

    @staticmethod
    def load_report(report_id: str):
        path = os.path.join(REPORTS_DIR, f"{report_id}.json")

        if not os.path.exists(path):
            return None

        with open(path, "r", encoding="utf-8") as f:
            return clean_json(json.load(f))

    @staticmethod
    def delete_report(report_id: str) -> bool:
        path = os.path.join(REPORTS_DIR, f"{report_id}.json")

        if not os.path.exists(path):
            return False

        os.remove(path)
        return True

    @staticmethod
    def delete_by_file(file_id: str) -> int:
        if not os.path.exists(REPORTS_DIR):
            return 0

        deleted = 0

        for filename in os.listdir(REPORTS_DIR):
            if not filename.endswith(".json"):
                continue

            path = os.path.join(REPORTS_DIR, filename)

            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except (json.JSONDecodeError, OSError):
                continue

            if data.get("file_id") == file_id:
                try:
                    os.remove(path)
                    deleted += 1
                except OSError:
                    pass

        return deleted