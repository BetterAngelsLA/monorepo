"""Filter and ordering types for shelter queries."""

import datetime
from typing import List, Optional, Tuple, cast
from zoneinfo import ZoneInfo

import strawberry
import strawberry_django
from accounts.models import User
from common.graphql.types import (
    LatitudeScalar,
    LongitudeScalar,
    make_icontains_filter,
    make_in_filter,
    make_m2m_in_filter,
)
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point, Polygon
from django.contrib.gis.measure import D
from django.db.models import Count, DateTimeField, Exists, OuterRef, Q, QuerySet, Subquery
from shelters import models
from shelters.enums import (
    AccessibilityChoices,
    BedStatusChoices,
    BedTypeChoices,
    DemographicChoices,
    EntryRequirementChoices,
    FunderChoices,
    MedicalNeedChoices,
    ParkingChoices,
    PetChoices,
    ReferralRequirementChoices,
    ReservationStatusChoices,
    RoomStatusChoices,
    RoomStyleChoices,
    ScheduleTypeChoices,
    ShelterChoices,
    SpecialSituationRestrictionChoices,
)
from shelters.models.shelter import ACTIVE_RESERVATION_STATUSES
from shelters.selectors import shelters_open_at
from strawberry import ID, Info, asdict, auto
from strawberry_django.auth.utils import get_current_user

SHELTER_SCHEDULE_TIME_ZONE = ZoneInfo("America/Los_Angeles")


def get_current_shelter_schedule_datetime() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc).astimezone(SHELTER_SCHEDULE_TIME_ZONE)


@strawberry.input
class GeolocationInput:
    latitude: float
    longitude: float
    range_in_miles: Optional[int] = None


@strawberry.input
class MapBoundsInput:
    west_lng: LongitudeScalar
    north_lat: LatitudeScalar
    east_lng: LongitudeScalar
    south_lat: LatitudeScalar


@strawberry.input
class ShelterPropertyInput:
    pets: Optional[List[PetChoices]] = None
    demographics: Optional[List[DemographicChoices]] = None
    entry_requirements: Optional[List[EntryRequirementChoices]] = None
    referral_requirement: Optional[List[ReferralRequirementChoices]] = None
    special_situation_restrictions: Optional[List[SpecialSituationRestrictionChoices]] = None
    shelter_types: Optional[List[ShelterChoices]] = None
    room_styles: Optional[List[RoomStyleChoices]] = None
    parking: Optional[List[ParkingChoices]] = None


@strawberry.input
class MaxStayInput:
    days: int
    include_null: Optional[bool] = False


@strawberry_django.filter_type(models.Shelter)
class ShelterFilter:
    @strawberry_django.filter_field
    def is_access_center(self, info: Info, value: Optional[bool], prefix: str) -> Q:
        if not value:
            return Q()

        return Q(**{f"{prefix}shelter_types__name__exact": ShelterChoices.ACCESS_CENTER})

    @strawberry_django.filter_field
    def max_stay(self, info: Info, value: Optional[MaxStayInput], prefix: str) -> Q:
        if not value:
            return Q()

        conditions = Q(**{f"{prefix}max_stay__gte": value.days})
        if value.include_null:
            conditions |= Q(**{f"{prefix}max_stay__isnull": value.include_null})

        return conditions

    name = make_icontains_filter("name")

    @strawberry_django.filter_field
    def organizations(self, info: Info, value: Optional[list[ID]], prefix: str) -> Q:
        user = get_current_user(info)

        if user is None or not user.is_authenticated:
            if not value:
                return Q()

            return Q(**{f"{prefix}organization__in": value})

        current_user = cast(User, user)
        allowed_organizations = current_user.organizations_organization.all()
        if value:
            allowed_organizations = allowed_organizations.filter(pk__in=value)

        return Q(**{f"{prefix}organization__in": allowed_organizations})

    @strawberry_django.filter_field
    def properties(
        self, queryset: QuerySet, value: Optional[ShelterPropertyInput], prefix: str
    ) -> Tuple[QuerySet[models.Shelter], Q]:
        if value is None:
            return queryset, Q()

        value_dict = asdict(value)
        filters = {f"{k}__name__in": v for k, v in value_dict.items() if v is not None}

        return queryset.filter(**filters).distinct(), Q()

    @strawberry_django.filter_field
    def open_now(self, queryset: QuerySet, value: Optional[bool], prefix: str) -> Tuple[QuerySet[models.Shelter], Q]:
        if not value:
            return queryset, Q()

        return (
            shelters_open_at(
                queryset,
                dt=get_current_shelter_schedule_datetime(),
                schedule_type=ScheduleTypeChoices.OPERATING,
            ),
            Q(),
        )

    @strawberry_django.filter_field
    def map_bounds(
        self,
        queryset: QuerySet,
        value: Optional[MapBoundsInput],
        prefix: str,
    ) -> Tuple[QuerySet[models.Shelter], Q]:
        if not value:
            return queryset, Q()

        bbox: tuple = (
            value.west_lng,
            value.north_lat,
            value.east_lng,
            value.south_lat,
        )
        polygon = Polygon.from_bbox(bbox)

        return queryset.filter(geolocation__within=polygon), Q()

    @strawberry_django.filter_field
    def geolocation(
        self, queryset: QuerySet, value: Optional[GeolocationInput], prefix: str
    ) -> Tuple[QuerySet[models.Shelter], Q]:
        if value is None:
            return queryset, Q()

        reference_point = Point(x=value.longitude, y=value.latitude, srid=4326)

        queryset = queryset.annotate(distance=Distance("geolocation", reference_point)).order_by("distance")

        if value.range_in_miles:
            queryset = queryset.filter(geolocation__dwithin=(reference_point, D(mi=value.range_in_miles)))

        return queryset, Q()

    is_private: auto

    @strawberry_django.filter_field
    def has_available_beds(self, info: Info, value: Optional[bool], prefix: str) -> Q:
        if value is None:
            return Q()

        has_beds = Q(**{f"{prefix}availability__non_restricted_beds__gt": 0}) | Q(
            **{f"{prefix}availability__restricted_beds__gt": 0}
        )
        return has_beds if value else ~has_beds

    @strawberry_django.filter_field
    def spa(self, queryset: QuerySet, value: Optional[List[ID]], prefix: str) -> Tuple[QuerySet[models.Shelter], Q]:
        if not value:
            return queryset, Q()

        return queryset.filter(spa_id__in=value).select_related("spa"), Q()


@strawberry_django.order_type(models.Shelter, one_of=False)
class ShelterOrder:
    name: auto
    created_at: auto


@strawberry_django.order_type(models.Bed, one_of=False)
class BedOrder:
    name: auto
    created_at: auto
    updated_at: auto


@strawberry_django.order_type(models.Room, one_of=False)
class RoomOrder:
    name: auto
    created_at: auto
    updated_at: auto


class CommonBedRoomFilterMixin:
    accessibility = make_m2m_in_filter("accessibility", "name", AccessibilityChoices)
    demographics = make_m2m_in_filter("demographics", "name", DemographicChoices)
    funders = make_m2m_in_filter("funders", "name", FunderChoices)
    maintenance_flag: Optional[bool]
    pets = make_m2m_in_filter("pets", "name", PetChoices)
    shelter_id: Optional[ID]
    storage: Optional[bool]


@strawberry_django.filter_type(models.Bed)
class BedFilter(CommonBedRoomFilterMixin):
    id: Optional[ID]
    type = make_in_filter("type", BedTypeChoices)
    medical_needs = make_m2m_in_filter("medical_needs", "name", MedicalNeedChoices)
    maintenance_flag: Optional[bool]
    shelter_id: Optional[ID]

    @strawberry_django.filter_field
    def status(
        self, queryset: QuerySet, value: Optional[List[BedStatusChoices]], prefix: str
    ) -> Tuple[QuerySet[models.Bed], Q]:
        """Filter beds by their computed status.

        Since Bed has no ``status`` database column, this filter translates
        BedStatusChoices into Q-conditions that mirror the logic in
        ``Bed.computed_status``.
        """
        if not value:
            return queryset, Q()

        q = Q()
        for choice in value:
            if choice == BedStatusChoices.OUT_OF_SERVICE:
                q |= Q(maintenance_flag=True)
            elif choice == BedStatusChoices.IN_TURNAROUND:
                has_completed_with_checkout = Q(
                    Exists(
                        models.Reservation.objects.filter(
                            bed_id=OuterRef("pk"),
                            status=ReservationStatusChoices.COMPLETED,
                            checked_out_at__isnull=False,
                        )
                    )
                )
                latest_completed_checked_out_at = Subquery(
                    models.Reservation.objects.filter(
                        bed_id=OuterRef("pk"),
                        status=ReservationStatusChoices.COMPLETED,
                        checked_out_at__isnull=False,
                    )
                    .order_by("-checked_out_at")
                    .values("checked_out_at")[:1],
                    output_field=DateTimeField(),
                )
                latest_gt_cleaned = Q(last_cleaned__isnull=True) | Q(
                    last_cleaned__lt=latest_completed_checked_out_at,
                )
                q |= Q(maintenance_flag=False) & has_completed_with_checkout & latest_gt_cleaned

            elif choice in (
                BedStatusChoices.OCCUPIED,
                BedStatusChoices.RESERVED,
                BedStatusChoices.AVAILABLE,
            ):
                # Shared "not in turnaround" base condition:
                # Either no completed reservation with checked_out_at exists, OR
                # the most recent completed checked_out_at is <= last_cleaned.
                latest_completed_checked_out_at = Subquery(
                    models.Reservation.objects.filter(
                        bed_id=OuterRef("pk"),
                        status=ReservationStatusChoices.COMPLETED,
                        checked_out_at__isnull=False,
                    )
                    .order_by("-checked_out_at")
                    .values("checked_out_at")[:1],
                    output_field=DateTimeField(),
                )
                no_completed_checkout = ~Q(
                    Exists(
                        models.Reservation.objects.filter(
                            bed_id=OuterRef("pk"),
                            status=ReservationStatusChoices.COMPLETED,
                            checked_out_at__isnull=False,
                        )
                    )
                )
                latest_lte_cleaned = Q(last_cleaned__gte=latest_completed_checked_out_at)
                not_in_turnaround = no_completed_checkout | latest_lte_cleaned

                base = Q(maintenance_flag=False) & not_in_turnaround

                if choice == BedStatusChoices.OCCUPIED:
                    has_checked_in = Q(
                        Exists(
                            models.Reservation.objects.filter(
                                bed_id=OuterRef("pk"),
                                status=ReservationStatusChoices.CHECKED_IN,
                            )
                        )
                    )
                    q |= base & has_checked_in
                elif choice == BedStatusChoices.RESERVED:
                    has_confirmed_or_overdue = Q(
                        Exists(
                            models.Reservation.objects.filter(
                                bed_id=OuterRef("pk"),
                                status__in=[
                                    ReservationStatusChoices.CONFIRMED,
                                    ReservationStatusChoices.CHECK_IN_OVERDUE,
                                ],
                            )
                        )
                    )
                    no_checked_in = ~Q(
                        Exists(
                            models.Reservation.objects.filter(
                                bed_id=OuterRef("pk"),
                                status=ReservationStatusChoices.CHECKED_IN,
                            )
                        )
                    )
                    q |= base & has_confirmed_or_overdue & no_checked_in
                elif choice == BedStatusChoices.AVAILABLE:
                    no_active = ~Q(
                        Exists(
                            models.Reservation.objects.filter(
                                bed_id=OuterRef("pk"),
                                status__in=ACTIVE_RESERVATION_STATUSES,
                            )
                        )
                    )
                    q |= base & no_active

        return queryset, q


@strawberry_django.filter_type(models.Room)
class RoomFilter(CommonBedRoomFilterMixin):
    id: Optional[ID]
    amenities = make_icontains_filter("amenities")
    medical_respite: Optional[bool]
    type = make_in_filter("type", RoomStyleChoices)
    shelter_id: Optional[ID]

    @strawberry_django.filter_field
    def number_of_beds(self, queryset: QuerySet, value: Optional[int], prefix: str) -> Tuple[QuerySet, Q]:
        if value is None:
            return queryset, Q()
        return queryset.annotate(num_beds=Count("beds")).filter(num_beds=value), Q()

    @strawberry_django.filter_field
    def status(
        self, queryset: QuerySet, value: Optional[List[RoomStatusChoices]], prefix: str
    ) -> Tuple[QuerySet[models.Room], Q]:
        """Filter rooms by their computed status.

        Since room has no ``status`` database column, this filter translates
        RoomStatusChoices into Q-conditions that mirror the logic in
        ``Room.computed_status``.
        """
        if not value:
            return queryset, Q()

        q = Q()
        for choice in value:
            if choice == RoomStatusChoices.OUT_OF_SERVICE:
                q |= Q(maintenance_flag=True)

            elif choice == RoomStatusChoices.IN_TURNAROUND:
                # Room turnaround is determined per bed: a room is in turnaround
                # if any of its beds are. We use a simpler approach here since
                # rooms don't have their own last_checkout.
                has_completed_with_checkout = Q(
                    Exists(
                        models.Reservation.objects.filter(
                            room_id=OuterRef("pk"),
                            status=ReservationStatusChoices.COMPLETED,
                            checked_out_at__isnull=False,
                            bed__isnull=False,
                        )
                    )
                )
                q |= Q(maintenance_flag=False) & has_completed_with_checkout

            elif choice in (
                RoomStatusChoices.OCCUPIED,
                RoomStatusChoices.RESERVED,
                RoomStatusChoices.AVAILABLE,
            ):
                base = Q(maintenance_flag=False)

                if choice == RoomStatusChoices.OCCUPIED:
                    has_checked_in = Q(
                        Exists(
                            models.Reservation.objects.filter(
                                room_id=OuterRef("pk"),
                                status=ReservationStatusChoices.CHECKED_IN,
                            )
                        )
                    )
                    q |= base & has_checked_in
                elif choice == RoomStatusChoices.RESERVED:
                    has_confirmed_or_overdue = Q(
                        Exists(
                            models.Reservation.objects.filter(
                                room_id=OuterRef("pk"),
                                status__in=[
                                    ReservationStatusChoices.CONFIRMED,
                                    ReservationStatusChoices.CHECK_IN_OVERDUE,
                                ],
                            )
                        )
                    )
                    no_checked_in = ~Q(
                        Exists(
                            models.Reservation.objects.filter(
                                room_id=OuterRef("pk"),
                                status=ReservationStatusChoices.CHECKED_IN,
                            )
                        )
                    )
                    q |= base & has_confirmed_or_overdue & no_checked_in
                elif choice == RoomStatusChoices.AVAILABLE:
                    no_active = ~Q(
                        Exists(
                            models.Reservation.objects.filter(
                                room_id=OuterRef("pk"),
                                status__in=ACTIVE_RESERVATION_STATUSES,
                            )
                        )
                    )
                    q |= base & no_active

        return queryset, q


@strawberry_django.filter_type(models.Reservation)
class ReservationFilter:
    id: Optional[ID]
    room_id: Optional[ID]
    bed_id: Optional[ID]
    status = make_in_filter("status", ReservationStatusChoices)

    @strawberry_django.filter_field
    def shelter_id(self, info: Info, value: Optional[ID], prefix: str) -> Q:
        if not value:
            return Q()
        return Q(**{f"{prefix}bed__shelter_id": value}) | Q(**{f"{prefix}room__shelter_id": value})


@strawberry_django.order_type(models.Reservation, one_of=False)
class ReservationOrder:
    start_date: auto
    checked_in_at: auto
    checked_out_at: auto
    created_at: auto
    updated_at: auto
