import numpy as np

from app.tools.statistics import analyze_relationship
from app.services.llm_service import generate_llm_report
from app.services.report_service import ReportService
from app.services.file_service import FileService
from app.utils.serialization import clean_json


def bootstrap_stability(df, col1, col2, n=30):

    values = []

    for _ in range(n):

        sample = df.sample(frac=0.8, replace=True).reset_index(drop=True)

        result = analyze_relationship(sample, col1, col2)

        if "primary_metric" in result:
            metric = result["primary_metric"]
            if metric is not None and np.isfinite(metric):
                values.append(metric)

    if len(values) < 2:
        return 0.0

    std = np.std(values)

    stability = 1 - std

    return float(max(0.0, min(1.0, stability)))


def compute_reliability(metric, p_value, stability):

    metric = 0.0 if metric is None else metric
    p_value = 1.0 if p_value is None else p_value

    significance_score = max(0.0, min(1.0, 1 - p_value))

    effect_score = min(1.0, abs(metric))

    reliability = (
        0.4 * significance_score +
        0.3 * effect_score +
        0.3 * stability
    )

    return float(max(0.0, min(1.0, reliability)))


def analyze(file_id, df, col1, col2):

    result = analyze_relationship(df, col1, col2)

    if "error" in result:
        return result

    metric = result.get("primary_metric") or 0.0
    p_value = result.get("p_value")
    if p_value is None:
        p_value = 1.0

    stability = bootstrap_stability(df, col1, col2)
    reliability = compute_reliability(metric, p_value, stability)

    metrics = {
        **result,
        "stability": stability,
        "reliability": reliability
    }

    analysis_result = {
        "columns": [col1, col2],
        "sample_size": len(df),
        "analysis_type": result["analysis_type"],
        "metrics": metrics
    }

    try:
        llm_report = generate_llm_report(analysis_result)
    except Exception:
        llm_report = "LLM report unavailable."

    report_data = {
        "insight": f"{col1} analyzed with {col2}",
        "analysis_type": result["analysis_type"],
        "metrics": metrics,
        "stability": stability,
        "reliability": reliability,
        "llm_report": llm_report
    }

    report_id = ReportService.save_report(file_id, report_data)

    FileService.add_report_to_file(file_id, report_id)

    return clean_json({
        "report_id": report_id,
        **report_data
    })