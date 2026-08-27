"""Render selected shelter reporting metrics as a downloadable file.

Format dispatch belongs to ``tablib``: a ``Databook`` exports xlsx and json
directly. CSV is the exception — it holds one table, so a multi-metric export
becomes a zip with one file per metric.
"""

import zipfile
from io import BytesIO

from tablib import Databook

from shelters.types.reporting import ShelterOccupancyMetricsType

from .export_options import MetricsExportOptions
from .metric_datasets import DATASET_BUILDERS

XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

EXPORT_CONTENT_TYPES = {
    "csv": "application/zip",
    "json": "application/json",
    "xlsx": XLSX_CONTENT_TYPE,
}


def _sheets_to_zip(book: Databook) -> bytes:
    buffer = BytesIO()

    with zipfile.ZipFile(buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zip_file:
        for sheet in book.sheets():
            zip_file.writestr(f"{sheet.title}.csv", sheet.export("csv"))

    return buffer.getvalue()


def shelter_metrics_export(
    *,
    metrics: ShelterOccupancyMetricsType,
    options: list[MetricsExportOptions],
    export_format: str,
) -> tuple[str, str, bytes]:
    """Return ``(filename, content_type, body)`` for the selected metrics.

    ``options`` is rendered in the order given, which decides sheet and file
    order in the result.
    """
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
