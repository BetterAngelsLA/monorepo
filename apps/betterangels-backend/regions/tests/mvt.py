"""A minimal Mapbox Vector Tile reader, for tests only.

There is no MVT codec in the project's dependencies — ``mapbox_vector_tile``, ``shapely`` and
``protobuf`` are all absent — and pulling a dependency in to read a tile in a test is not the
trade this wants. So the protobuf this needs lives here: about sixty lines that walk the
length-delimited messages the MVT spec defines and yield each feature's *properties*.

Geometry is deliberately not decoded. `ST_AsMVTGeom`'s output is a packed command stream
(``MoveTo``/``LineTo``/``ClosePath``), and every assertion these tests make is about the
``count`` a cell carries and how many cells there are, not about where their vertices landed.
Decoding half of it and implying the other half was checked would be worse than not decoding
it at all.
"""

from __future__ import annotations

import struct
from typing import Any

#: Protobuf wire types. Only these four occur in an MVT.
_VARINT = 0
_SIXTY_FOUR_BIT = 1
_LENGTH_DELIMITED = 2
_THIRTY_TWO_BIT = 5

# Field numbers, from the MVT spec's ``vector_tile.proto``. Note that the ``Layer`` message
# numbers its members one lower than the ``Feature`` message does — name/features/keys/values
# are 1/2/3/4, while a feature's id/tags/type/geometry are 1/2/3/4 over a different set — which
# is an easy way to be off by one in both directions at once.
_TILE_LAYER = 3
_LAYER_NAME = 1
_LAYER_FEATURE = 2
_LAYER_KEY = 3
_LAYER_VALUE = 4
_FEATURE_TAGS = 2


def decode(data: bytes) -> dict[str, list[dict[str, Any]]]:
    """``{layer name: [feature properties, …]}`` for one encoded tile."""
    layers: dict[str, list[dict[str, Any]]] = {}
    for field, wire, value in _walk(data):
        if field == _TILE_LAYER and wire == _LENGTH_DELIMITED:
            name, features = _decode_layer(value)
            layers[name] = features
    return layers


def _decode_layer(data: bytes) -> tuple[str, list[dict[str, Any]]]:
    name = ""
    keys: list[str] = []
    values: list[Any] = []
    raw_features: list[bytes] = []

    for field, wire, value in _walk(data):
        if wire != _LENGTH_DELIMITED:
            continue
        if field == _LAYER_NAME:
            name = value.decode("utf-8")
        elif field == _LAYER_FEATURE:
            raw_features.append(value)
        elif field == _LAYER_KEY:
            keys.append(value.decode("utf-8"))
        elif field == _LAYER_VALUE:
            values.append(_decode_value(value))

    features: list[dict[str, Any]] = []
    for raw in raw_features:
        tags: list[int] = []
        for field, wire, value in _walk(raw):
            if field != _FEATURE_TAGS:
                continue
            if wire == _LENGTH_DELIMITED:
                position = 0
                while position < len(value):
                    tag, position = _varint(value, position)
                    tags.append(tag)
            else:
                tags.append(int(value))
        # Tags alternate key index, value index; the pair count is always even.
        features.append({keys[tags[i]]: values[tags[i + 1]] for i in range(0, len(tags) - 1, 2)})
    return name, features


def _decode_value(data: bytes) -> Any:
    """The one set field of a ``Value`` message. `count` is a bigint, so ``int_value``."""
    for field, _wire, value in _walk(data):
        if field == 1:
            return value.decode("utf-8")
        if field == 2:
            return struct.unpack("<f", value)[0]
        if field == 3:
            return struct.unpack("<d", value)[0]
        if field in (4, 5):
            return int(value)
        if field == 6:
            return (int(value) >> 1) ^ -(int(value) & 1)
        if field == 7:
            return bool(value)
    return None


def _varint(data: bytes, position: int) -> tuple[int, int]:
    result = 0
    shift = 0
    while True:
        byte = data[position]
        position += 1
        result |= (byte & 0x7F) << shift
        if not byte & 0x80:
            return result, position
        shift += 7


def _walk(data: bytes):  # type: ignore[no-untyped-def]
    """Yield ``(field number, wire type, value)`` for every field in one message.

    ``value`` is an ``int`` for a varint and ``bytes`` for the length-delimited, 64-bit and
    32-bit forms.
    """
    position = 0
    while position < len(data):
        key, position = _varint(data, position)
        field, wire = key >> 3, key & 0x07
        if wire == _VARINT:
            value, position = _varint(data, position)
            yield field, wire, value
        elif wire == _SIXTY_FOUR_BIT:
            yield field, wire, data[position : position + 8]
            position += 8
        elif wire == _LENGTH_DELIMITED:
            length, position = _varint(data, position)
            yield field, wire, data[position : position + length]
            position += length
        elif wire == _THIRTY_TWO_BIT:
            yield field, wire, data[position : position + 4]
            position += 4
        else:
            raise ValueError(f"unsupported protobuf wire type {wire} in an MVT")
