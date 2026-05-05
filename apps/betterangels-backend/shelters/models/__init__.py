"""Shelter models package — re-exports all models for backward compatibility.

External code should continue importing from ``shelters.models``.
"""

from .lookups import (  # noqa: F401
    SPA,
    Accessibility,
    City,
    Demographic,
    EntryRequirement,
    ExitPolicy,
    Funder,
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
from .media import ExteriorPhoto, InteriorPhoto, MediaLink, Video, upload_path  # noqa: F401
from .reservation import Reservation, ReservationClient  # noqa: F401
from .schedule import Schedule  # noqa: F401
from .service import Service, ServiceCategory  # noqa: F401
from .shelter import Bed, ContactInfo, Room, Shelter, get_fields_with_other_option  # noqa: F401
from .tracked import (  # noqa: F401
    TrackedAccessibility,
    TrackedCity,
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
