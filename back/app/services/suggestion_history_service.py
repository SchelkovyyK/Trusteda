import os
import json
import uuid

from datetime import datetime

SUGGESTIONS_DIR = "uploads/suggestions"

os.makedirs(
    SUGGESTIONS_DIR,
    exist_ok=True
)


class SuggestionHistoryService:

    @staticmethod
    def save_suggestions(
        file_id: str,
        suggestions: list
    ):

        suggestion_id = str(uuid.uuid4())

        payload = {
            "suggestion_id": suggestion_id,
            "file_id": file_id,
            "created_at": datetime.now().strftime(
                "%Y-%m-%d %H:%M"
            ),
            "count": len(suggestions),
            "suggestions": suggestions
        }

        path = os.path.join(
            SUGGESTIONS_DIR,
            f"{suggestion_id}.json"
        )

        with open(
            path,
            "w",
            encoding="utf-8"
        ) as f:
            json.dump(
                payload,
                f,
                indent=2,
                ensure_ascii=False
            )

        return suggestion_id

    @staticmethod
    def load_suggestion(
        suggestion_id: str
    ):

        path = os.path.join(
            SUGGESTIONS_DIR,
            f"{suggestion_id}.json"
        )

        if not os.path.exists(path):
            return None

        with open(
            path,
            "r",
            encoding="utf-8"
        ) as f:

            return json.load(f)

    @staticmethod
    def list_by_file(
        file_id: str
    ):

        history = []

        for filename in os.listdir(
            SUGGESTIONS_DIR
        ):

            path = os.path.join(
                SUGGESTIONS_DIR,
                filename
            )

            with open(
                path,
                "r",
                encoding="utf-8"
            ) as f:

                data = json.load(f)

            if data["file_id"] == file_id:
                history.append(data)

        history.sort(
            key=lambda x: x["created_at"],
            reverse=True
        )

        return history