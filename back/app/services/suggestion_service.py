import pandas as pd


class SuggestionService:

    MAX_SUGGESTIONS = 20

    @staticmethod
    def _is_identifier(series: pd.Series) -> bool:

        non_null = series.dropna()

        if len(non_null) == 0:
            return False

        unique_ratio = (
            non_null.nunique() /
            len(non_null)
        )

        return unique_ratio > 0.95

    @staticmethod
    def generate(df: pd.DataFrame):

        suggestions = []

        numeric = []
        categorical = []

        for column in df.columns:

            series = df[column]

            if SuggestionService._is_identifier(
                series
            ):
                continue

            if pd.api.types.is_numeric_dtype(
                series
            ):
                numeric.append(column)

            else:
                categorical.append(column)

        for i in range(len(numeric)):
            for j in range(i + 1, len(numeric)):

                suggestions.append({
                    "col1": numeric[i],
                    "col2": numeric[j],
                    "type": "correlation",
                    "priority": 3,
                    "reason": (
                        "Both columns are numeric."
                    )
                })

        for cat in categorical:
            for num in numeric:

                cardinality = (
                    df[cat].nunique(
                        dropna=True
                    )
                )

                priority = 2

                if cardinality <= 10:
                    priority = 5

                elif cardinality <= 20:
                    priority = 4

                suggestions.append({
                    "col1": cat,
                    "col2": num,
                    "type": "comparison",
                    "priority": priority,
                    "reason": (
                        f"'{cat}' has "
                        f"{cardinality} categories "
                        f"that can be compared "
                        f"against '{num}'."
                    )
                })

        for i in range(len(categorical)):
            for j in range(i + 1, len(categorical)):

                c1 = categorical[i]
                c2 = categorical[j]

                card1 = (
                    df[c1].nunique(
                        dropna=True
                    )
                )

                card2 = (
                    df[c2].nunique(
                        dropna=True
                    )
                )

                if (
                    card1 <= 20 and
                    card2 <= 20
                ):

                    suggestions.append({
                        "col1": c1,
                        "col2": c2,
                        "type": "association",
                        "priority": 1,
                        "reason": (
                            "Possible categorical "
                            "association analysis."
                        )
                    })

        suggestions.sort(
            key=lambda x: (
                x["priority"],
                x["type"]
            ),
            reverse=True
        )

        return suggestions[
            :SuggestionService.MAX_SUGGESTIONS
        ]