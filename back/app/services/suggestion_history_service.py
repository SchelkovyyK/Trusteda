import os
import json
import uuid
from datetime import datetime

SUGGESTIONS_DIR = "uploads/suggestions"

os.makedirs(SUGGESTIONS_DIR, exist_ok=True)


class SuggestionHistoryService:

    @staticmethod
    def save_suggestions(file_id: str, suggestions: list):

        suggestion_id = str(uuid.uuid4())

        payload = {
            "suggestion_id": suggestion_id,
            "file_id": file_id,
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "count": len(suggestions),
            "suggestions": suggestions
        }

        path = os.path.join(SUGGESTIONS_DIR, f"{suggestion_id}.json")

        with open(path, "w", encoding="utf-8") as f:
            json.dump(
                payload,
                f,
                indent=2,
                ensure_ascii=False
            )

        return suggestion_id

    @staticmethod
    def load_suggestion(suggestion_id: str):

        path = os.path.join(SUGGESTIONS_DIR, f"{suggestion_id}.json")

        if not os.path.exists(path):
            return None

        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except json.JSONDecodeError:
            return None

    @staticmethod
    def list_by_file(file_id: str):

        history = []

        if not os.path.exists(SUGGESTIONS_DIR):
            return []

        for filename in os.listdir(SUGGESTIONS_DIR):

            path = os.path.join(SUGGESTIONS_DIR, filename)

            if not filename.endswith(".json"):
                continue

            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except (json.JSONDecodeError, OSError):
                continue

            if data.get("file_id") == file_id:
                history.append(data)

        def parse_created_at(item):
            try:
                return datetime.strptime(item["created_at"], "%Y-%m-%d %H:%M")
            except:
                return datetime.min  

        history.sort(
            key=parse_created_at,
            reverse=True
        )

        return history

    @staticmethod
    def delete_suggestion(suggestion_id: str) -> bool:
        path = os.path.join(SUGGESTIONS_DIR, f"{suggestion_id}.json")

        if not os.path.exists(path):
            return False

        os.remove(path)
        return True

    @staticmethod
    def delete_by_file(file_id: str):

        if not os.path.exists(SUGGESTIONS_DIR):
            return 0

        deleted = 0

        for filename in os.listdir(SUGGESTIONS_DIR):

            path = os.path.join(SUGGESTIONS_DIR, filename)

            if not filename.endswith(".json"):
                continue

            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except:
                continue

            if data.get("file_id") == file_id:
                try:
                    os.remove(path)
                    deleted += 1
                except:
                    pass

        return deleted