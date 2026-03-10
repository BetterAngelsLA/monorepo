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
    CreateShelterInput,
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
    GeneralServiceType,
    HealthServiceType,
    ImmediateNeedType,
    ParkingType,
    PetType,
    RoomStyleType,
    ScheduleType,
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
    "GeneralServiceType",
    "HealthServiceType",
    "ImmediateNeedType",
    "ParkingType",
    "PetType",
    "RoomStyleType",
    "ScheduleType",
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
    "CreateShelterInput",
    "ScheduleInput",
    "ShelterLocationInput",
    # outputs
    "AdminShelterType",
    "BedType",
    "ShelterLocationType",
    "ShelterPhotoType",
    "ShelterType",
    "ShelterTypeMixin",
]
