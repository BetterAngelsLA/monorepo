"""Render a shelter's reporting metrics as a downloadable file.

Format dispatch belongs to ``tablib``: a ``Databook`` exports xlsx and json
directly. CSV is the exception — it holds one table, so a multi-metric export is
a zip with one file per metric.

Each metric names its columns and builds its rows as dicts keyed by those names,
so a value cannot end up under the wrong header. The names are written out
rather than derived from ``shelters.types.reporting``: renaming a GraphQL field
should not silently rename a column a downstream spreadsheet depends on.
"""

import zipfile
from collections.abc import Collection
from enum import StrEnum
from io import BytesIO
from typing import Any

from tablib import Databook, Dataset

from shelters.types.reporting import ShelterOccupancyMetricsType

XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

EXPORT_CONTENT_TYPES = {
    "csv": "application/zip",
    "json": "application/json",
    "xlsx": XLSX_CONTENT_TYPE,
}


class MetricsExportOptions(StrEnum):
    DAILY_OCCUPANCY_METRICS = "daily_occupancy_metrics"
    DAILY_BED_STATUS_METRICS = "daily_bed_status_metrics"
    RESERVATION_METRICS = "reservation_metrics"
    AVG_DAYS_TO_OCCUPANCY = "avg_days_to_occupancy"


def _dataset(option: MetricsExportOptions, headers: list[str], rows: list[dict[str, Any]]) -> Dataset:
    """Assemble a titled Dataset, reading each row by header name.

    A row missing a header raises rather than shifting the remaining columns.
    """
    dataset = Dataset(title=option.value)
    dataset.headers = headers

    for row in rows:
        dataset.append([row[header] for header in headers])

    return dataset


def _daily_occupancy_dataset(metrics: ShelterOccupancyMetricsType) -> Dataset:
    return _dataset(
        MetricsExportOptions.DAILY_OCCUPANCY_METRICS,
        ["date", "shelter_id", "occupied_count", "total_beds", "occupancy_pct"],
        [
            {
                "date": daily.date,
                "shelter_id": metrics.shelter_id,
                "occupied_count": daily.occupied_count,
                "total_beds": daily.total_beds,
                "occupancy_pct": daily.occupancy_pct,
            }
            for daily in metrics.daily_occupancy
        ],
    )


def _daily_bed_status_dataset(metrics: ShelterOccupancyMetricsType) -> Dataset:
    return _dataset(
        MetricsExportOptions.DAILY_BED_STATUS_METRICS,
        ["date", "shelter_id", "available", "occupied", "reserved", "out_of_service", "in_turnaround"],
        [
            {
                "date": daily.date,
                "shelter_id": metrics.shelter_id,
                "available": daily.available,
                "occupied": daily.occupied,
                "reserved": daily.reserved,
                "out_of_service": daily.out_of_service,
                "in_turnaround": daily.in_turnaround,
            }
            for daily in metrics.daily_bed_status
        ],
    )


def _reservation_metrics_dataset(metrics: ShelterOccupancyMetricsType) -> Dataset:
    """One row for the whole range, not one per day."""
    reservations = metrics.reservation_metrics

    return _dataset(
        MetricsExportOptions.RESERVATION_METRICS,
        [
            "start_date",
            "end_date",
            "shelter_id",
            "check_in_overdue",
            "cancelled",
            "checked_in",
            "check_in_overdue_to_checked_in",
        ],
        [
            {
                "start_date": metrics.start_date,
                "end_date": metrics.end_date,
                "shelter_id": metrics.shelter_id,
                "check_in_overdue": reservations.check_in_overdue,
                "cancelled": reservations.cancelled,
                "checked_in": reservations.checked_in,
                "check_in_overdue_to_checked_in": reservations.check_in_overdue_to_checked_in,
            }
        ],
    )


def _avg_days_to_occupancy_dataset(metrics: ShelterOccupancyMetricsType) -> Dataset:
    """One row for the whole range, not one per day."""
    return _dataset(
        MetricsExportOptions.AVG_DAYS_TO_OCCUPANCY,
        ["start_date", "end_date", "shelter_id", "avg_days_to_occupancy"],
        [
            {
                "start_date": metrics.start_date,
                "end_date": metrics.end_date,
                "shelter_id": metrics.shelter_id,
                "avg_days_to_occupancy": metrics.avg_days_to_occupancy,
            }
        ],
    )


DATASET_BUILDERS = {
    MetricsExportOptions.DAILY_OCCUPANCY_METRICS: _daily_occupancy_dataset,
    MetricsExportOptions.DAILY_BED_STATUS_METRICS: _daily_bed_status_dataset,
    MetricsExportOptions.RESERVATION_METRICS: _reservation_metrics_dataset,
    MetricsExportOptions.AVG_DAYS_TO_OCCUPANCY: _avg_days_to_occupancy_dataset,
}


def _sheets_to_zip(book: Databook) -> bytes:
    buffer = BytesIO()

    with zipfile.ZipFile(buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zip_file:
        for sheet in book.sheets():
            zip_file.writestr(f"{sheet.title}.csv", sheet.export("csv"))

    return buffer.getvalue()


def resolve_export_options(selected: Collection[str] | None) -> list[MetricsExportOptions]:
    """Turn a caller's selection into the metrics to render, in a stable order.

    Nothing selected means everything — a query string cannot tell an absent
    ``include`` from an empty one. Order always follows ``MetricsExportOptions``
    so identical requests produce identically ordered sheets.
    """
    return [option for option in MetricsExportOptions if not selected or option.value in selected]


def shelter_metrics_export(
    *,
    metrics: ShelterOccupancyMetricsType,
    options: list[MetricsExportOptions],
    export_format: str,
) -> tuple[str, str, bytes]:
    """Return ``(filename, content_type, body)`` for the selected metrics."""
    if export_format not in EXPORT_CONTENT_TYPES:
        raise ValueError(f"Unsupported export format: {export_format}")

    if not options:
        raise ValueError("At least one metric export option must be selected")

    unknown = [option for option in options if option not in DATASET_BUILDERS]
    if unknown:
        raise ValueError(f"Unknown metric export options: {', '.join(sorted(map(str, unknown)))}")

    book = Databook([DATASET_BUILDERS[option](metrics) for option in options])
    stem = f"{metrics.start_date:%Y%m%d}_{metrics.end_date:%Y%m%d}_shelter_report"
    content_type = EXPORT_CONTENT_TYPES[export_format]

    if export_format == "csv":
        return f"{stem}.zip", content_type, _sheets_to_zip(book)

    body = book.export(export_format)

    return f"{stem}.{export_format}", content_type, body if isinstance(body, bytes) else body.encode()
