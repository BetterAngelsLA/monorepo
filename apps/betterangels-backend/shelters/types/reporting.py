"""GraphQL types for shelter reporting/occupancy metrics."""

from datetime import date
from typing import List, Optional

import strawberry
from strawberry import ID


@strawberry.type
class DailyOccupancyMetricsType:
    date: date
    occupied_count: int
    total_beds: int
    occupancy_pct: float


@strawberry.type
class DailyBedStatusMetricsType:
    date: date
    available: int
    occupied: int
    reserved: int
    out_of_service: int


@strawberry.type
class ReservationMetricsType:
    check_in_overdue: int
    cancelled: int
    checked_in: int
    check_in_overdue_to_checked_in: int


@strawberry.type
class ShelterOccupancyMetricsType:
    shelter_id: ID
    start_date: date
    end_date: date
    daily_occupancy: List[DailyOccupancyMetricsType]
    daily_bed_status: List[DailyBedStatusMetricsType]
    reservation_metrics: ReservationMetricsType
    avg_days_to_occupancy: Optional[float] = None
