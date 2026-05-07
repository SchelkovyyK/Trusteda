import os
import uuid
import pandas as pd
import json
from datetime import datetime

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class FileService:

    @staticmethod
    def save_file(upload_file) -> dict:
        file_id = str(uuid.uuid4())

        original_filename = upload_file.filename
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}.csv")

        content = upload_file.file.read()

        with open(file_path, "wb") as f:
            f.write(content)

        # store metadata file (optional but recommended)
        meta_path = os.path.join(UPLOAD_DIR, "meta.json")

        meta = []
        if os.path.exists(meta_path):
            try:
                with open(meta_path, "r") as f:
                    meta = json.load(f) 
            except json.JSONDecodeError:
                meta = []
        meta.append({
            "file_id": file_id,
            "filename": original_filename,
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M")
        })

        with open(meta_path, "w") as f:
            json.dump(meta, f, indent=2)

        return {
            "file_id": file_id,
            "filename": original_filename,
            "path": file_path
        }
    @staticmethod
    def load_df(file_id: str) -> pd.DataFrame:
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}.csv")

        if not os.path.exists(file_path):
            raise FileNotFoundError("File not found")

        return pd.read_csv(file_path, sep=None, engine="python")
    
    @staticmethod
    def list_files():
        meta_path = os.path.join(UPLOAD_DIR, "meta.json")

        if not os.path.exists(meta_path):
            return []

        with open(meta_path, "r") as f:
            return json.load(f)
            files = []

            for filename in os.listdir(UPLOAD_DIR):
                if filename.endswith(".csv"):
                    file_path = os.path.join(UPLOAD_DIR, filename)
                    file_id = filename.replace(".csv", "")

                    created_at = datetime.fromtimestamp(
                        os.path.getctime(file_path)
                    ).strftime("%Y-%m-%d %H:%M")

                    files.append({
                        "file_id": file_id,
                        "filename": filename,   # currently UUID.csv
                        "created_at": created_at
                    })

            return files