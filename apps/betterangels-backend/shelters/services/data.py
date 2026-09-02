"""Framework-agnostic write payloads for shelter mutations.

Plain frozen dataclasses (no Strawberry imports) that cross the resolver →
service boundary. Resolvers build them from GraphQL inputs via the
``_build()`` helper in :mod:`shelters.schema`; services and unit tests can
construct them directly, which keeps the service layer Strawberry-free and
callable from any entry point.

Presence semantics
------------------
An input field the client did not send (``UNSET``) is dropped by ``_build()``
and falls back to the payload default (``None``). For bed/room/reservation the
underlying services treat an explicit null the same as an absent field (both
mean "do not set / leave unchanged"), so plain ``None`` defaults are exactly
equivalent and no presence sentinel is required. (Shelter updates are the
exception and keep their dict-based path.)

Each payload mirrors one GraphQL input type field-for-field; the mirror
canary tests (``test_service_data.py``) keep the two from drifting.
"""

from dataclasses import dataclass
from datetime import date, datetime

from shelters.enums import (
    AccessibilityChoices,
    BedTypeChoices,
    DemographicChoices,
    FunderChoices,
    MedicalNeedChoices,
    PetChoices,
    ReservationStatusChoices,
    RoomStyleChoices,
)


@dataclass(frozen=True)
class BedCreateData:
    shelter_id: int | str
    room_id: int | str | None = None
    accessibility: list[AccessibilityChoices] | None = None
    b7: bool | None = None
    demographics: list[DemographicChoices] | None = None
    fees: int | None = None
    funders: list[FunderChoices] | None = None
    last_cleaned_inspected: datetime | None = None
    last_cleaned: datetime | None = None
    maintenance_flag: bool | None = None
    medical_needs: list[MedicalNeedChoices] | None = None
    name: str | None = None
    pets: list[PetChoices] | None = None
    status_notes: str | None = None
    storage: bool | None = None
    type: BedTypeChoices | None = None


@dataclass(frozen=True)
class BedUpdateData:
    bed_id: int | str
    room_id: int | str | None = None
    accessibility: list[AccessibilityChoices] | None = None
    b7: bool | None = None
    demographics: list[DemographicChoices] | None = None
    fees: int | None = None
    funders: list[FunderChoices] | None = None
    last_cleaned_inspected: datetime | None = None
    last_cleaned: datetime | None = None
    maintenance_flag: bool | None = None
    medical_needs: list[MedicalNeedChoices] | None = None
    name: str | None = None
    pets: list[PetChoices] | None = None
    status_notes: str | None = None
    storage: bool | None = None
    type: BedTypeChoices | None = None


@dataclass(frozen=True)
class RoomCreateData:
    shelter_id: int | str
    name: str
    accessibility: list[AccessibilityChoices] | None = None
    amenities: str | None = None
    demographics: list[DemographicChoices] | None = None
    funders: list[FunderChoices] | None = None
    last_cleaned_inspected: datetime | None = None
    maintenance_flag: bool | None = None
    medical_respite: bool = False
    notes: str | None = None
    pets: list[PetChoices] | None = None
    storage: bool | None = None
    type: RoomStyleChoices | None = None
    type_other: str | None = None


@dataclass(frozen=True)
class RoomUpdateData:
    room_id: int | str
    accessibility: list[AccessibilityChoices] | None = None
    amenities: str | None = None
    demographics: list[DemographicChoices] | None = None
    funders: list[FunderChoices] | None = None
    last_cleaned_inspected: datetime | None = None
    last_cleaned: datetime | None = None
    maintenance_flag: bool | None = None
    medical_respite: bool | None = None
    name: str | None = None
    notes: str | None = None
    pets: list[PetChoices] | None = None
    storage: bool | None = None
    type: RoomStyleChoices | None = None
    type_other: str | None = None


@dataclass(frozen=True)
class ReservationClientData:
    client_profile_id: int | str
    is_primary: bool = False


@dataclass(frozen=True)
class ReservationCreateData:
    clients: list[ReservationClientData]
    room_id: int | str | None = None
    bed_id: int | str | None = None
    checked_in_at: datetime | None = None
    checked_out_at: datetime | None = None
    duration: int | None = None
    notes: str | None = None
    start_date: date | None = None
    status: ReservationStatusChoices | None = None


@dataclass(frozen=True)
class ReservationUpdateData:
    reservation_id: int | str
    clients: list[ReservationClientData] | None = None
    room_id: int | str | None = None
    bed_id: int | str | None = None
    checked_in_at: datetime | None = None
    checked_out_at: datetime | None = None
    duration: int | None = None
    notes: str | None = None
    start_date: date | None = None
    status: ReservationStatusChoices | None = None
