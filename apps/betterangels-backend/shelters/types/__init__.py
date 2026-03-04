"""Shelter GraphQL types, inputs, filters, and ordering definitions."""

from shelters.types.filters import (
    GeolocationInput,
    MapBoundsInput,
    ShelterFilter,
    ShelterOrder,
    ShelterPropertyInput,
)
from shelters.types.inputs import (
    CreateBedInput,
    CreateRoomInput,
    CreateShelterInput,
    ShelterLocationInput,
    TimeRangeInput,
)
from shelters.types.lookups import (
    AccessibilityType,
    CityType,
    ContactInfoType,
    DemographicType,
    EntryRequirementType,
    FunderType,
    GeneralServiceType,
    HealthServiceType,
    ImmediateNeedType,
    ParkingType,
    PetType,
    RoomStyleType,
    ShelterProgramType,
    ShelterTypeType,
    SPAType,
    SpecialSituationRestrictionType,
    StorageType,
    TrainingServiceType,
)
from shelters.types.outputs import (
    AdminShelterType,
    BedType,
    RoomType,
    ShelterLocationType,
    ShelterPhotoType,
    ShelterType,
    ShelterTypeMixin,
    TimeRange,
)

__all__ = [
    # lookups
    "AccessibilityType",
    "CityType",
    "ContactInfoType",
    "DemographicType",
    "EntryRequirementType",
    "FunderType",
    "GeneralServiceType",
    "HealthServiceType",
    "ImmediateNeedType",
    "ParkingType",
    "PetType",
    "RoomStyleType",
    "ShelterProgramType",
    "ShelterTypeType",
    "SPAType",
    "SpecialSituationRestrictionType",
    "StorageType",
    "TrainingServiceType",
    # filters
    "GeolocationInput",
    "MapBoundsInput",
    "ShelterFilter",
    "ShelterOrder",
    "ShelterPropertyInput",
    # inputs
    "CreateBedInput",
    "CreateRoomInput",
    "CreateShelterInput",
    "ShelterLocationInput",
    "TimeRangeInput",
    # outputs
    "AdminShelterType",
    "BedType",
    "RoomType",
    "ShelterLocationType",
    "ShelterPhotoType",
    "ShelterType",
    "ShelterTypeMixin",
    "TimeRange",
]
