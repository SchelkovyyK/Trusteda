import pandas as pd
import numpy as np

from scipy.stats import (
    pearsonr,
    chi2_contingency,
    ttest_ind,
    f_oneway
)


def analyze_relationship(df: pd.DataFrame, col1: str, col2: str):
    """
    Автоматично визначає тип аналізу:
    - numeric ↔ numeric
    - categorical ↔ categorical
    - categorical ↔ numeric

    Повертає:
    {
        "analysis_type": "...",
        "primary_metric": ...,
        "p_value": ...,
        ...
    }
    """

    try:
        data = df[[col1, col2]].copy()

        is_num1 = pd.api.types.is_numeric_dtype(data[col1])
        is_num2 = pd.api.types.is_numeric_dtype(data[col2])

        if is_num1 and is_num2:

            data = data.dropna()

            if len(data) < 2:
                return {
                    "error": "Not enough numeric data"
                }

            corr, p_value = pearsonr(
                data[col1],
                data[col2]
            )

            return {
                "analysis_type": "pearson",
                "primary_metric": float(corr),
                "correlation": float(corr),
                "p_value": float(p_value)
            }

        if (not is_num1) and (not is_num2):

            data = data.dropna()

            contingency = pd.crosstab(
                data[col1],
                data[col2]
            )

            if contingency.empty:
                return {
                    "error": "Not enough categorical data"
                }

            chi2, p_value, _, _ = chi2_contingency(
                contingency
            )

            n = contingency.values.sum()

            r, k = contingency.shape

            cramers_v = np.sqrt(
                chi2 / (
                    n * max(
                        min(r - 1, k - 1),
                        1
                    )
                )
            )

            return {
                "analysis_type": "chi_square",
                "primary_metric": float(cramers_v),
                "chi2": float(chi2),
                "cramers_v": float(cramers_v),
                "p_value": float(p_value)
            }

        if is_num1:
            numeric_col = col1
            categorical_col = col2
        else:
            numeric_col = col2
            categorical_col = col1

        data = data[[categorical_col, numeric_col]].dropna()

        groups = []

        for category in data[categorical_col].unique():

            values = data[
                data[categorical_col] == category
            ][numeric_col]

            if len(values) > 1:
                groups.append(values)

        if len(groups) < 2:
            return {
                "error": "Not enough groups"
            }

        if len(groups) == 2:

            stat, p_value = ttest_ind(
                groups[0],
                groups[1],
                equal_var=False
            )

            pooled_std = np.sqrt(
                (
                    groups[0].std() ** 2 +
                    groups[1].std() ** 2
                ) / 2
            )

            effect_size = (
                abs(
                    groups[0].mean() -
                    groups[1].mean()
                ) / pooled_std
            )

            return {
                "analysis_type": "t_test",
                "primary_metric": float(effect_size),
                "t_statistic": float(stat),
                "effect_size": float(effect_size),
                "p_value": float(p_value)
            }

        stat, p_value = f_oneway(*groups)

        return {
            "analysis_type": "anova",
            "primary_metric": float(stat),
            "f_statistic": float(stat),
            "p_value": float(p_value)
        }

    except Exception as e:

        return {
            "error": str(e)
        }