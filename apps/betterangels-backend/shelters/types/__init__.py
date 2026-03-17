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
    ScheduleInput,
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
    ParkingType,
    PetType,
    RoomStyleType,
    ScheduleType,
    ServiceCategoryType,
    ServiceType,
    ShelterProgramType,
    ShelterTypeType,
    SPAType,
    SpecialSituationRestrictionType,
    StorageType,
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
    "ParkingType",
    "PetType",
    "RoomStyleType",
    "ScheduleType",
    "ShelterProgramType",
    "ShelterTypeType",
    "SPAType",
    "SpecialSituationRestrictionType",
    "ServiceCategoryType",
    "ServiceType",
    "StorageType",
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
    "ScheduleInput",
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
