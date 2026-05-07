import numpy as np
from app.tools.statistics import compute_correlation



def bootstrap_stability(df, col1, col2, n=50):
    values = []

    for _ in range(n):
        sample = df.sample(frac=1, replace=True)
        res = compute_correlation(sample, col1, col2)

        if "correlation" in res:
            values.append(res["correlation"])

    if not values:
        return 0.0

    return float(1 - np.std(values))



def compute_reliability(corr, p_value, stability):
    S = 1 - p_value
    V = 1 if abs(corr) > 0.5 else 0.5
    B = stability

    return float(0.4 * S + 0.3 * V + 0.3 * B)

def analyze(df, col1, col2):
    result = compute_correlation(df, col1, col2)

    if "error" in result:
        return result

    corr = result["correlation"]
    p_value = result["p_value"]

    stability = bootstrap_stability(df, col1, col2)
    reliability = compute_reliability(corr, p_value, stability)

    return {
        "insight": f"{col1} correlates with {col2}",
        "correlation": corr,
        "p_value": p_value,
        "stability": stability,
        "reliability": reliability
    }