from scipy.stats import pearsonr
import pandas as pd
import numpy as np


def compute_correlation(df: pd.DataFrame, col1: str, col2: str):
    try:
        data = df[[col1, col2]].copy()

        data[col1] = pd.to_numeric(data[col1], errors="coerce")
        data[col2] = pd.to_numeric(data[col2], errors="coerce")

        data = data.dropna()

        if len(data) < 2:
            return {
                "error": "Not enough valid numeric data"
            }

        corr, p_value = pearsonr(data[col1], data[col2])

        if np.isnan(corr) or np.isnan(p_value):
            return {
                "error": "Correlation returned NaN"
            }

        return {
            "correlation": float(corr),
            "p_value": float(p_value)
        }

    except Exception as e:
        return {
            "error": str(e)
        }