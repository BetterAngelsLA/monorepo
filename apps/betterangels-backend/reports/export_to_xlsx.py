"""XLSX exporters for shelter reporting metrics.

These adapters intentionally accept the Strawberry reporting DTOs from
``shelters.types.reporting``. Keep the XLSX column mapping in sync when those
GraphQL-facing types change.
"""

from datetime import date
from io import BytesIO
from typing import Any

from openpyxl import Workbook
from openpyxl.worksheet.worksheet import Worksheet
from shelters.types.reporting import (
    DailyBedStatusMetricsType,
    DailyOccupancyMetricsType,
    ReservationMetricsType,
    ShelterOccupancyMetricsType,
)

from .export_options import MetricsExportOptions

SheetData = tuple[list[str], list[dict[str, Any]]]


def metrics_to_xlsx(metrics: ShelterOccupancyMetricsType, options: list[MetricsExportOptions]) -> tuple[str, bytes]:
    shelter_id = str(metrics.shelter_id)
    start_date = metrics.start_date
    end_date = metrics.end_date
    selected_options = set(options)
    invalid_options = selected_options - set(MetricsExportOptions)
    if invalid_options:
        raise ValueError(f"Unknown metric export options: {', '.join(sorted(map(str, invalid_options)))}")

    start_str = start_date.strftime("%Y%m%d")
    end_str = end_date.strftime("%Y%m%d")
    sheets: list[tuple[str, SheetData]] = []

    if MetricsExportOptions.DAILY_OCCUPANCY_METRICS in selected_options:
        sheets.append(("Daily Occupancy", _daily_occupancy_sheet_data(shelter_id, metrics.daily_occupancy)))

    if MetricsExportOptions.DAILY_BED_STATUS_METRICS in selected_options:
        sheets.append(("Daily Bed Status", _daily_bed_status_sheet_data(shelter_id, metrics.daily_bed_status)))

    if MetricsExportOptions.RESERVATION_METRICS in selected_options:
        sheets.append(
            (
                "Reservation Metrics",
                _reservation_metrics_sheet_data(shelter_id, start_date, end_date, metrics.reservation_metrics),
            )
        )

    if MetricsExportOptions.AVG_DAYS_TO_OCCUPANCY in selected_options:
        sheets.append(
            (
                "Avg Days To Occupancy",
                _avg_days_to_occupancy_sheet_data(shelter_id, start_date, end_date, metrics.avg_days_to_occupancy),
            )
        )

    if not sheets:
        raise ValueError("At least one metric export option must be selected")

    workbook = Workbook()
    worksheet = workbook.active
    if not isinstance(worksheet, Worksheet):
        raise RuntimeError("Workbook does not have an active worksheet")

    for index, (worksheet_name, (headers, rows)) in enumerate(sheets):
        if index:
            worksheet = workbook.create_sheet()

        worksheet.title = worksheet_name
        _append_rows(worksheet, rows, headers)

    return f"{start_str}_{end_str}_shelter_report.xlsx", _workbook_to_bytes(workbook)


def _daily_occupancy_sheet_data(shelter_id: str, metrics: list[DailyOccupancyMetricsType]) -> SheetData:
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

    return headers, rows


def _daily_bed_status_sheet_data(shelter_id: str, metrics: list[DailyBedStatusMetricsType]) -> SheetData:
    headers = ["date", "shelter_id", "available", "occupied", "reserved", "out_of_service", "in_turnaround"]
    rows = [
        {
            "date": metric.date,
            "shelter_id": shelter_id,
            "available": metric.available,
            "occupied": metric.occupied,
            "reserved": metric.reserved,
            "out_of_service": metric.out_of_service,
            "in_turnaround": metric.in_turnaround,
        }
        for metric in metrics
    ]

    return headers, rows


def _reservation_metrics_sheet_data(
    shelter_id: str, start_date: date, end_date: date, metrics: ReservationMetricsType
) -> SheetData:
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

    return headers, rows


def _avg_days_to_occupancy_sheet_data(
    shelter_id: str, start_date: date, end_date: date, avg_days: float | None
) -> SheetData:
    headers = ["start_date", "end_date", "shelter_id", "avg_days_to_occupancy"]
    rows = [
        {
            "start_date": start_date,
            "end_date": end_date,
            "shelter_id": shelter_id,
            "avg_days_to_occupancy": "" if avg_days is None else avg_days,
        }
    ]

    return headers, rows


def _append_rows(worksheet: Worksheet, rows: list[dict[str, Any]], headers: list[str]) -> None:
    worksheet.append(headers)

    for row in rows:
        worksheet.append([_cell_value(row.get(header, "")) for header in headers])


def _cell_value(value: Any) -> Any:
    if isinstance(value, date):
        return value.isoformat()

    return value


def _workbook_to_bytes(workbook: Workbook) -> bytes:
    output = BytesIO()
    workbook.save(output)
    return output.getvalue()
