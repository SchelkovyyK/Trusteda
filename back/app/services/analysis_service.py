import numpy as np

from app.tools.statistics import analyze_relationship
from app.services.llm_service import generate_llm_report
from app.services.report_service import ReportService
from app.services.file_service import FileService


def bootstrap_stability(df, col1, col2, n=50):

    values = []

    for _ in range(n):

        sample = df.sample(
            frac=1,
            replace=True
        )

        result = analyze_relationship(
            sample,
            col1,
            col2
        )

        if "primary_metric" in result:
            values.append(
                result["primary_metric"]
            )

    if not values:
        return 0.0

    stability = 1 - np.std(values)

    return float(
        max(
            0.0,
            min(1.0, stability)
        )
    )


def compute_reliability(
    metric,
    p_value,
    stability
):

    significance_score = max(
        0.0,
        min(1.0, 1 - p_value)
    )

    effect_score = (
        1.0
        if abs(metric) >= 0.5
        else 0.5
    )

    reliability = (
        0.4 * significance_score +
        0.3 * effect_score +
        0.3 * stability
    )

    return float(
        max(
            0.0,
            min(1.0, reliability)
        )
    )


def analyze(
    file_id,
    df,
    col1,
    col2
):

    result = analyze_relationship(
        df,
        col1,
        col2
    )

    if "error" in result:
        return result

    metric = result["primary_metric"]

    p_value = result["p_value"]

    stability = bootstrap_stability(
        df,
        col1,
        col2
    )

    reliability = compute_reliability(
        metric,
        p_value,
        stability
    )

    analysis_result = {
        "columns": [col1, col2],
        "sample_size": len(df),
        "analysis_type": result["analysis_type"],
        "metrics": {
            **result,
            "stability": stability,
            "reliability": reliability
        }
    }

    llm_report = generate_llm_report(
        analysis_result
    )

    report_data = {
        "insight": (
            f"{col1} analyzed with {col2}"
        ),
        "analysis_type": result["analysis_type"],
        "metrics": result,
        "stability": stability,
        "reliability": reliability,
        "llm_report": llm_report
    }

    report_id = ReportService.save_report(
        file_id,
        report_data
    )

    FileService.add_report_to_file(
        file_id,
        report_id
    )

    return {
        "report_id": report_id,
        **report_data
    }