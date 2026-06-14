import os
import uuid
import pandas as pd
import json
from datetime import datetime

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

META_PATH = os.path.join(UPLOAD_DIR, "meta.json")


class FileService:

    @staticmethod
    def save_file(upload_file) -> dict:
        file_id = str(uuid.uuid4())

        original_filename = upload_file.filename
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}.csv")

        content = upload_file.file.read()

        with open(file_path, "wb") as f:
            f.write(content)

        df = pd.read_csv(file_path, sep=None, engine="python")

        meta = FileService._load_meta()

        preview_df = df.head(5).fillna("")

        meta.append({
            "file_id": file_id,
            "filename": original_filename,
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),

            "stats": {
                "rows": len(df),
                "columns": len(df.columns)
            },

            "columns": list(df.columns),

            "preview": preview_df.to_dict(orient="records"),

            # NEW
            "report_ids": []
        })

        FileService._save_meta(meta)

        return {
            "file_id": file_id,
            "filename": original_filename,
            "columns": list(df.columns),
            "preview": preview_df.to_dict(orient="records")
        }

    @staticmethod
    def load_df(file_id: str) -> pd.DataFrame:
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}.csv")

        if not os.path.exists(file_path):
            raise FileNotFoundError("File not found")

        return pd.read_csv(file_path, sep=None, engine="python")

    @staticmethod
    def list_files():
        return FileService._load_meta()

    @staticmethod
    def delete_file(file_id: str):

        file_path = os.path.join(UPLOAD_DIR, f"{file_id}.csv")

        if os.path.exists(file_path):
            os.remove(file_path)

        meta = FileService._load_meta()

        meta = [x for x in meta if x["file_id"] != file_id]

        FileService._save_meta(meta)

        return {"success": True}

    @staticmethod
    def add_report_to_file(file_id: str, report_id: int):
        """
        Додає report_id до конкретного датасету.
        """

        meta = FileService._load_meta()

        for file_info in meta:
            if file_info["file_id"] == file_id:

                if "report_ids" not in file_info:
                    file_info["report_ids"] = []

                file_info["report_ids"].append(report_id)

                break

        FileService._save_meta(meta)

    @staticmethod
    def get_file_meta(file_id: str):

        meta = FileService._load_meta()

        for file_info in meta:
            if file_info["file_id"] == file_id:
                return file_info

        return None

    @staticmethod
    def _load_meta():

        if not os.path.exists(META_PATH):
            return []

        try:
            with open(META_PATH, "r", encoding="utf-8") as f:
                return json.load(f)

        except json.JSONDecodeError:
            return []

    @staticmethod
    def _save_meta(meta):

        with open(META_PATH, "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2, ensure_ascii=False)