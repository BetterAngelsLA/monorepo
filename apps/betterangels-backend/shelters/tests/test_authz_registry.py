"""Registry canary — every shelter Query/Mutation field is protected (ADR 0001).

The shelter cutover removed the ``@hasOrgPerm`` transport extensions: mutations
now gate on ``IsAuthenticated`` and authorize *inside* the service layer, and
list/single reads authorize in each type's ``get_queryset``. That protection is
behavioral, so a future author could add an unguarded field and nothing would
statically complain.

These tests close that gap (finding B5): every field on the shelter ``Query``
and ``Mutation`` types must appear in the registry below with its authorization
route. Adding a field means consciously registering it here — public-by-design
entries are listed explicitly and reviewed as such.

The registry documents the route; the behavioral tests in
``test_grant_cutover.py`` / the mutation suites prove the route actually
enforces the permission.
"""

from typing import Any

from shelters.schema import Mutation, Query

# Fields reachable without a grant/org check — the public approved directory.
PUBLIC_QUERY_FIELDS = frozenset({"shelter", "shelters", "shelter_max_stay"})

# field -> where authorization happens for that read.
QUERY_AUTHZ_ROUTES: dict[str, str] = {
    "operator_shelter": "OperatorShelterType.get_queryset -> shelter_queryset(VIEW)",
    "operator_shelters": "OperatorShelterType.get_queryset -> shelter_queryset(VIEW)",
    "bed": "BedType.get_queryset -> bed_queryset(VIEW)",
    "beds": "BedType.get_queryset -> bed_queryset(VIEW)",
    "reservation": "ReservationType.get_queryset -> reservation_queryset(VIEW)",
    "reservations": "ReservationType.get_queryset -> reservation_queryset(VIEW)",
    "room": "RoomType.get_queryset -> room_queryset(VIEW)",
    "rooms": "RoomType.get_queryset -> room_queryset(VIEW)",
    "shelter_service_categories": "IsAuthenticated; platform reference data",
    "shelter_cities": "IsAuthenticated; platform reference data",
    "shelter_spas": "IsAuthenticated; platform reference data",
    "shelter_occupancy_metrics": "resolver -> shelter_get(VIEW)",
}

# mutation -> where authorization happens for that write.
MUTATION_AUTHZ_ROUTES: dict[str, str] = {
    "create_shelter": "shelter_create -> org gate + require_can(ADD)",
    "update_shelter": "shelter_update -> shelter_get(CHANGE)",
    "create_room": "room_create -> shelter_get(VIEW) + require_can(ADD)",
    "update_room": "room_update -> room_get(CHANGE)",
    "clone_room": "room_clone -> room_queryset(VIEW) + require_can(ADD)",
    "delete_rooms": "room_delete -> room_queryset(DELETE)",
    "create_bed": "bed_create -> shelter_get(VIEW) + require_can(ADD)",
    "update_bed": "bed_update -> bed_get(CHANGE)",
    "clone_bed": "bed_clone -> bed_queryset(VIEW) + require_can(ADD)",
    "delete_beds": "bed_delete -> bed_queryset(DELETE)",
    "create_reservation": "reservation_create -> bed/room_get(VIEW) + require_can(ADD)",
    "update_reservation": "reservation_update -> reservation_get(CHANGE)",
    "delete_reservations": "reservation_delete -> reservation_queryset(DELETE)",
    "generate_shelter_photo_uploads": "shelter_photo.create_presigned_uploads -> shelter_get(CHANGE)",
    "resolve_shelter_photo_uploads": "shelter_photo.resolve_uploads -> shelter_get(CHANGE)",
    "update_shelter_photo": "shelter_photo.update_shelter_photo -> shelter_queryset(CHANGE)",
    "delete_shelter_photos": "shelter_photo.delete_shelter_photos -> shelter_queryset(CHANGE)",
}


def _field_names(cls: Any) -> set[str]:
    return {f.python_name for f in cls.__strawberry_definition__.fields}


def test_every_shelter_query_field_is_registered() -> None:
    actual = _field_names(Query)
    assert actual == PUBLIC_QUERY_FIELDS | set(QUERY_AUTHZ_ROUTES), (
        "Shelter Query field(s) are not registered with an authorization route: "
        f"{sorted(actual ^ (PUBLIC_QUERY_FIELDS | set(QUERY_AUTHZ_ROUTES)))}"
    )


def test_every_shelter_mutation_field_is_registered() -> None:
    actual = _field_names(Mutation)
    assert actual == set(MUTATION_AUTHZ_ROUTES), (
        "Shelter Mutation field(s) are not registered with an authorization route: "
        f"{sorted(actual ^ set(MUTATION_AUTHZ_ROUTES))}"
    )
