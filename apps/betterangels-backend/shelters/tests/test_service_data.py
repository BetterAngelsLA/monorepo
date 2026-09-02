"""Canary tests keeping service write payloads in sync with GraphQL inputs.

Each payload in :mod:`shelters.services.data` must mirror its GraphQL input
field-for-field (the resolver builds payloads from inputs with
:func:`shelters.schema._build_payload`); update payloads additionally carry
the target entity id, which arrives as the mutation's separate ``id``
argument, not as an input field. If an input field is added, renamed or
removed without the payload being updated, the service would silently drop
or reject it — these tests make that drift a loud failure instead.
"""

from dataclasses import dataclass, fields

import pytest

from shelters.models import Bed
from shelters.services import data as payloads
from shelters.services.utils import _split_payload
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
    input_fields = _names(UpdateBedInput)
    assert _names(payloads.BedUpdateData) == input_fields | {"bed_id"}
    assert "bed_id" not in input_fields  # id arrives as the mutation arg, not an input field


def test_room_create_payload_mirrors_input() -> None:
    assert _names(payloads.RoomCreateData) == _names(CreateRoomInput)


def test_room_update_payload_mirrors_input() -> None:
    input_fields = _names(UpdateRoomInput)
    assert _names(payloads.RoomUpdateData) == input_fields | {"room_id"}
    assert "room_id" not in input_fields


def test_reservation_create_payload_mirrors_input() -> None:
    assert _names(payloads.ReservationCreateData) == _names(CreateReservationInput)


def test_reservation_update_payload_mirrors_input() -> None:
    input_fields = _names(UpdateReservationInput)
    assert _names(payloads.ReservationUpdateData) == input_fields | {"reservation_id"}
    assert "reservation_id" not in input_fields


def test_reservation_client_payload_mirrors_input() -> None:
    assert _names(payloads.ReservationClientData) == _names(ReservationClientInput)


def test_split_payload_rejects_non_model_scalar_keys() -> None:
    """A payload key that is not a settable Bed attribute must fail loudly
    (it would otherwise become a phantom instance attribute on update)."""

    @dataclass
    class BogusUpdateData:
        phantom: str = "x"  # not a Bed field or FK attribute

    with pytest.raises(ValueError, match="phantom"):
        _split_payload(BogusUpdateData(), set(), model=Bed)
