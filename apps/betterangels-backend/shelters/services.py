"""
Shelter services — business logic for writing to the database.

Following the Django Styleguide (HackSoft), services are the single source
of truth for write operations.  They are framework-agnostic: no GraphQL /
Strawberry imports, no ``info`` parameter, no API-layer exceptions.

Raises ``django.core.exceptions.ValidationError`` on invalid data — callers
(API / schema layer) are responsible for translating to their own error format.
"""

from typing import Any, Dict, List

from django.db import models, transaction
from places import Places
from shelters.models import Shelter

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _get_m2m_field_names(model: type[models.Model]) -> list[str]:
    """Return the names of every ``ManyToManyField`` on *model*."""
    return [field.name for field in model._meta.many_to_many]


def _set_m2m_from_enums(instance: models.Model, data: Dict[str, List[Any]]) -> None:
    """Set M2M relationships from enum / string values using ``get_or_create``.

    Handles the *enum-backed lookup-table* pattern where each M2M target
    model has a single ``name`` field (``TextChoicesField`` with
    ``unique=True``).  Enum values are extracted via
    ``getattr(v, "value", v)`` so both enum instances and raw strings
    (e.g. city names) are supported.
    """
    for field_name, values in data.items():
        if not values:
            getattr(instance, field_name).set([])
            continue

        related_model: Any = instance._meta.get_field(field_name).related_model
        instances = [related_model.objects.get_or_create(name=getattr(v, "value", v))[0] for v in values]
        getattr(instance, field_name).set(instances)


def _parse_time_ranges(data: Any) -> Any:
    """Convert a list of ``TimeRangeInput`` dicts to tuple pairs for ``TimeRangeField``."""
    if not data:
        return None
    return [(slot.get("start"), slot.get("end")) for slot in data if slot is not None]


def _parse_location(data: Any) -> Any:
    """Convert a ``ShelterLocationInput`` dict to a ``Places`` object."""
    if not data:
        return None
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    return Places(
        place=data.get("place"),
        latitude=str(latitude) if latitude is not None else None,
        longitude=str(longitude) if longitude is not None else None,
    )


def _prepare_shelter_data(
    data: Dict[str, Any],
    m2m_field_names: list[str],
) -> tuple[Dict[str, Any], Dict[str, List[Any]]]:
    """Separate M2M data from scalar fields and transform custom types.

    Transforms:
    - ``location`` dict → ``Places`` instance
    - ``operating_hours`` / ``intake_hours`` lists → tuple pairs
    - ``organization`` ID → ``organization_id`` FK column
    - ``status`` enum → raw string value

    Returns ``(scalar_data, m2m_data)``.
    """
    m2m_data: Dict[str, List[Any]] = {k: data.pop(k) for k in list(data) if k in m2m_field_names}

    if "operating_hours" in data:
        data["operating_hours"] = _parse_time_ranges(data["operating_hours"])
    if "intake_hours" in data:
        data["intake_hours"] = _parse_time_ranges(data["intake_hours"])
    if "location" in data:
        data["location"] = _parse_location(data["location"])

    if org := data.pop("organization", None):
        data["organization_id"] = org

    if "status" in data:
        status = data["status"]
        if status is not None:
            data["status"] = getattr(status, "value", status)
        else:
            del data["status"]

    return data, m2m_data


# Pre-compute M2M field names once at module level.
_SHELTER_M2M_FIELDS = _get_m2m_field_names(Shelter)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


@transaction.atomic
def shelter_create(*, data: Dict[str, Any]) -> Shelter:
    """Create a new Shelter with all M2M relationships.

    Accepts a plain dict (e.g. from ``strawberry.asdict(input)`` with
    ``UNSET`` keys already removed).

    Steps:
        1. Separate M2M enum data from scalar fields.
        2. Transform custom field types (location, time ranges, FK, status).
        3. Create the ``Shelter`` row with ``full_clean`` validation.
        4. Set M2M relationships via ``get_or_create`` on enum-backed
           lookup tables.

    Raises:
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    scalar_data, m2m_data = _prepare_shelter_data(data, _SHELTER_M2M_FIELDS)

    shelter = Shelter(**scalar_data)
    shelter.full_clean()
    shelter.save()

    _set_m2m_from_enums(shelter, m2m_data)

    return shelter
