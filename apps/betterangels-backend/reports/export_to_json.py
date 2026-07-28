"""JSON exporter for shelter reporting metrics."""

import json

from shelters.types.reporting import ShelterOccupancyMetricsType

from .export_options import MetricsExportOptions


def metrics_to_json(metrics: ShelterOccupancyMetricsType, options: list[MetricsExportOptions]) -> tuple[str, str]:
    """Serialize selected shelter metrics into one date-keyed report file."""
    selected_options = set(options)
    invalid_options = selected_options - set(MetricsExportOptions)
    if invalid_options:
        raise ValueError(f"Unknown metric export options: {', '.join(sorted(map(str, invalid_options)))}")
    if not selected_options:
        raise ValueError("At least one metric export option must be selected")

    shelter_id = str(metrics.shelter_id)
    start_date = metrics.start_date
    end_date = metrics.end_date
    date_range = f"{start_date.isoformat()}_{end_date.isoformat()}"
    report: dict[str, object] = {}

    if MetricsExportOptions.DAILY_OCCUPANCY_METRICS in selected_options:
        report[MetricsExportOptions.DAILY_OCCUPANCY_METRICS] = {
            metric.date.isoformat(): {
                "shelter_id": shelter_id,
                "occupied_count": metric.occupied_count,
                "total_beds": metric.total_beds,
                "occupancy_pct": metric.occupancy_pct,
            }
            for metric in metrics.daily_occupancy
        }

    if MetricsExportOptions.DAILY_BED_STATUS_METRICS in selected_options:
        report[MetricsExportOptions.DAILY_BED_STATUS_METRICS] = {
            metric.date.isoformat(): {
                "shelter_id": shelter_id,
                "available": metric.available,
                "occupied": metric.occupied,
                "reserved": metric.reserved,
                "out_of_service": metric.out_of_service,
                "in_turnaround": metric.in_turnaround,
            }
            for metric in metrics.daily_bed_status
        }

    if MetricsExportOptions.RESERVATION_METRICS in selected_options:
        reservation_metrics = metrics.reservation_metrics
        report[MetricsExportOptions.RESERVATION_METRICS] = {
            date_range: {
                "shelter_id": shelter_id,
                "check_in_overdue": reservation_metrics.check_in_overdue,
                "cancelled": reservation_metrics.cancelled,
                "checked_in": reservation_metrics.checked_in,
                "check_in_overdue_to_checked_in": reservation_metrics.check_in_overdue_to_checked_in,
            }
        }

    if MetricsExportOptions.AVG_DAYS_TO_OCCUPANCY in selected_options:
        report[MetricsExportOptions.AVG_DAYS_TO_OCCUPANCY] = {
            date_range: {
                "shelter_id": shelter_id,
                "avg_days_to_occupancy": metrics.avg_days_to_occupancy,
            }
        }

    filename = f"{start_date.strftime('%Y%m%d')}_{end_date.strftime('%Y%m%d')}_shelter_report.json"
    return filename, json.dumps({"report": report}, indent=2)
