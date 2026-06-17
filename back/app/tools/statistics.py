import pandas as pd
import numpy as np

from scipy.stats import (
    pearsonr,
    chi2_contingency,
    ttest_ind,
    f_oneway
)


def _is_date(series: pd.Series) -> bool:
    """
    Try detect datetime-like columns
    """
    try:
        parsed = pd.to_datetime(series, errors="coerce")
        return parsed.notna().mean() > 0.8
    except Exception:
        return False


def _is_numeric_but_id(series: pd.Series) -> bool:
    """
    numeric columns that are actually IDs
    """
    if not pd.api.types.is_numeric_dtype(series):
        return False

    non_null = series.dropna()
    if len(non_null) == 0:
        return True

    unique_ratio = non_null.nunique() / len(non_null)

    return unique_ratio > 0.95


def analyze_relationship(df: pd.DataFrame, col1: str, col2: str):

    try:
        data = df[[col1, col2]].copy()

        s1 = data[col1]
        s2 = data[col2]

        is_num1 = pd.api.types.is_numeric_dtype(s1) and not _is_numeric_but_id(s1)
        is_num2 = pd.api.types.is_numeric_dtype(s2) and not _is_numeric_but_id(s2)

        is_date1 = _is_date(s1)
        is_date2 = _is_date(s2)

        if (is_date1 and is_num2) or (is_date2 and is_num1):

            date_col = col1 if is_date1 else col2
            num_col = col2 if is_date1 else col1

            tmp = data[[date_col, num_col]].dropna()

            tmp[date_col] = pd.to_datetime(tmp[date_col], errors="coerce")
            tmp = tmp.dropna()

            if len(tmp) < 2:
                return {"error": "Not enough date data"}

            x = tmp[date_col].astype(np.int64) // 10**9
            y = tmp[num_col]

            corr, p_value = pearsonr(x, y)

            return {
                "analysis_type": "time_trend",
                "primary_metric": float(corr),
                "correlation": float(corr),
                "p_value": float(p_value)
            }

        if is_num1 and is_num2:

            tmp = data.dropna()

            if len(tmp) < 2:
                return {"error": "Not enough numeric data"}

            corr, p_value = pearsonr(tmp[col1], tmp[col2])

            return {
                "analysis_type": "pearson",
                "primary_metric": float(corr),
                "correlation": float(corr),
                "p_value": float(p_value)
            }

        if (not is_num1 and not is_num2):

            tmp = data.dropna()

            contingency = pd.crosstab(tmp[col1], tmp[col2])

            if contingency.empty:
                return {"error": "Not enough categorical data"}

            chi2, p_value, _, _ = chi2_contingency(contingency)

            n = contingency.values.sum()
            r, k = contingency.shape

            cramers_v = np.sqrt(
                chi2 / (n * max(min(r - 1, k - 1), 1))
            )

            return {
                "analysis_type": "chi_square",
                "primary_metric": float(cramers_v),
                "chi2": float(chi2),
                "cramers_v": float(cramers_v),
                "p_value": float(p_value)
            }

        numeric_col = col1 if is_num1 else col2
        categorical_col = col2 if is_num1 else col1

        tmp = data[[categorical_col, numeric_col]].dropna()

        groups = [
            tmp[tmp[categorical_col] == cat][numeric_col]
            for cat in tmp[categorical_col].unique()
            if len(tmp[tmp[categorical_col] == cat]) > 1
        ]

        if len(groups) < 2:
            return {"error": "Not enough groups"}

        if len(groups) == 2:

            stat, p_value = ttest_ind(
                groups[0],
                groups[1],
                equal_var=False
            )

            pooled_std = np.sqrt(
                (groups[0].std() ** 2 + groups[1].std() ** 2) / 2
            )

            effect_size = abs(
                groups[0].mean() - groups[1].mean()
            ) / (pooled_std if pooled_std != 0 else 1)

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
        return {"error": str(e)}