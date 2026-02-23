from datetime import datetime
from typing import List, Optional, Tuple, cast

import strawberry
import strawberry_django
from accounts.models import User
from accounts.types import OrganizationType
from common.graphql.types import LatitudeScalar, LongitudeScalar, PhoneNumberScalar
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point, Polygon
from django.contrib.gis.measure import D
from django.core.files.storage import default_storage
from django.db.models import Q, QuerySet
from shelters import models
from shelters.enums import (
    AccessibilityChoices,
    DemographicChoices,
    EntryRequirementChoices,
    FunderChoices,
    GeneralServiceChoices,
    HealthServiceChoices,
    ImmediateNeedChoices,
    ParkingChoices,
    PetChoices,
    RoomStyleChoices,
)
from shelters.enums import ShelterChoices as ShelterTypeChoices
from shelters.enums import (
    ShelterProgramChoices,
    SPAChoices,
    SpecialSituationRestrictionChoices,
    StorageChoices,
    TrainingServiceChoices,
)
from strawberry import ID, Info, asdict, auto
from strawberry_django.auth.utils import get_current_user


@strawberry_django.type(models.ContactInfo)
class ContactInfoType:
    id: ID
    contact_name: auto
    contact_number: PhoneNumberScalar  # type: ignore


@strawberry.type
class ShelterLocationType:
    place: str
    latitude: float
    longitude: float


@strawberry.type
class ShelterPhotoType:
    id: ID
    created_at: datetime
    file: strawberry_django.DjangoFileType


@strawberry_django.type(models.Demographic)
class DemographicType:
    name: Optional[DemographicChoices]


@strawberry_django.type(models.SpecialSituationRestriction)
class SpecialSituationRestrictionType:
    name: Optional[SpecialSituationRestrictionChoices]


@strawberry_django.type(models.ShelterType)
class ShelterTypeType:
    name: Optional[ShelterTypeChoices]


@strawberry_django.type(models.RoomStyle)
class RoomStyleType:
    name: Optional[RoomStyleChoices]


@strawberry_django.type(models.Accessibility)
class AccessibilityType:
    name: Optional[AccessibilityChoices]


@strawberry_django.type(models.Storage)
class StorageType:
    name: Optional[StorageChoices]


@strawberry_django.type(models.Pet)
class PetType:
    name: Optional[PetChoices]


@strawberry_django.type(models.Parking)
class ParkingType:
    name: Optional[ParkingChoices]


@strawberry_django.type(models.ImmediateNeed)
class ImmediateNeedType:
    name: Optional[ImmediateNeedChoices]


@strawberry_django.type(models.GeneralService)
class GeneralServiceType:
    name: Optional[GeneralServiceChoices]


@strawberry_django.type(models.HealthService)
class HealthServiceType:
    name: Optional[HealthServiceChoices]


@strawberry_django.type(models.TrainingService)
class TrainingServiceType:
    name: Optional[TrainingServiceChoices]


@strawberry_django.type(models.EntryRequirement)
class EntryRequirementType:
    name: Optional[EntryRequirementChoices]


@strawberry_django.type(models.City)
class CityType:
    id: auto
    name: auto


@strawberry_django.type(models.SPA)
class SPAType:
    name: Optional[SPAChoices]


@strawberry_django.type(models.ShelterProgram)
class ShelterProgramType:
    name: Optional[ShelterProgramChoices]


@strawberry_django.type(models.Funder)
class FunderType:
    name: Optional[FunderChoices]


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
            value.south_lat,
            value.east_lng,
            value.north_lat,
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


@strawberry.type
class TimeRange:
    start: Optional[datetime]
    end: Optional[datetime]


@strawberry.type
class ShelterTypeMixin:
    id: ID
    accessibility: List[AccessibilityType]
    additional_contacts: List[ContactInfoType]
    add_notes_sleeping_details: Optional[str]
    add_notes_shelter_details: Optional[str]
    bed_fees: Optional[str]
    cities: List[CityType]
    city_council_district: auto
    curfew: auto
    demographics: List[DemographicType]
    demographics_other: auto
    description: str
    email: auto
    entry_info: Optional[str]
    entry_requirements: List[EntryRequirementType]
    exterior_photos: List[ShelterPhotoType]
    funders: List[FunderType]
    funders_other: auto
    general_services: List[GeneralServiceType]
    health_services: List[HealthServiceType]
    immediate_needs: List[ImmediateNeedType]
    instagram: auto
    interior_photos: List[ShelterPhotoType]
    location: Optional[ShelterLocationType]
    max_stay: auto
    name: auto
    on_site_security: auto
    organization: Optional[OrganizationType]
    other_rules: Optional[str]
    other_services: Optional[str]
    overall_rating: auto
    parking: List[ParkingType]
    pets: List[PetType]
    phone: Optional[PhoneNumberScalar]  # type: ignore
    program_fees: Optional[str]
    room_styles: List[RoomStyleType]
    room_styles_other: auto
    shelter_programs: List[ShelterProgramType]
    shelter_programs_other: auto
    shelter_types: List[ShelterTypeType]
    shelter_types_other: auto
    spa: List[SPAType]
    special_situation_restrictions: List[SpecialSituationRestrictionType]
    status: auto
    storage: List[StorageType]
    subjective_review: Optional[str]
    supervisorial_district: auto
    total_beds: auto
    training_services: List[TrainingServiceType]
    website: auto

    @strawberry_django.field
    def hero_image(self, root: models.Shelter) -> Optional[str]:
        """Return the hero image URL.

        The file path is annotated on the queryset via
        ``ShelterQuerySet.with_hero_image_file()`` so this resolver
        just reads the annotation — zero extra queries.
        """
        file_path = getattr(root, "_hero_image_file", None)
        if file_path:
            return default_storage.url(file_path)
        return None

    @strawberry_django.field
    def distance_in_miles(self, root: models.Shelter) -> Optional[float]:
        if distance := getattr(root, "distance", None):
            return float(distance.mi)

        return None

    @strawberry_django.field
    def operating_hours(self, root: models.Shelter) -> Optional[List[Optional[TimeRange]]]:
        ranges: List[Optional[TimeRange]] = []
        if root.operating_hours:
            for start, end in root.operating_hours:
                if start is not None or end is not None:
                    ranges.append(TimeRange(start=start, end=end))
                else:
                    ranges.append(None)
        return ranges or None


@strawberry_django.type(models.Shelter, filters=ShelterFilter, ordering=ShelterOrder)
class ShelterType(ShelterTypeMixin):
    @classmethod
    def get_queryset(cls, queryset: QuerySet, info: Info) -> QuerySet[models.Shelter]:
        return models.Shelter.objects.approved().with_hero_image_file()


@strawberry_django.type(models.Shelter, filters=ShelterFilter, ordering=ShelterOrder)
class AdminShelterType(ShelterTypeMixin):
    @classmethod
    def get_queryset(cls, queryset: QuerySet, info: Info) -> QuerySet[models.Shelter]:
        user = info.context.request.user
        return models.Shelter.admin_objects.for_user(user).with_hero_image_file()
