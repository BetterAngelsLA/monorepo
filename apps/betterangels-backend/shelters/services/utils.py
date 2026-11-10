from typing import Any, Dict, List, overload

from django.core.exceptions import ValidationError
from django.db import models
from places import Places

from shelters.enums import ConditionChoices, DayOfWeekChoices, ScheduleTypeChoices
from shelters.models import Bed, Room, Schedule, Shelter


def _get_m2m_field_names(model: type[models.Model]) -> set[str]:
    """Return set of ``ManyToManyField`` names on *model*."""
    return {field.name for field in model._meta.many_to_many}


# Pre-compute M2M field names once at module level.
_SHELTER_M2M_FIELDS = _get_m2m_field_names(Shelter)
_BED_M2M_FIELDS = _get_m2m_field_names(Bed)
_ROOM_M2M_FIELDS = _get_m2m_field_names(Room)
_COMMON_M2M_FIELDS = (_SHELTER_M2M_FIELDS & _BED_M2M_FIELDS) | (_SHELTER_M2M_FIELDS & _ROOM_M2M_FIELDS)


@overload
def _clone_label(label: str | None, *, default: str) -> str: ...


@overload
def _clone_label(label: str | None, *, default: None = None) -> str | None: ...


def _clone_label(label: str | None, *, default: str | None = None) -> str | None:
    if not label:
        return default
    return f"{label} (Copy)"


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
    m2m_field_names: set[str],
) -> tuple[Dict[str, Any], Dict[str, List[Any]], List[Dict[str, Any]]]:
    """Separate M2M data and schedules from scalar fields.

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


def _schedule_rows(entry: Dict[str, Any], *, schedule_type: ScheduleTypeChoices | None = None) -> List[Dict[str, Any]]:
    """Expand one schedule input into per-day row kwargs.

    ``days`` fans out to one row per day; absent or empty means a single row with
    ``day=None`` (every day).

    *schedule_type* is the type being saved, for the update path. The entry's own
    ``schedule_type`` is then redundant: it is checked when present and ignored
    otherwise, so an edit does not have to repeat the tab it came from. The create
    path passes nothing and keeps the ``OPERATING`` default.
    """
    # Resolve enum values to their raw strings for TextChoicesField
    raw_type = entry.get("schedule_type")
    entry_type = ScheduleTypeChoices(getattr(raw_type, "value", raw_type)) if raw_type else None
    if schedule_type is not None and entry_type is not None and entry_type != schedule_type:
        raise ValidationError(
            {
                "schedules": (
                    f"{_schedule_type_label(entry_type)} entry submitted while saving "
                    f"{_schedule_type_label(schedule_type)}."
                )
            }
        )

    schedule_type = schedule_type or entry_type or ScheduleTypeChoices.OPERATING

    raw_condition = entry.get("condition")
    condition: ConditionChoices | None = (
        ConditionChoices(getattr(raw_condition, "value", raw_condition)) if raw_condition else None
    )

    raw_days = entry.get("days")
    if raw_days is not None and not raw_days:
        # ``or [None]`` would silently turn this into an every-day slot, which is
        # the opposite of what a client clearing ``days`` means to say.
        raise ValidationError({"schedules": "days cannot be empty; omit it to mean every day."})

    rows: List[Dict[str, Any]] = []
    for raw_day in raw_days or [None]:
        rows.append(
            {
                "schedule_type": schedule_type,
                "day": DayOfWeekChoices(getattr(raw_day, "value", raw_day)) if raw_day else None,
                "start_time": entry.get("start_time"),
                "end_time": entry.get("end_time"),
                "start_date": entry.get("start_date"),
                "end_date": entry.get("end_date"),
                "condition": condition,
                "is_exception": entry.get("is_exception", False),
            }
        )

    return rows


def _create_schedules(shelter: Shelter, schedules_data: List[Dict[str, Any]]) -> None:
    """Bulk-create Schedule rows from a list of input dicts (create-only path)."""
    for entry in schedules_data:
        if entry.get("id"):
            raise ValidationError({"schedules": "A new schedule entry cannot carry an id; ids update existing rows."})

    rows = [row for entry in schedules_data for row in _schedule_rows(entry)]

    if rows:
        Schedule.objects.bulk_create([Schedule(shelter=shelter, **row) for row in rows])


def _schedule_type_label(schedule_type: ScheduleTypeChoices) -> str:
    """``ScheduleTypeChoices.OPERATING`` -> ``Operating Hours``, for messages."""
    return str(schedule_type.label)


def _duplicate_slot_message(row: Dict[str, Any]) -> str:
    """Explain which slot the payload repeats, in the user's terms."""
    when: str
    if row["start_date"]:
        when = row["start_date"].isoformat()
    elif row["day"]:
        when = str(row["day"].label)
    else:
        when = "every day"

    start = row["start_time"]
    at = start.strftime("%H:%M") if start else "the same time"

    return f"{_schedule_type_label(row['schedule_type'])}: {when} already has a slot starting at {at}."


def _sync_schedules(
    shelter: Shelter,
    schedules_data: List[Dict[str, Any]],
    *,
    schedule_type: ScheduleTypeChoices,
) -> None:
    """Reconcile one schedule type with the submitted set.

    *schedule_type* is the tab being saved, and the payload is authoritative for
    it alone: an entry carrying an ``id`` updates that row in place, an entry
    without one creates a row, and a row of that type whose id is absent is
    deleted. Every other type is left untouched, so saving Operating Hours cannot
    revert Intake or Meal Service from a stale client snapshot. Within the type the
    payload is still a snapshot: a save from a tab that predates a slot someone
    else added deletes that slot. Explicit deletes (the client knows every id it
    removed) are the fix if that ever bites. Updating in place
    is the point — the write then records only what changed, so the audit log can
    report an edit as an edit instead of a delete plus a create.

    Ids must belong to *this* shelter (an id from another organization is an input
    error, not a silent no-op) and may appear once. The caller runs inside a
    transaction and the slot key is deferrable, so a save may swap two slots' times
    without tripping the unique constraint mid-flight.

    The shelter row is locked first. Locking its schedule rows would not stop a
    concurrent insert of the same slot key under READ COMMITTED, and a deferred
    violation then fires at COMMIT — outside this function, where nothing can turn
    it into an ``OperationInfo``. Locking the shelter makes schedule saves for one
    shelter take turns.
    """
    specs: List[tuple[str | None, Dict[str, Any]]] = []
    for entry in schedules_data:
        raw_id = entry.get("id")
        # ``days`` fans one entry out to one row per day, which an id cannot name:
        # the id belongs to a single stored row.
        days = entry.get("days") or [None]
        if raw_id and len(days) > 1:
            raise ValidationError(
                {"schedules": (f"Schedule {raw_id} cannot be sent with more than one day; submit one entry per day.")}
            )

        for row in _schedule_rows(entry, schedule_type=schedule_type):
            specs.append((str(raw_id) if raw_id else None, row))

    # The stored key is (shelter, type, day, start time, start date). A payload
    # that repeats one cannot be saved, and the DB error would reach the user as a
    # generic failure, so name the slot instead.
    seen_slots: set[tuple[Any, ...]] = set()
    for _key, row in specs:
        slot_key = (row["schedule_type"], row["day"], row["start_time"], row["start_date"])
        if slot_key in seen_slots:
            raise ValidationError({"schedules": _duplicate_slot_message(row)})
        seen_slots.add(slot_key)

    # Serialise every schedule write for this shelter before reading the set.
    Shelter.objects.select_for_update().get(pk=shelter.pk)

    existing = {str(row.id): row for row in shelter.schedules.all()}
    in_scope = {key: row for key, row in existing.items() if row.schedule_type == schedule_type}

    kept: set[str] = set()
    for key, _row in specs:
        if key is None:
            continue
        if key not in existing:
            raise ValidationError({"schedules": f"Schedule {key} does not belong to this shelter."})
        if key not in in_scope:
            raise ValidationError(
                {
                    "schedules": f"Schedule {key} is not one of this shelter's {_schedule_type_label(schedule_type)} slots."
                }
            )
        if key in kept:
            raise ValidationError({"schedules": f"Schedule {key} appears more than once in the payload."})
        kept.add(key)

    # One statement per kind instead of one per row; pghistory's triggers are
    # row-level, so the audit log still gets an event per row.
    removed = [stored.pk for key, stored in in_scope.items() if key not in kept]
    if removed:
        Schedule.objects.filter(pk__in=removed).delete()

    created: List[Dict[str, Any]] = []
    for key, row in specs:
        if key is None:
            created.append(row)
            continue

        target = in_scope[key]
        # ``updated_at`` is ``auto_now``, and the schedule trigger fires on any
        # row change, so saving an untouched slot would date it and log an edit
        # nobody made. Only write the fields that actually differ.
        changed = [field_name for field_name, value in row.items() if getattr(target, field_name) != value]

        if not changed:
            continue

        for field_name in changed:
            setattr(target, field_name, row[field_name])
        target.save(update_fields=[*changed, "updated_at"])

    if created:
        Schedule.objects.bulk_create([Schedule(shelter=shelter, **row) for row in created])


def _validate_subset_attributes(shelter: Shelter, m2m_data: Dict[str, List[Any]]) -> None:
    """Ensure room/bed attributes are a strict subset of the shelter's attributes."""
    from django.db.models import prefetch_related_objects

    fields_to_check = [f for f in _COMMON_M2M_FIELDS if f in m2m_data and m2m_data[f]]
    if fields_to_check:
        prefetch_related_objects([shelter], *fields_to_check)

    for field_name in fields_to_check:
        provided_values = [getattr(v, "value", v) for v in m2m_data[field_name]]
        shelter_allowed = {obj.name for obj in getattr(shelter, field_name).all()}
        invalid = set(provided_values) - shelter_allowed
        if invalid:
            raise ValidationError(
                {field_name: f"The following {field_name} are not supported by the shelter: {', '.join(invalid)}"}
            )
