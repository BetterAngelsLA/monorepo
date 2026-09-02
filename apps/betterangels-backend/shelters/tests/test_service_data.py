"""Canary tests keeping service write payloads in sync with GraphQL inputs.

Each payload in :mod:`shelters.services.data` must mirror its GraphQL input
type field-for-field (the resolver builds payloads from inputs with
:func:`shelters.schema._build_payload`). If an input field is added, renamed
or removed without the payload being updated, the service would silently drop
or reject it — these tests make that drift a loud failure instead.
"""

from dataclasses import fields

from shelters.services import data as payloads
from shelters.types.inputs import (
    CreateBedInput,
    CreateReservationInput,
    CreateRoomInput,
    ReservationClientInput,
    UpdateBedInput,
    UpdateReservationInput,
    UpdateRoomInput,
)


def _names(cls: type) -> set[str]:
    return {f.name for f in fields(cls)}


def test_bed_create_payload_mirrors_input() -> None:
    assert _names(payloads.BedCreateData) == _names(CreateBedInput)


def test_bed_update_payload_mirrors_input() -> None:
    assert _names(payloads.BedUpdateData) == _names(UpdateBedInput) | {"bed_id"}


def test_room_create_payload_mirrors_input() -> None:
    assert _names(payloads.RoomCreateData) == _names(CreateRoomInput)


def test_room_update_payload_mirrors_input() -> None:
    assert _names(payloads.RoomUpdateData) == _names(UpdateRoomInput) | {"room_id"}


def test_reservation_create_payload_mirrors_input() -> None:
    assert _names(payloads.ReservationCreateData) == _names(CreateReservationInput)


def test_reservation_update_payload_mirrors_input() -> None:
    assert _names(payloads.ReservationUpdateData) == _names(UpdateReservationInput) | {"reservation_id"}


def test_reservation_client_payload_mirrors_input() -> None:
    assert _names(payloads.ReservationClientData) == _names(ReservationClientInput)
