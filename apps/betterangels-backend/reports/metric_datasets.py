"""Tabular views of the shelter reporting metrics, one Dataset per option.

Each builder owns its column order and row shape for every export format;
``tablib`` turns a Dataset into csv/xlsx/json, so a new format costs nothing
here. The builders accept the Strawberry reporting DTOs from
``shelters.types.reporting`` — keep the columns in step when those change.
"""

from tablib import Dataset

from shelters.types.reporting import ShelterOccupancyMetricsType

from .export_options import MetricsExportOptions


def daily_occupancy_dataset(metrics: ShelterOccupancyMetricsType) -> Dataset:
    dataset = Dataset(title=MetricsExportOptions.DAILY_OCCUPANCY_METRICS.value)
    dataset.headers = ["date", "shelter_id", "occupied_count", "total_beds", "occupancy_pct"]

    for daily in metrics.daily_occupancy:
        dataset.append([daily.date, metrics.shelter_id, daily.occupied_count, daily.total_beds, daily.occupancy_pct])

    return dataset


def daily_bed_status_dataset(metrics: ShelterOccupancyMetricsType) -> Dataset:
    dataset = Dataset(title=MetricsExportOptions.DAILY_BED_STATUS_METRICS.value)
    dataset.headers = [
        "date",
        "shelter_id",
        "available",
        "occupied",
        "reserved",
        "out_of_service",
        "in_turnaround",
    ]

    for daily in metrics.daily_bed_status:
        dataset.append(
            [
                daily.date,
                metrics.shelter_id,
                daily.available,
                daily.occupied,
                daily.reserved,
                daily.out_of_service,
                daily.in_turnaround,
            ]
        )

    return dataset


def reservation_metrics_dataset(metrics: ShelterOccupancyMetricsType) -> Dataset:
    dataset = Dataset(title=MetricsExportOptions.RESERVATION_METRICS.value)
    dataset.headers = [
        "start_date",
        "end_date",
        "shelter_id",
        "check_in_overdue",
        "cancelled",
        "checked_in",
        "check_in_overdue_to_checked_in",
    ]

    reservations = metrics.reservation_metrics
    dataset.append(
        [
            metrics.start_date,
            metrics.end_date,
            metrics.shelter_id,
            reservations.check_in_overdue,
            reservations.cancelled,
            reservations.checked_in,
            reservations.check_in_overdue_to_checked_in,
        ]
    )

    return dataset


def avg_days_to_occupancy_dataset(metrics: ShelterOccupancyMetricsType) -> Dataset:
    dataset = Dataset(title=MetricsExportOptions.AVG_DAYS_TO_OCCUPANCY.value)
    dataset.headers = ["start_date", "end_date", "shelter_id", "avg_days_to_occupancy"]
    dataset.append([metrics.start_date, metrics.end_date, metrics.shelter_id, metrics.avg_days_to_occupancy])

    return dataset


DATASET_BUILDERS = {
    MetricsExportOptions.DAILY_OCCUPANCY_METRICS: daily_occupancy_dataset,
    MetricsExportOptions.DAILY_BED_STATUS_METRICS: daily_bed_status_dataset,
    MetricsExportOptions.RESERVATION_METRICS: reservation_metrics_dataset,
    MetricsExportOptions.AVG_DAYS_TO_OCCUPANCY: avg_days_to_occupancy_dataset,
}
