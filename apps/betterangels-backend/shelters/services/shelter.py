from typing import TYPE_CHECKING, Any, Dict, List

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.text import slugify
from organizations.models import Organization
from shelters.models import Service, ServiceCategory, Shelter
from shelters.services.utils import (
    _SHELTER_M2M_FIELDS,
    _create_schedules,
    _prepare_shelter_data,
    _set_m2m_from_enums,
)
from strawberry import UNSET

if TYPE_CHECKING:
    from accounts.models import User


def _assert_org_membership(
    user: "User", org_id: Any, *, message: str = "You do not have permission to perform this action."
) -> None:
    if not Organization.objects.filter(pk=org_id, users=user).exists():
        raise PermissionError(message)


def _apply_services(shelter: Shelter, raw_services: List[Any]) -> None:
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

    shelter.services.set(Service.objects.filter(pk__in=service_pks))
    pending_service_objects = resolve_pending_service_entries(pending_entries)
    if pending_service_objects:
        shelter.services.add(*pending_service_objects)


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
    _assert_org_membership(
        user, org_id, message="You do not have permission to create a shelter for this organization."
    )

    scalar_data, m2m_data, schedules_data = _prepare_shelter_data(data, _SHELTER_M2M_FIELDS)
    raw_services: List[Any] = m2m_data.pop("services", []) or []

    shelter = Shelter(**scalar_data)
    shelter.full_clean()
    shelter.save()

    _set_m2m_from_enums(shelter, m2m_data)
    _apply_services(shelter, raw_services)
    _create_schedules(shelter, schedules_data)

    return shelter


@transaction.atomic
def shelter_update(*, user: "User", data: Dict[str, Any]) -> Shelter:
    """Update an existing Shelter with partial data.

    Only fields present in *data* (i.e. not ``UNSET``) are modified.
    Schedules and services use full-replacement semantics when provided.

    Raises:
        ``Shelter.DoesNotExist`` when no shelter matches the given ID.
        ``PermissionError`` when the user is not a member of the shelter's organization.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    shelter_id = data.pop("id")
    data = {k: v for k, v in data.items() if v is not UNSET}
    data.pop("organization", None)  # organization cannot be changed after creation

    cities_served_ids = data.pop("cities_served_ids", None)
    spas_served_ids = data.pop("spas_served_ids", None)

    shelter = Shelter.objects.get(pk=shelter_id)

    _assert_org_membership(user, shelter.organization_id, message="You do not have permission to update this shelter.")

    has_schedules = "schedules" in data
    has_services = "services" in data

    scalar_data, m2m_data, schedules_data = _prepare_shelter_data(data, _SHELTER_M2M_FIELDS)
    raw_services: List[Any] = m2m_data.pop("services", []) or []

    for k, v in scalar_data.items():
        setattr(shelter, k, v)
    shelter.full_clean()
    shelter.save()

    _set_m2m_from_enums(shelter, m2m_data)

    if has_services:
        _apply_services(shelter, raw_services)

    if has_schedules:
        shelter.schedules.all().delete()
        _create_schedules(shelter, schedules_data)

    if cities_served_ids is not None:
        shelter.cities_served.set(cities_served_ids)

    if spas_served_ids is not None:
        shelter.spas_served.set(spas_served_ids)

    return shelter
