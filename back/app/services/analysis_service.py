import numpy as np

from app.tools.statistics import compute_correlation
from app.services.llm_service import generate_llm_report
from app.services.report_service import ReportService
from app.services.file_service import FileService
from app.services.suggestion_service import SuggestionService

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


def analyze(file_id, df, col1, col2):

    result = compute_correlation(df, col1, col2)

    if "error" in result:
        return result

    corr = result["correlation"]
    p_value = result["p_value"]

    stability = bootstrap_stability(df, col1, col2)
    reliability = compute_reliability(corr, p_value, stability)

    analysis_result = {
        "columns": [col1, col2],
        "sample_size": len(df),
        "metrics": {
            "correlation": corr,
            "p_value": p_value,
            "stability": stability,
            "reliability": reliability
        }
    }

    llm_report = generate_llm_report(analysis_result)

    report_data = {
        "insight": f"{col1} correlates with {col2}",
        "correlation": corr,
        "p_value": p_value,
        "stability": stability,
        "reliability": reliability,
        "llm_report": llm_report
    }

    report_id = ReportService.save_report(file_id, report_data)

    FileService.add_report_to_file(file_id, report_id)

    return {
        "report_id": report_id,
        **report_data
    }
