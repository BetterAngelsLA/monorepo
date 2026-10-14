"""Shelter models package — re-exports all models for backward compatibility.

External code should continue importing from ``shelters.models``.
"""

from .availability import ShelterAvailability  # noqa: F401
from .lookups import (
    SPA,
    Accessibility,
    City,
    Demographic,  # noqa: F401
    EntryRequirement,
    ExitPolicy,
    Funder,
    MedicalNeed,
    Parking,
    Pet,
    ReferralRequirement,
    RoomStyle,
    ShelterProgram,
    ShelterType,
    SpecialSituationRestriction,
    Storage,
    VaccinationRequirement,
)
from .media import (
    ExteriorShelterPhoto,
    InteriorShelterPhoto,  # noqa: F401
    MediaLink,
    ShelterPhoto,
    Video,
    upload_path,
)
from .reservation import Reservation, ReservationClient  # noqa: F401
from .schedule import Schedule  # noqa: F401
from .service import Service, ServiceCategory  # noqa: F401
from .shelter import (
    Bed,
    ContactInfo,
    Room,
    Shelter,  # noqa: F401
    get_fields_with_other_option,
)
from .tracked import (
    TrackedAccessibility,
    TrackedCity,  # noqa: F401
    TrackedDemographic,
    TrackedEntryRequirement,
    TrackedFunder,
    TrackedParking,
    TrackedPet,
    TrackedRoomStyle,
    TrackedShelterProgram,
    TrackedShelterType,
    TrackedSPA,
    TrackedSpecialSituationRestriction,
    TrackedStorage,
    TrackedVaccinationRequirement,
)
