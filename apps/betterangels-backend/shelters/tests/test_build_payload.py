"""Unit tests for the resolver→payload seam (:func:`shelters.schema._build_payload`).

Pins the mapping semantics that GraphQL mutation tests only exercise
indirectly: ``UNSET`` dropping, Strawberry's ``Some()`` Maybe-wrapper
unwrapping, explicit nulls, nested-list conversion and ``extra`` key
injection. Uses tiny local input/payload shapes so the tests stay hermetic
and read clearly.
"""

from dataclasses import dataclass
from typing import Optional

import pytest
import strawberry
from strawberry import Maybe, Some, UNSET

from shelters.schema import _build_payload


@strawberry.input
class ClientItemInput:
    client_profile_id: int
    is_primary: bool = False


@strawberry.input
class SampleWriteInput:
    name: Maybe[str] = UNSET
    note: Maybe[str | None] = UNSET
    tags: Maybe[list[str] | None] = UNSET
    items: Optional[list[ClientItemInput]] = None


@dataclass(frozen=True)
class ClientItemData:
    client_profile_id: int
    is_primary: bool = False


@dataclass(frozen=True)
class SampleWriteData:
    target_id: int
    name: Optional[str] = None
    note: Optional[str] = None
    tags: Optional[list[str]] = None
    items: Optional[list[ClientItemData]] = None


def test_absent_fields_drop_to_defaults_and_extra_supplies_target() -> None:
    payload = _build_payload(SampleWriteData, SampleWriteInput(), extra={"target_id": 7})

    assert payload.target_id == 7
    assert payload.name is None
    assert payload.note is None
    assert payload.tags is None
    assert payload.items is None


def test_some_wrapped_maybe_values_are_unwrapped() -> None:
    raw = SampleWriteInput(name=Some("Alice"), tags=Some(["a", "b"]))

    payload = _build_payload(SampleWriteData, raw, extra={"target_id": 7})

    assert payload.name == "Alice"
    assert payload.tags == ["a", "b"]


def test_explicit_null_is_carried_as_none() -> None:
    payload = _build_payload(SampleWriteData, SampleWriteInput(note=None), extra={"target_id": 7})

    assert payload.note is None


def test_nested_list_is_converted_itemwise() -> None:
    raw = SampleWriteInput(items=[ClientItemInput(client_profile_id=1, is_primary=True)])

    payload = _build_payload(
        SampleWriteData,
        raw,
        nested={"items": ClientItemData},
        extra={"target_id": 7},
    )

    assert payload.items == [ClientItemData(client_profile_id=1, is_primary=True)]


def test_missing_required_payload_key_raises() -> None:
    # target_id is neither on the input nor supplied via extra -> loud failure.
    with pytest.raises(TypeError):
        _build_payload(SampleWriteData, SampleWriteInput())
