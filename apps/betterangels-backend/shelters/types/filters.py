"""Filter and ordering types for shelter queries."""

from typing import List, Optional, Tuple, cast

import strawberry
import strawberry_django
from accounts.models import User
from common.graphql.types import LatitudeScalar, LongitudeScalar
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point, Polygon
from django.contrib.gis.measure import D
from django.db.models import Q, QuerySet
from shelters import models
from shelters.enums import (
    DemographicChoices,
    ParkingChoices,
    PetChoices,
    RoomStyleChoices,
)
from shelters.enums import ShelterChoices as ShelterTypeChoices
from shelters.enums import SpecialSituationRestrictionChoices
from strawberry import ID, Info, asdict, auto
from strawberry_django.auth.utils import get_current_user


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

        return queryset.filter(geolocation__contained=polygon), Q()

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
