from enum import StrEnum


class MetricsExportOptions(StrEnum):
    DAILY_OCCUPANCY_METRICS = "daily_occupancy_metrics"
    DAILY_BED_STATUS_METRICS = "daily_bed_status_metrics"
    RESERVATION_METRICS = "reservation_metrics"
    AVG_DAYS_TO_OCCUPANCY = "avg_days_to_occupancy"
