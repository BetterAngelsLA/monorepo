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
from shelters.enums import ConditionChoices, DayOfWeekChoices, ScheduleTypeChoices
from shelters.models import Bed, Schedule, Shelter

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
) -> tuple[Dict[str, Any], Dict[str, List[Any]], List[Dict[str, Any]]]:
    """Separate M2M data and schedules from scalar fields and transform custom types.

    Transforms:
    - ``location`` dict → ``Places`` instance
    - ``organization`` ID → ``organization_id`` FK column
    - ``status`` enum → raw string value
    - ``schedules`` list extracted for bulk creation after shelter save

    Returns ``(scalar_data, m2m_data, schedules_data)``.
    """
    m2m_data: Dict[str, List[Any]] = {k: data.pop(k) for k in list(data) if k in m2m_field_names}

    # Extract schedules before model creation
    schedules_data: List[Dict[str, Any]] = data.pop("schedules", None) or []

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

    return data, m2m_data, schedules_data


# Pre-compute M2M field names once at module level.
_SHELTER_M2M_FIELDS = _get_m2m_field_names(Shelter)


def _create_schedules(shelter: Shelter, schedules_data: List[Dict[str, Any]]) -> None:
    """Bulk-create Schedule rows from a list of input dicts.

    Each input dict may contain ``days`` (a list of day enums).
    One Schedule row is created per day.  If ``days`` is empty or absent,
    a single row with ``day=None`` (every day) is created.
    """
    if not schedules_data:
        return
    objs = []
    for entry in schedules_data:
        # Resolve enum values to their raw strings for TextChoicesField
        raw_type = entry.get("schedule_type")
        schedule_type = (
            ScheduleTypeChoices(getattr(raw_type, "value", raw_type)) if raw_type else ScheduleTypeChoices.OPERATING
        )

        raw_condition = entry.get("condition")
        condition: ConditionChoices | None = (
            ConditionChoices(getattr(raw_condition, "value", raw_condition)) if raw_condition else None
        )

        # Fan out: one row per day (or a single row with day=None)
        raw_days = entry.get("days") or [None]
        for raw_day in raw_days:
            day: DayOfWeekChoices | None = DayOfWeekChoices(getattr(raw_day, "value", raw_day)) if raw_day else None
            objs.append(
                Schedule(
                    shelter=shelter,
                    schedule_type=schedule_type,
                    day=day,
                    start_time=entry.get("start_time"),
                    end_time=entry.get("end_time"),
                    start_date=entry.get("start_date"),
                    end_date=entry.get("end_date"),
                    condition=condition,
                    is_exception=entry.get("is_exception", False),
                )
            )
    Schedule.objects.bulk_create(objs)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


@transaction.atomic
def shelter_create(*, data: Dict[str, Any]) -> Shelter:
    """Create a new Shelter with all M2M relationships and schedules.

    Accepts a plain dict (e.g. from ``strawberry.asdict(data)`` with
    ``UNSET`` keys already removed).

    Steps:
        1. Separate M2M enum data, schedules, from scalar fields.
        2. Transform custom field types (location, time ranges, FK, status).
        3. Create the ``Shelter`` row with ``full_clean`` validation.
        4. Set M2M relationships via ``get_or_create`` on enum-backed
           lookup tables.
        5. Bulk-create ``Schedule`` rows.

    Raises:
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    scalar_data, m2m_data, schedules_data = _prepare_shelter_data(data, _SHELTER_M2M_FIELDS)

    shelter = Shelter(**scalar_data)
    shelter.full_clean()
    shelter.save()

    _set_m2m_from_enums(shelter, m2m_data)
    _create_schedules(shelter, schedules_data)

    return shelter


@transaction.atomic
def bed_create(*, data: Dict[str, Any]) -> Bed:
    """Create a new Bed associated with an existing Shelter.

    Accepts a plain dict with ``shelter_id`` and ``status``.

    Raises:
        ``Shelter.DoesNotExist`` when the referenced shelter is not found.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    shelter = Shelter.objects.get(pk=data["shelter_id"])
    bed = Bed(shelter=shelter, status=data["status"])
    bed.full_clean()
    bed.save()
    return bed
