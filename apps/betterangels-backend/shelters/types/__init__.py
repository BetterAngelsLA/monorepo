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
    PendingServiceInput,
    ScheduleInput,
    ShelterLocationInput,
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
    "PendingServiceInput",
    "ScheduleInput",
    "ShelterLocationInput",
    # outputs
    "AdminShelterType",
    "BedType",
    "RoomType",
    "ShelterLocationType",
    "ShelterPhotoType",
    "ShelterType",
    "ShelterTypeMixin",
]
