from datetime import datetime
from typing import List, Optional, Tuple

import strawberry
import strawberry_django
from accounts.types import OrganizationType
from common.graphql.types import PhoneNumberScalar
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.db.models import Prefetch, Q, QuerySet
from shelters.enums import (
    AccessibilityChoices,
    CityChoices,
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
from shelters.models import (
    SPA,
    Accessibility,
    City,
    ContactInfo,
    Demographic,
    EntryRequirement,
    ExteriorPhoto,
    Funder,
    GeneralService,
    HealthService,
    ImmediateNeed,
    InteriorPhoto,
    Parking,
    Pet,
    RoomStyle,
    Shelter,
    ShelterProgram,
)
from shelters.models import ShelterType as ShelterKind
from shelters.models import (
    SpecialSituationRestriction,
    Storage,
    TrainingService,
)
from strawberry import ID, asdict, auto


@strawberry_django.type(ContactInfo)
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


@strawberry_django.type(Demographic)
class DemographicType:
    name: Optional[DemographicChoices]


@strawberry_django.type(SpecialSituationRestriction)
class SpecialSituationRestrictionType:
    name: Optional[SpecialSituationRestrictionChoices]


@strawberry_django.type(ShelterKind)
class ShelterTypeType:
    name: Optional[ShelterTypeChoices]


@strawberry_django.type(RoomStyle)
class RoomStyleType:
    name: Optional[RoomStyleChoices]


@strawberry_django.type(Accessibility)
class AccessibilityType:
    name: Optional[AccessibilityChoices]


@strawberry_django.type(Storage)
class StorageType:
    name: Optional[StorageChoices]


@strawberry_django.type(Pet)
class PetType:
    name: Optional[PetChoices]


@strawberry_django.type(Parking)
class ParkingType:
    name: Optional[ParkingChoices]


@strawberry_django.type(ImmediateNeed)
class ImmediateNeedType:
    name: Optional[ImmediateNeedChoices]


@strawberry_django.type(GeneralService)
class GeneralServiceType:
    name: Optional[GeneralServiceChoices]


@strawberry_django.type(HealthService)
class HealthServiceType:
    name: Optional[HealthServiceChoices]


@strawberry_django.type(TrainingService)
class TrainingServiceType:
    name: Optional[TrainingServiceChoices]


@strawberry_django.type(EntryRequirement)
class EntryRequirementType:
    name: Optional[EntryRequirementChoices]


@strawberry_django.type(City)
class CityType:
    name: Optional[CityChoices]


@strawberry_django.type(SPA)
class SPAType:
    name: Optional[SPAChoices]


@strawberry_django.type(ShelterProgram)
class ShelterProgramType:
    name: Optional[ShelterProgramChoices]


@strawberry_django.type(Funder)
class FunderType:
    name: Optional[FunderChoices]


@strawberry.input
class GeolocationInput:
    latitude: float
    longitude: float
    range_in_miles: Optional[int]


@strawberry.input
class ShelterPropertyInput:
    pets: Optional[List[PetChoices]] = None
    demographics: Optional[List[DemographicChoices]] = None
    special_situation_restrictions: Optional[List[SpecialSituationRestrictionChoices]] = None
    shelter_types: Optional[List[ShelterTypeChoices]] = None
    room_styles: Optional[List[RoomStyleChoices]] = None
    parking: Optional[List[ParkingChoices]] = None


@strawberry_django.filters.filter(Shelter)
class ShelterFilter:
    @strawberry_django.filter_field
    def properties(
        self, queryset: QuerySet, value: Optional[ShelterPropertyInput], prefix: str
    ) -> Tuple[QuerySet[Shelter], Q]:
        if value is None:
            return queryset, Q()

        value_dict = asdict(value)
        filters = {f"{k}__name__in": v for k, v in value_dict.items() if v is not None}

        return queryset.filter(**filters).distinct(), Q()

    @strawberry_django.filter_field
    def geolocation(
        self, queryset: QuerySet, value: Optional[GeolocationInput], prefix: str
    ) -> Tuple[QuerySet[Shelter], Q]:
        if value is None:
            return queryset, Q()

        reference_point = Point(x=value.longitude, y=value.latitude, srid=4326)

        queryset = (
            queryset.filter(
                geolocation__dwithin=(
                    reference_point,
                    D(mi=value.range_in_miles),
                )
            )
            .annotate(distance=Distance("geolocation", reference_point))
            .order_by("distance")
        )

        return queryset, Q()


@strawberry_django.ordering.order(Shelter)
class ShelterOrder:
    name: auto


@strawberry_django.type(Shelter, filters=ShelterFilter, order=ShelterOrder)  # type: ignore
class ShelterType:
    id: ID
    accessibility: List[AccessibilityType]
    additional_contacts: List[ContactInfoType]
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
    phone: PhoneNumberScalar  # type: ignore
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

    _exterior_photos: Optional[List[ShelterPhotoType]] = None
    _interior_photos: Optional[List[ShelterPhotoType]] = None

    # NOTE: This is a temporary workaround because Shelter specced without a hero image.
    # Will remove once we add a hero_image field to the Shelter model.
    @strawberry_django.field(
        prefetch_related=[
            lambda x: Prefetch(
                "exterior_photos",
                queryset=ExteriorPhoto.objects.filter(),
                to_attr="_exterior_photos",
            ),
            lambda x: Prefetch(
                "interior_photos",
                queryset=InteriorPhoto.objects.filter(),
                to_attr="_interior_photos",
            ),
        ],
    )
    def hero_image(self, root: Shelter) -> Optional[str]:
        photo = next(
            (photos[0] for photos in (self._exterior_photos, self._interior_photos) if photos),
            None,
        )

        return str(photo.file.url) if photo else None

    @strawberry_django.field
    def distance_in_miles(self, root: Shelter) -> Optional[float]:
        if distance := getattr(root, "distance", None):
            return float(distance.mi)

        return None
