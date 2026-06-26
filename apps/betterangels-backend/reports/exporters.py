import csv
import zipfile
from datetime import date
from io import BytesIO, StringIO
from typing import Any, Optional

from shelters.types.reporting import (
    DailyBedStatusMetricsType,
    DailyOccupancyMetricsType,
    ReservationMetricsType,
    ShelterOccupancyMetricsType,
)


def csv_files_to_zip(files: dict[str, str]) -> bytes:
    output = BytesIO()

    with zipfile.ZipFile(output, mode="w", compression=zipfile.ZIP_DEFLATED) as zip_file:
        for filename, csv_content in files.items():
            zip_file.writestr(filename, csv_content)

    return output.getvalue()


def rows_to_csv(rows: list[dict[str, Any]], headers: list[str]) -> str:
    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=headers)

    writer.writeheader()

    for row in rows:
        writer.writerow({header: row.get(header, "") for header in headers})

    return output.getvalue()


def daily_occupancy_metrics_to_csv(shelter_id: str, metrics: list[DailyOccupancyMetricsType]) -> str:
    headers = ["date", "shelter_id", "occupied_count", "total_beds", "occupancy_pct"]

    rows = [
        {
            "date": metric.date,
            "shelter_id": shelter_id,
            "occupied_count": metric.occupied_count,
            "total_beds": metric.total_beds,
            "occupancy_pct": metric.occupancy_pct,
        }
        for metric in metrics
    ]

    return rows_to_csv(rows, headers)


def daily_bed_status_metrics_to_csv(shelter_id: str, metrics: list[DailyBedStatusMetricsType]) -> str:
    headers = ["date", "shelter_id", "available", "occupied", "reserved", "out_of_service"]

    rows = [
        {
            "date": metric.date,
            "shelter_id": shelter_id,
            "available": metric.available,
            "occupied": metric.occupied,
            "reserved": metric.reserved,
            "out_of_service": metric.out_of_service,
        }
        for metric in metrics
    ]

    return rows_to_csv(rows, headers)


def reservation_metrics_to_csv(
    shelter_id: str, start_date: date, end_date: date, metrics: ReservationMetricsType
) -> str:
    headers = [
        "start_date",
        "end_date",
        "shelter_id",
        "check_in_overdue",
        "cancelled",
        "checked_in",
        "check_in_overdue_to_checked_in",
    ]

    rows = [
        {
            "start_date": start_date,
            "end_date": end_date,
            "shelter_id": shelter_id,
            "check_in_overdue": metrics.check_in_overdue,
            "cancelled": metrics.cancelled,
            "checked_in": metrics.checked_in,
            "check_in_overdue_to_checked_in": metrics.check_in_overdue_to_checked_in,
        }
    ]

    return rows_to_csv(rows, headers)


def avg_days_to_occupancy_to_csv(shelter_id: str, start_date: date, end_date: date, avg_days: Optional[float]) -> str:
    headers = ["start_date", "end_date", "shelter_id", "avg_days_to_occupancy"]

    rows = [
        {"start_date": start_date, "end_date": end_date, "shelter_id": shelter_id, "avg_days_to_occupancy": avg_days}
    ]

    return rows_to_csv(rows, headers)


def metrics_to_zip(metrics: ShelterOccupancyMetricsType) -> bytes:
    shelter_id = str(metrics.shelter_id)
    start_date = metrics.start_date
    end_date = metrics.end_date

    files = {
        "daily_occupancy_metrics.csv": daily_occupancy_metrics_to_csv(shelter_id, metrics.daily_occupancy),
        "daily_bed_status_metrics.csv": daily_bed_status_metrics_to_csv(shelter_id, metrics.daily_bed_status),
        "reservation_metrics.csv": reservation_metrics_to_csv(
            shelter_id, start_date, end_date, metrics.reservation_metrics
        ),
        "avg_days_to_occupancy.csv": avg_days_to_occupancy_to_csv(
            shelter_id, start_date, end_date, metrics.avg_days_to_occupancy
        ),
    }

    return csv_files_to_zip(files)
