"""
Shelter services — business logic for writing to the database.

Following the Django Styleguide (HackSoft), services are the single source
of truth for write operations.  They are framework-agnostic: no GraphQL /
Strawberry imports, no ``info`` parameter, no API-layer exceptions.

Raises ``django.core.exceptions.ValidationError`` on invalid data — callers
(API / schema layer) are responsible for translating to their own error format.
"""

from typing import TYPE_CHECKING, Any, Dict, List

from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db import models, transaction
from django.utils.text import slugify
from organizations.models import Organization
from places import Places
from shelters.enums import ConditionChoices, DayOfWeekChoices, ScheduleTypeChoices
from shelters.models import Bed, Room, Schedule, Service, ServiceCategory, Shelter
from shelters.selectors import shelter_get

if TYPE_CHECKING:
    from accounts.models import User

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


def resolve_pending_service_entries(entries: list[tuple[int, str]]) -> list[Service]:
    """Resolve validated ``(category_id, display_name)`` pairs into Service objects.

    For each entry, reuses an existing ``is_other`` service with a matching
    display name (case-insensitive) or creates a new one.

    Shared by the GraphQL mutation layer and the Django admin form.

    Raises ``ValidationError`` if any *category_id* is unknown.
    """
    if not entries:
        return []

    category_ids = {cid for cid, _ in entries}
    categories = {
        cat.id: cat for cat in ServiceCategory.objects.filter(pk__in=category_ids).prefetch_related("services")
    }

    unknown = category_ids - set(categories)
    if unknown:
        raise ValidationError(f"Unknown service category: {next(iter(unknown))}.")

    other_by_category: dict[int, dict[str, Service]] = {}
    names_by_category: dict[int, set[str]] = {}
    next_priority: dict[int, int] = {}

    for cid, cat in categories.items():
        others: dict[str, Service] = {}
        names: set[str] = set()
        max_pri = -1
        for svc in cat.services.all():
            names.add(svc.name.casefold())
            if svc.priority > max_pri:
                max_pri = svc.priority
            if svc.is_other:
                others[svc.display_name.casefold()] = svc
        other_by_category[cid] = others
        names_by_category[cid] = names
        next_priority[cid] = max_pri + 1

    resolved: list[Service] = []
    seen_ids: set[int] = set()
    for cid, display_name in entries:
        normalized = display_name.casefold()
        existing = other_by_category.get(cid, {}).get(normalized)
        if existing is not None:
            if existing.pk not in seen_ids:
                resolved.append(existing)
                seen_ids.add(existing.pk)
            continue

        category = categories[cid]
        base_name = slugify(display_name).replace("-", "_") or f"service_{cid}"
        base_name = f"other_{base_name}"
        service_name = base_name
        suffix = 2
        while service_name.casefold() in names_by_category[cid]:
            service_name = f"{base_name}_{suffix}"
            suffix += 1

        created = Service.objects.create(
            category=category,
            name=service_name,
            display_name=display_name,
            is_other=True,
            priority=next_priority[cid],
        )
        next_priority[cid] += 1
        names_by_category[cid].add(service_name.casefold())
        other_by_category.setdefault(cid, {})[normalized] = created
        if created.pk not in seen_ids:
            resolved.append(created)
            seen_ids.add(created.pk)

    return resolved


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


@transaction.atomic
def shelter_create(*, user: "User", data: Dict[str, Any]) -> Shelter:
    """Create a new Shelter with all M2M relationships and schedules.

    Validates that *user* belongs to the target organization before
    creating anything.

    Accepts a plain dict (e.g. from ``strawberry.asdict(data)`` with
    ``UNSET`` keys already removed).

    Raises:
        ``PermissionError`` when the user is not a member of the org.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    org_id = data.get("organization")
    if not Organization.objects.filter(pk=org_id, users=user).exists():
        raise PermissionError("You do not have permission to create a shelter for this organization.")

    scalar_data, m2m_data, schedules_data = _prepare_shelter_data(data, _SHELTER_M2M_FIELDS)

    # ``services`` is a unified list — split into existing PKs and pending entries.
    raw_services: List[Dict[str, Any]] = m2m_data.pop("services", None) or []
    service_pks: list[Any] = []
    pending_entries: list[tuple[int, str]] = []
    seen_pending: set[tuple[int, str]] = set()

    for entry in raw_services:
        if isinstance(entry, dict):
            svc_id = entry.get("id")
            cat_id = entry.get("category_id")
            display = str(entry.get("display_name") or "").strip()
            if svc_id:
                service_pks.append(svc_id)
            elif cat_id and display:
                try:
                    norm_cat = int(cat_id)
                except (TypeError, ValueError) as exc:
                    raise ValidationError("Invalid new service entry.") from exc
                key = (norm_cat, display.casefold())
                if key not in seen_pending:
                    seen_pending.add(key)
                    pending_entries.append((norm_cat, display))
            else:
                raise ValidationError("Each service must have either 'id' or 'categoryId' + 'displayName'.")
        else:
            service_pks.append(entry)

    shelter = Shelter(**scalar_data)
    shelter.full_clean()
    shelter.save()

    _set_m2m_from_enums(shelter, m2m_data)
    if service_pks:
        shelter.services.set(Service.objects.filter(pk__in=service_pks))
    pending_service_objects = resolve_pending_service_entries(pending_entries)
    if pending_service_objects:
        shelter.services.add(*pending_service_objects)
    _create_schedules(shelter, schedules_data)

    return shelter


_BED_M2M_FIELDS = _get_m2m_field_names(Bed)


@transaction.atomic
def bed_create(*, user: "User", data: Dict[str, Any]) -> Bed:
    """Create a new Bed associated with an existing Shelter.

    Validates that *user* belongs to the shelter's organization via
    ``shelter_get`` before creating the bed.

    Raises:
        ``ObjectDoesNotExist`` when the shelter is not found or the user
        does not belong to its organization.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    data = dict(data)
    shelter_id = data.pop("shelter_id")
    try:
        shelter = shelter_get(user=user, shelter_id=shelter_id)
    except Shelter.DoesNotExist:
        raise ObjectDoesNotExist(f"Shelter matching ID {shelter_id} could not be found.")

    m2m_data: Dict[str, List[Any]] = {
        k: data.pop(k) for k in list(data) if k in _BED_M2M_FIELDS and data[k] is not None
    }

    # Drop None values so model defaults apply
    scalar_data = {k: v for k, v in data.items() if v is not None}

    bed = Bed(shelter=shelter, **scalar_data)
    bed.full_clean()
    bed.save()
    _set_m2m_from_enums(bed, m2m_data)

    return bed


@transaction.atomic
def room_create(*, user: "User", data: Dict[str, Any]) -> Room:
    """Create a new Room associated with an existing Shelter.

    Validates that *user* belongs to the shelter's organization via
    ``shelter_get`` before creating the room.

    Raises:
        ``ObjectDoesNotExist`` when the shelter is not found or the user
        does not belong to its organization.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    data = dict(data)
    shelter_id = data.pop("shelter_id")
    try:
        shelter = shelter_get(user=user, shelter_id=shelter_id)
    except Shelter.DoesNotExist:
        raise ObjectDoesNotExist(f"Shelter matching ID {shelter_id} could not be found.")

    # Drop None values so model defaults apply
    scalar_data = {k: v for k, v in data.items() if v is not None}

    room = Room(shelter=shelter, **scalar_data)
    room.full_clean()
    room.save()
    return room
