import pandas as pd


class SuggestionService:

    @staticmethod
    def generate(df: pd.DataFrame):

        suggestions = []

        numeric = list(
            df.select_dtypes(include=["number"]).columns
        )

        categorical = list(
            df.select_dtypes(exclude=["number"]).columns
        )

        for i in range(len(numeric)):
            for j in range(i + 1, len(numeric)):

                suggestions.append({
                    "col1": numeric[i],
                    "col2": numeric[j],
                    "type": "correlation",
                    "reason": "Both columns are numeric."
                })

        for cat in categorical:
            for num in numeric:

                suggestions.append({
                    "col1": cat,
                    "col2": num,
                    "type": "comparison",
                    "reason": "Categorical vs numeric analysis."
                })

        return suggestions[:5]