"""A minimal Mapbox Vector Tile reader, for tests only.

There is no MVT codec in the project's dependencies — ``mapbox_vector_tile``, ``shapely`` and
``protobuf`` are all absent — and pulling a dependency in to read a tile in a test is not the
trade this wants. So the protobuf this needs lives here: a hundred lines that walk the
length-delimited messages the MVT spec defines and yield each feature's properties and geometry.

Geometry is decoded as the tile-local integer coordinates ``ST_AsMVTGeom`` wrote, in the tile's
4096-unit extent. Each ring is closed (the closing point is appended when the stream emits
``ClosePath``, which is how MVT encodes it), so a caller can assert a cell polygon's vertex
count, closure, and position without a protobuf dependency.
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
_FEATURE_GEOMETRY = 4

#: MVT geometry command ids (the low three bits of a command integer). ``ClosePath`` is **7**,
#: not 3, and carries no parameters.
_MOVE_TO = 1
_LINE_TO = 2
_CLOSE_PATH = 7

#: The key each feature's decoded geometry is filed under, alongside its properties.
GEOMETRY = "geometry"


def decode(data: bytes) -> dict[str, list[dict[str, Any]]]:
    """``{layer name: [feature, …]}`` for one encoded tile.

    Each feature is a plain dict of its properties plus a ``"geometry"`` key: a list of rings,
    each a list of ``(x, y)`` integer pairs in the tile's coordinate space (4096 across).
    """
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
        geometry_commands: list[int] = []
        for field, wire, value in _walk(raw):
            if wire == _LENGTH_DELIMITED and field in (_FEATURE_TAGS, _FEATURE_GEOMETRY):
                position = 0
                packed: list[int] = []
                while position < len(value):
                    number, position = _varint(value, position)
                    packed.append(number)
                if field == _FEATURE_TAGS:
                    tags = packed
                else:
                    geometry_commands = packed
        # Tags alternate key index, value index; the pair count is always even.
        feature: dict[str, Any] = {keys[tags[i]]: values[tags[i + 1]] for i in range(0, len(tags) - 1, 2)}
        feature[GEOMETRY] = decode_geometry(geometry_commands)
        features.append(feature)
    return name, features


def decode_geometry(commands: list[int]) -> list[list[tuple[int, int]]]:
    """The packed command stream as a list of rings, each closed.

    Commands are ``(id | count << 3)``; a ``MoveTo`` starts a ring, a ``LineTo`` extends it,
    and ``ClosePath`` closes it by repeating the first point. Coordinates are zigzag deltas
    from the previous point, starting at the origin.
    """
    rings: list[list[tuple[int, int]]] = []
    x = y = 0
    position = 0
    while position < len(commands):
        command = commands[position]
        position += 1
        command_id, count = command & 0x07, command >> 3
        if command_id == _CLOSE_PATH:
            if rings and rings[-1] and rings[-1][0] != rings[-1][-1]:
                rings[-1].append(rings[-1][0])
            continue
        for _ in range(count):
            x += _zigzag(commands[position])
            y += _zigzag(commands[position + 1])
            position += 2
            if command_id == _MOVE_TO:
                rings.append([(x, y)])
            else:
                rings[-1].append((x, y))
    return rings


def _zigzag(value: int) -> int:
    """The parameter encoding: unsigned integer to signed delta."""
    return (value >> 1) ^ -(value & 1)


def _decode_value(data: bytes) -> Any:
    """The one set field of a ``Value`` message. `count` is a bigint, so ``int_value``."""
    for field, _wire, value in _walk(data):
        if field == 1:
            return value.decode("utf-8")
        if field == 2:
            return struct.unpack("<f", value)[0]
        if field == 3:
            return struct.unpack("<d", value)[0]
        # The Value message is string/float/double/int/uint/sint/bool at 1..7. `int` and `uint`
        # are both plain varints; only `sint` is zigzag. Reading `uint` as `sint` turns a cell's
        # count of 1 into -1, which is how this was caught.
        if field in (4, 5):
            return int(value)
        if field == 6:
            return _zigzag(int(value))
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
