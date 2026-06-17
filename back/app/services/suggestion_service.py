import pandas as pd
import numpy as np


class SuggestionService:

    MAX_SUGGESTIONS = 50

    @staticmethod
    def _is_identifier(series: pd.Series) -> bool:

        non_null = series.dropna()

        if len(non_null) == 0:
            return True

        unique_ratio = non_null.nunique() / len(non_null)
        name = str(series.name).lower()

        obvious_ids = [
            "id",
            "email",
            "phone",
            "website",
            "url",
            "uuid",
        ]

        if any(x in name for x in obvious_ids):
            return True

        if unique_ratio > 0.995:
            return True

        return False

    @staticmethod
    def _is_high_cardinality_text(series: pd.Series) -> bool:

        non_null = series.dropna()

        if len(non_null) == 0:
            return False

        unique_ratio = non_null.nunique() / len(non_null)

        return unique_ratio > 0.90

    @staticmethod
    def generate(df: pd.DataFrame):

        suggestions = []

        numeric = []
        categorical = []

        print("\n==============================")
        print(f"[SUGGEST] SHAPE: {df.shape}")
        print("==============================\n")

        for column in df.columns:

            series = df[column]

            if SuggestionService._is_identifier(series):
                continue

            if pd.api.types.is_numeric_dtype(series):
                numeric.append(column)
                continue

            categorical.append(column)

        print(f"[NUMERIC] {numeric}")
        print(f"[CATEGORICAL] {categorical}")

        for i in range(len(numeric)):
            for j in range(i + 1, len(numeric)):

                suggestions.append({
                    "col1": numeric[i],
                    "col2": numeric[j],
                    "type": "correlation",
                    "priority": 4,
                    "reason": "Numeric correlation"
                })

        for cat in categorical:
            for num in numeric:

                card = df[cat].nunique(dropna=True)

                if card <= 10:
                    priority = 5
                elif card <= 20:
                    priority = 4
                elif card <= 40:
                    priority = 3
                else:
                    priority = 2

                suggestions.append({
                    "col1": cat,
                    "col2": num,
                    "type": "comparison",
                    "priority": priority,
                    "reason": f"{cat} vs {num}"
                })

        for i in range(len(categorical)):
            for j in range(i + 1, len(categorical)):

                c1 = categorical[i]
                c2 = categorical[j]

                card1 = df[c1].nunique(dropna=True)
                card2 = df[c2].nunique(dropna=True)

                if card1 > 50 or card2 > 50:
                    continue

                max_card = max(card1, card2)

                if max_card <= 10:
                    priority = 5
                elif max_card <= 20:
                    priority = 4
                else:
                    priority = 3

                suggestions.append({
                    "col1": c1,
                    "col2": c2,
                    "type": "association",
                    "priority": priority,
                    "reason": "Categorical relationship"
                })

        suggestions.sort(
            key=lambda x: (x["priority"], x["type"]),
            reverse=True
        )

        return suggestions[:SuggestionService.MAX_SUGGESTIONS]