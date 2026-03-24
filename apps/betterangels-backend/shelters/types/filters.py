"""Filter and ordering types for shelter queries."""

import datetime
from typing import List, Optional, Tuple, cast
from zoneinfo import ZoneInfo

import strawberry
import strawberry_django
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point, Polygon
from django.contrib.gis.measure import D
from django.db.models import Q, QuerySet
from strawberry import ID, Info, asdict, auto
from strawberry_django.auth.utils import get_current_user

from accounts.models import User
from common.graphql.types import LatitudeScalar, LongitudeScalar
from shelters import models
from shelters.enums import (
    AccessibilityChoices,
    BedStatusChoices,
    BedTypeChoices,
    DemographicChoices,
    FunderChoices,
    MedicalNeedChoices,
    ParkingChoices,
    PetChoices,
    RoomStatusChoices,
    RoomStyleChoices,
    ScheduleTypeChoices,
)
from shelters.enums import ShelterChoices as ShelterTypeChoices
from shelters.enums import SpecialSituationRestrictionChoices
from shelters.selectors import shelters_open_at

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
    special_situation_restrictions: Optional[List[SpecialSituationRestrictionChoices]] = None
    shelter_types: Optional[List[ShelterTypeChoices]] = None
    room_styles: Optional[List[RoomStyleChoices]] = None
    parking: Optional[List[ParkingChoices]] = None


@strawberry_django.filter_type(models.Shelter)
class ShelterFilter:
    @strawberry_django.filter_field
    def name(self, info: Info, value: Optional[str], prefix: str) -> Q:
        if not value:
            return Q()
        return Q(**{f"{prefix}name__icontains": value})

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


@strawberry_django.order_type(models.Shelter, one_of=False)
class ShelterOrder:
    name: auto
    created_at: auto


@strawberry_django.filter_type(models.Bed)
class BedFilter:
    @strawberry_django.filter_field
    def shelter_id(self, info: Info, value: Optional[ID], prefix: str) -> Q:
        if value is None:
            return Q()
        return Q(**{f"{prefix}shelter_id": value})

    @strawberry_django.filter_field
    def status(self, info: Info, value: Optional[List[BedStatusChoices]], prefix: str) -> Q:
        if not value:
            return Q()
        return Q(**{f"{prefix}status__in": value})

    @strawberry_django.filter_field
    def demographics(
        self, queryset: QuerySet, value: Optional[List[DemographicChoices]], prefix: str
    ) -> Tuple[QuerySet, Q]:
        if not value:
            return queryset, Q()
        return queryset.filter(**{f"{prefix}demographics__name__in": value}).distinct(), Q()

    @strawberry_django.filter_field
    def accessibility(
        self, queryset: QuerySet, value: Optional[List[AccessibilityChoices]], prefix: str
    ) -> Tuple[QuerySet, Q]:
        if not value:
            return queryset, Q()
        return queryset.filter(**{f"{prefix}accessibility__name__in": value}).distinct(), Q()

    @strawberry_django.filter_field
    def bed_type(self, info: Info, value: Optional[List[BedTypeChoices]], prefix: str) -> Q:
        if not value:
            return Q()
        return Q(**{f"{prefix}bed_type__in": value})

    @strawberry_django.filter_field
    def funders(self, queryset: QuerySet, value: Optional[List[FunderChoices]], prefix: str) -> Tuple[QuerySet, Q]:
        if not value:
            return queryset, Q()
        return queryset.filter(**{f"{prefix}funders__name__in": value}).distinct(), Q()

    @strawberry_django.filter_field
    def maintenance_flag(self, info: Info, value: Optional[bool], prefix: str) -> Q:
        if value is None:
            return Q()
        return Q(**{f"{prefix}maintenance_flag": value})

    @strawberry_django.filter_field
    def medical_needs(self, info: Info, value: Optional[List[MedicalNeedChoices]], prefix: str) -> Q:
        if not value:
            return Q()
        return Q(**{f"{prefix}medical_needs__in": value})

    @strawberry_django.filter_field
    def pets(self, queryset: QuerySet, value: Optional[List[PetChoices]], prefix: str) -> Tuple[QuerySet, Q]:
        if not value:
            return queryset, Q()
        return queryset.filter(**{f"{prefix}pets__name__in": value}).distinct(), Q()


@strawberry_django.filter_type(models.Room)
class RoomFilter:
    @strawberry_django.filter_field
    def shelter_id(self, info: Info, value: Optional[ID], prefix: str) -> Q:
        if value is None:
            return Q()
        return Q(**{f"{prefix}shelter_id": value})

    @strawberry_django.filter_field
    def status(self, info: Info, value: Optional[List[RoomStatusChoices]], prefix: str) -> Q:
        if not value:
            return Q()
        return Q(**{f"{prefix}status__in": value})

    @strawberry_django.filter_field
    def room_type(self, info: Info, value: Optional[List[RoomStyleChoices]], prefix: str) -> Q:
        if not value:
            return Q()
        return Q(**{f"{prefix}room_type__in": value})
