"""XLSX exporters for shelter reporting metrics.

These adapters intentionally accept the Strawberry reporting DTOs from
``shelters.types.reporting``. Keep the XLSX column mapping in sync when those
GraphQL-facing types change.
"""

import zipfile
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


def xlsx_files_to_zip(files: dict[str, bytes]) -> bytes:
    output = BytesIO()

    with zipfile.ZipFile(output, mode="w", compression=zipfile.ZIP_DEFLATED) as zip_file:
        for filename, xlsx_content in files.items():
            zip_file.writestr(filename, xlsx_content)

    return output.getvalue()


def rows_to_xlsx(rows: list[dict[str, Any]], headers: list[str], worksheet_name: str = "Sheet1") -> bytes:
    workbook = Workbook()
    worksheet = workbook.active
    worksheet.title = worksheet_name
    _append_rows(worksheet, rows, headers)

    return _workbook_to_bytes(workbook)


def daily_occupancy_metrics_to_xlsx(shelter_id: str, metrics: list[DailyOccupancyMetricsType]) -> bytes:
    headers, rows = _daily_occupancy_sheet_data(shelter_id, metrics)
    return rows_to_xlsx(rows, headers, worksheet_name="Daily Occupancy")


def daily_bed_status_metrics_to_xlsx(shelter_id: str, metrics: list[DailyBedStatusMetricsType]) -> bytes:
    headers, rows = _daily_bed_status_sheet_data(shelter_id, metrics)
    return rows_to_xlsx(rows, headers, worksheet_name="Daily Bed Status")


def reservation_metrics_to_xlsx(
    shelter_id: str, start_date: date, end_date: date, metrics: ReservationMetricsType
) -> bytes:
    headers, rows = _reservation_metrics_sheet_data(shelter_id, start_date, end_date, metrics)
    return rows_to_xlsx(rows, headers, worksheet_name="Reservation Metrics")


def avg_days_to_occupancy_to_xlsx(shelter_id: str, start_date: date, end_date: date, avg_days: float | None) -> bytes:
    headers, rows = _avg_days_to_occupancy_sheet_data(shelter_id, start_date, end_date, avg_days)
    return rows_to_xlsx(rows, headers, worksheet_name="Avg Days To Occupancy")


def metrics_to_zip(metrics: ShelterOccupancyMetricsType, options: list[MetricsExportOptions]) -> bytes:
    shelter_id = str(metrics.shelter_id)
    start_date = metrics.start_date
    end_date = metrics.end_date
    selected_options = set(options)

    start_str = start_date.strftime("%Y%m%d")
    end_str = end_date.strftime("%Y%m%d")
    files = {}

    if MetricsExportOptions.DAILY_OCCUPANCY_METRICS in selected_options:
        files[f"{start_str}_{end_str}_daily_occupancy_metrics.xlsx"] = daily_occupancy_metrics_to_xlsx(
            shelter_id, metrics.daily_occupancy
        )

    if MetricsExportOptions.DAILY_BED_STATUS_METRICS in selected_options:
        files[f"{start_str}_{end_str}_daily_bed_status_metrics.xlsx"] = daily_bed_status_metrics_to_xlsx(
            shelter_id, metrics.daily_bed_status
        )

    if MetricsExportOptions.RESERVATION_METRICS in selected_options:
        files[f"{start_str}_{end_str}_reservation_metrics.xlsx"] = reservation_metrics_to_xlsx(
            shelter_id, start_date, end_date, metrics.reservation_metrics
        )

    if MetricsExportOptions.AVG_DAYS_TO_OCCUPANCY in selected_options:
        files[f"{start_str}_{end_str}_avg_days_to_occupancy.xlsx"] = avg_days_to_occupancy_to_xlsx(
            shelter_id, start_date, end_date, metrics.avg_days_to_occupancy
        )

    return xlsx_files_to_zip(files)


def _daily_occupancy_sheet_data(shelter_id: str, metrics: list[DailyOccupancyMetricsType]) -> SheetData:
    headers = ["date", "shelter_id", "occupied_count", "total_beds", "occupancy_pct"]
    rows = [
        {
            "date": metric.date.isoformat(),
            "shelter_id": shelter_id,
            "occupied_count": metric.occupied_count,
            "total_beds": metric.total_beds,
            "occupancy_pct": metric.occupancy_pct,
        }
        for metric in metrics
    ]

    return headers, rows


def _daily_bed_status_sheet_data(shelter_id: str, metrics: list[DailyBedStatusMetricsType]) -> SheetData:
    headers = ["date", "shelter_id", "available", "occupied", "reserved", "out_of_service"]
    rows = [
        {
            "date": metric.date.isoformat(),
            "shelter_id": shelter_id,
            "available": metric.available,
            "occupied": metric.occupied,
            "reserved": metric.reserved,
            "out_of_service": metric.out_of_service,
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
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
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
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
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
