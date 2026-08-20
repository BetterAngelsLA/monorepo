"""Filter and ordering types for shelter queries."""

import datetime
from functools import reduce
from operator import and_, or_
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
from django.db.models import Case, Count, F, IntegerField, OuterRef, Q, QuerySet, Subquery, Value, When
from django.db.models.functions import Coalesce
from strawberry import ID, Info, asdict, auto
from strawberry_django.auth.utils import get_current_user

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
    ShelterProgramChoices,
    SpecialSituationRestrictionChoices,
    StatusChoices,
    StorageChoices,
)
from shelters.managers import BedQuerySet, RoomQuerySet
from shelters.open_at import shelters_open_at

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
    pets_include_null: Optional[bool] = False
    demographics: Optional[List[DemographicChoices]] = None
    demographics_include_null: Optional[bool] = False
    entry_requirements: Optional[List[EntryRequirementChoices]] = None
    entry_requirements_include_null: Optional[bool] = False
    referral_requirement: Optional[List[ReferralRequirementChoices]] = None
    referral_requirement_include_null: Optional[bool] = False
    special_situation_restrictions: Optional[List[SpecialSituationRestrictionChoices]] = None
    special_situation_restrictions_include_null: Optional[bool] = False
    shelter_types: Optional[List[ShelterChoices]] = None
    shelter_types_include_null: Optional[bool] = False
    room_styles: Optional[List[RoomStyleChoices]] = None
    room_styles_include_null: Optional[bool] = False
    parking: Optional[List[ParkingChoices]] = None
    parking_include_null: Optional[bool] = False
    funders: Optional[List[FunderChoices]] = None
    funders_include_null: Optional[bool] = False


@strawberry.input
class MaxStayInput:
    days: int
    include_null: Optional[bool] = False


@strawberry.input
class OpenNowInput:
    schedule_type: Optional[List[ScheduleTypeChoices]] = None


@strawberry_django.filter_type(models.Shelter)
class PublicShelterFilter:
    name = make_icontains_filter("name")
    accessibility = make_m2m_in_filter("accessibility", "name", AccessibilityChoices)
    storage = make_m2m_in_filter("storage", "name", StorageChoices)
    shelter_programs = make_m2m_in_filter("shelter_programs", "name", ShelterProgramChoices)

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

    @strawberry_django.filter_field
    def properties(
        self, queryset: QuerySet, value: Optional[ShelterPropertyInput], prefix: str
    ) -> Tuple[QuerySet[models.Shelter], Q]:
        if value is None:
            return queryset, Q()

        # Fields that have corresponding include_null flags
        property_fields = [
            "pets",
            "demographics",
            "entry_requirements",
            "referral_requirement",
            "special_situation_restrictions",
            "shelter_types",
            "room_styles",
            "parking",
            "funders",
        ]

        value_dict = asdict(value)
        combined_q = Q()

        for field in property_fields:
            values = value_dict.get(field)
            include_null = value_dict.get(f"{field}_include_null", False)

            if values and include_null:
                combined_q &= Q(**{f"{field}__name__in": values}) | Q(**{f"{field}__isnull": True})
            elif values:
                combined_q &= Q(**{f"{field}__name__in": values})
            elif include_null:
                combined_q &= Q(**{f"{field}__isnull": True})

        return queryset.filter(combined_q).distinct(), Q()

    @strawberry_django.filter_field(deprecation_reason="Use openNow instead")
    def open_now_for(
        self,
        queryset: QuerySet,
        value: Optional[list[ScheduleTypeChoices]],
        prefix: str,
    ) -> Tuple[QuerySet[models.Shelter], Q]:
        if not value:
            return queryset, Q()

        return (
            shelters_open_at(
                queryset,
                dt=get_current_shelter_schedule_datetime(),
                schedule_types=value,
            ),
            Q(),
        )

    @strawberry_django.filter_field
    def open_now(
        self, queryset: QuerySet, value: Optional[OpenNowInput], prefix: str
    ) -> Tuple[QuerySet[models.Shelter], Q]:
        if value is None or not value.schedule_type:
            return queryset, Q()

        return (
            shelters_open_at(
                queryset,
                dt=get_current_shelter_schedule_datetime(),
                schedule_types=value.schedule_type,
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

    @strawberry_django.filter_field
    def on_site_security(self, info: Info, value: Optional[bool], prefix: str) -> Q:
        if value is None:
            return Q()
        return Q(**{f"{prefix}on_site_security": value})

    @strawberry_django.filter_field
    def city(self, info: Info, value: Optional[List[ID]], prefix: str) -> Q:
        if not value:
            return Q()
        return Q(**{f"{prefix}city__in": value})

    @strawberry_django.filter_field
    def cities_served(
        self, queryset: QuerySet, value: Optional[List[ID]], prefix: str
    ) -> Tuple[QuerySet[models.Shelter], Q]:
        if not value:
            return queryset, Q()
        return queryset.filter(**{f"{prefix}cities_served__in": value}).distinct(), Q()

    @strawberry_django.filter_field
    def spas_served(
        self, queryset: QuerySet, value: Optional[List[ID]], prefix: str
    ) -> Tuple[QuerySet[models.Shelter], Q]:
        if not value:
            return queryset, Q()
        return queryset.filter(**{f"{prefix}spas_served__in": value}).distinct(), Q()

    @strawberry_django.filter_field
    def services(
        self, queryset: QuerySet, value: Optional[List[ID]], prefix: str
    ) -> Tuple[QuerySet[models.Shelter], Q]:
        if not value:
            return queryset, Q()
        return queryset.filter(**{f"{prefix}services__in": value}).distinct(), Q()


@strawberry_django.filter_type(models.Shelter)
class OperatorShelterFilter(PublicShelterFilter):
    @strawberry_django.filter_field
    def search(self, info: Info, value: Optional[str], prefix: str) -> Q:
        """
        Free-text search across name, organization name, description, and subjective review.

        Each search term must match at least one searched field; terms are combined
        with AND so a single term matching one field cannot bypass the other terms'
        requirements.
        """
        if value is None:
            return Q()

        value = value.strip()
        if not value:
            return Q()

        search_terms = value.split()
        searchable_fields = ["name", "organization__name", "description", "subjective_review"]

        # Each search term must match at least one searched field.
        term_queries: list[Q] = []
        for term in search_terms:
            term_query = reduce(
                or_,
                [Q(**{f"{prefix}{field}__icontains": term}) for field in searchable_fields],
            )
            term_queries.append(term_query)

        return reduce(and_, term_queries)

    @strawberry_django.filter_field
    def organizations(self, info: Info, value: Optional[list[ID]], prefix: str) -> Q:
        """Scope to orgs the authenticated user belongs to (intersected with *value* if set)."""
        current_user = cast(User, get_current_user(info))
        allowed_organizations = current_user.organizations_organization.all()
        if value:
            allowed_organizations = allowed_organizations.filter(pk__in=value)

        return Q(**{f"{prefix}organization__in": allowed_organizations})

    @strawberry_django.filter_field
    def status(self, info: Info, value: Optional[List[StatusChoices]], prefix: str) -> Q:
        if not value:
            return Q()
        return Q(**{f"{prefix}status__in": value})

    @strawberry_django.filter_field
    def city_council_district(self, info: Info, value: Optional[List[int]], prefix: str) -> Q:
        if not value:
            return Q()
        return Q(**{f"{prefix}city_council_district__in": value})

    @strawberry_django.filter_field
    def supervisorial_district(self, info: Info, value: Optional[List[int]], prefix: str) -> Q:
        if not value:
            return Q()
        return Q(**{f"{prefix}supervisorial_district__in": value})

    @strawberry_django.filter_field
    def overall_rating(self, info: Info, value: Optional[List[int]], prefix: str) -> Q:
        if not value:
            return Q()
        return Q(**{f"{prefix}overall_rating__in": value})


@strawberry_django.order_type(models.Shelter, one_of=False)
class ShelterOrder:
    name: auto
    created_at: auto

    @strawberry_django.order_field
    def status(
        self,
        info: Info,
        queryset: QuerySet,
        value: auto,
        prefix: str,
    ) -> tuple[QuerySet, list[strawberry_django.Ordering]]:
        """Order by shelter lifecycle: draft → pending → approved → inactive."""
        queryset = queryset.annotate(
            **{
                f"{prefix}_status_rank": Case(
                    When(**{f"{prefix}status": StatusChoices.DRAFT}, then=Value(0)),
                    When(**{f"{prefix}status": StatusChoices.PENDING}, then=Value(1)),
                    When(**{f"{prefix}status": StatusChoices.APPROVED}, then=Value(2)),
                    When(**{f"{prefix}status": StatusChoices.INACTIVE}, then=Value(3)),
                    default=Value(4),
                    output_field=IntegerField(),
                )
            }
        )
        return queryset, [value.resolve(f"{prefix}_status_rank")]

    @strawberry_django.order_field
    def organization(
        self,
        info: Info,
        queryset: QuerySet,
        value: auto,
        prefix: str,
    ) -> tuple[QuerySet, list[strawberry_django.Ordering]]:
        """Order by organization name; direction comes from ``value.resolve``."""
        queryset = queryset.annotate(**{f"{prefix}_organization_name": F(f"{prefix}organization__name")})
        return queryset, [value.resolve(f"{prefix}_organization_name")]

    @strawberry_django.order_field
    def bed_count(
        self,
        info: Info,
        queryset: QuerySet,
        value: auto,
        prefix: str,
    ) -> tuple[QuerySet, list[strawberry_django.Ordering]]:
        """Order by the count of beds related to the shelter.

        Uses an isolated correlated subquery rather than a JOIN-based
        ``Count('beds', distinct=True)``.  The subquery is unaffected by any
        M2M JOINs that active filters (cities_served, services, spasServed)
        may have added to the outer queryset, so no DISTINCT deduplication is
        needed and the count is always correct in a single pass.
        Uses a distinct annotation name (``_order_bed_total``) to avoid
        conflicting with the ``_bed_total`` annotation added by the bedCounts
        resolver when both are requested in the same query.
        """
        bed_count_subq = (
            models.Bed.objects.filter(shelter=OuterRef("pk"))
            .order_by()
            .values("shelter")
            .annotate(c=Count("pk"))
            .values("c")
        )
        # Coalesce NULL (no related beds) to 0 so DESC/ASC match bedCounts.total
        # and PostgreSQL does not sort empty shelters first under DESC.
        queryset = queryset.annotate(
            **{
                f"{prefix}_order_bed_total": Coalesce(
                    Subquery(bed_count_subq, output_field=IntegerField()),
                    Value(0),
                )
            }
        )
        return queryset, [value.resolve(f"{prefix}_order_bed_total")]


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
        """Filter beds by their computed status."""
        if not value:
            return queryset, Q()

        q = Q()
        for choice in value:
            q |= BedQuerySet.status_filter_q(choice)
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
        """Filter rooms by their computed status."""
        if not value:
            return queryset, Q()

        q = Q()
        for choice in value:
            q |= RoomQuerySet.status_filter_q(choice)
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
