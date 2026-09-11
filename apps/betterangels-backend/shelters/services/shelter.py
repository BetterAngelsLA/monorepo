from typing import TYPE_CHECKING, Any, Dict, List

from common.permissions.selectors import can_globally
from common.permissions.utils import require_can
from django.core.exceptions import NON_FIELD_ERRORS, PermissionDenied, ValidationError
from django.db import transaction
from django.utils.text import slugify
from organizations.models import Organization
from strawberry import UNSET

from shelters.models import ContactInfo, Service, ServiceCategory, Shelter
from shelters.selectors import shelter_get
from shelters.services.utils import _SHELTER_M2M_FIELDS, _create_schedules, _prepare_shelter_data, _set_m2m_from_enums

if TYPE_CHECKING:
    from accounts.models import User


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


def _contact_error_dict(exc: ValidationError, index: int) -> dict[str, list[str]]:
    """Re-key a single contact's ``full_clean()`` errors under an indexed path.

    ``full_clean()`` raises a ``ValidationError`` whose ``error_dict`` is keyed by
    field name. We re-key each entry as ``additional_contacts.<index>.<field>`` so
    the GraphQL layer can report which contact in the list failed.
    """
    prefix = f"additional_contacts.{index}"

    if not hasattr(exc, "error_dict"):
        return {prefix: [str(e.message) for e in exc.error_list]}

    result: dict[str, list[str]] = {}
    for field, err_list in exc.error_dict.items():
        key = prefix if field == NON_FIELD_ERRORS else f"{prefix}.{field}"
        result[key] = [str(e.message) for e in err_list]
    return result


def _apply_additional_contacts(shelter: Shelter, contacts: List[Any]) -> None:
    """Apply list-level full-replacement semantics to a shelter's additional contacts.

    The submitted list is authoritative: entries absent from the payload are
    deleted, entries without an ``id`` are created, and entries carrying an
    ``id`` update the matching row in place (preserving its PK and pghistory
    audit trail).

    Each entry is a full PUT payload: every submitted field is written to the
    object. Optional fields omitted from an id-carrying entry are stored as
    ``None``/``False``, so callers must resubmit values they want to preserve.

    Every contact is ``full_clean()``-validated before any write happens. Invalid
    entries are collected (not short-circuited) and raised together as a single
    ``ValidationError`` whose keys are indexed by position, so callers can tell
    exactly which contact failed.
    """
    existing = {c.pk: c for c in shelter.additional_contacts.all()}
    keep_ids: set[int] = set()
    to_save: list[ContactInfo] = []
    new_objs: list[ContactInfo] = []
    errors: dict[str, list[str]] = {}

    for index, entry in enumerate(contacts):
        if not isinstance(entry, dict):
            errors[f"additional_contacts.{index}"] = ["Invalid additional contact."]
            continue

        data = {
            "contact_name": entry.get("contact_name"),
            "contact_number": entry.get("contact_number"),
            "contact_email": entry.get("contact_email"),
            "contact_title": entry.get("contact_title"),
            "is_claimant": entry.get("is_claimant") or False,
        }

        raw_id = entry.get("id")
        if raw_id:
            try:
                obj = existing.get(int(raw_id))
            # In Python 3.14 the syntax below w/o parens is illegal, but formatter removes it without
            # the `as` clause - see related ticket DEV-2568
            except (TypeError, ValueError) as _e:
                errors[f"additional_contacts.{index}.id"] = ["Invalid additional contact id."]
                continue

            if obj is None:
                errors[f"additional_contacts.{index}.id"] = ["Unknown additional contact id."]
                continue

            for key, value in data.items():
                setattr(obj, key, value)
            try:
                obj.full_clean()
            except ValidationError as exc:
                errors.update(_contact_error_dict(exc, index))
                continue
            to_save.append(obj)
            keep_ids.add(obj.pk)
            continue

        contact = ContactInfo(shelter=shelter, **data)
        try:
            contact.full_clean()
        except ValidationError as exc:
            errors.update(_contact_error_dict(exc, index))
            continue
        new_objs.append(contact)

    if errors:
        raise ValidationError(errors)

    for obj in to_save:
        obj.save()

    shelter.additional_contacts.exclude(pk__in=keep_ids).delete()

    for contact in new_objs:
        contact.save()


@transaction.atomic
def shelter_create(*, user: "User", data: Dict[str, Any]) -> Shelter:
    """Create a new Shelter with all M2M relationships and schedules.

    The target organization is the create anchor and travels in the payload
    (``data["organization_id"]``, ADR 0001 §2.6): it is checked for authority
    and existence up front, then flows onto the row as its FK column — no
    separate argument.  Accepts a plain dict (e.g. from
    ``strawberry.asdict(data)`` with ``UNSET`` keys already removed).

    Raises:
        ``django.core.exceptions.ValidationError`` when no target organization is
        given, it does not exist, or the data is invalid.
        ``django.core.exceptions.PermissionDenied`` when the user may not add
        shelters in the target organization.
    """
    data = dict(data)
    organization_id = data.get("organization_id")
    if not organization_id:
        raise ValidationError({"organization_id": "An organization is required to create a shelter."})
    if not Organization.objects.filter(pk=organization_id).exists():
        raise ValidationError(f"Organization with id {organization_id} not found.")
    require_can(user, Shelter.perms.ADD, org=organization_id)

    scalar_data, m2m_data, schedules_data = _prepare_shelter_data(data, _SHELTER_M2M_FIELDS)
    raw_services: List[Any] = m2m_data.pop("services", []) or []

    shelter = Shelter(**scalar_data)
    shelter.full_clean()
    shelter.save()

    _set_m2m_from_enums(shelter, m2m_data)
    _apply_services(shelter, raw_services)
    _create_schedules(shelter, schedules_data)

    # TODO: Assign perms here. See: SDB-178

    return shelter


@transaction.atomic
def shelter_update(*, user: "User", data: Dict[str, Any]) -> Shelter:
    """Update an existing Shelter with partial data.

    Resolves *shelter* via :func:`~shelters.selectors.shelter_get` with
    ``change_shelter`` permission — reach-scoped by the user's grants — so
    the caller does not need to pre-lookup the entity.

    Only fields present in *data* (i.e. not ``UNSET``) are modified.
    Schedules, services, and additional contacts use full-replacement semantics
    when provided.  ``additional_contacts`` is a BA-only field: gated on the
    global tier (``can_globally``) so a scoped Grant can never write it
    (ADR 0001 §2.4).

    Raises:
        ``django.core.exceptions.ObjectDoesNotExist`` when no shelter matches the given ID
        or the user lacks permission.
        ``django.core.exceptions.PermissionDenied`` when *data* carries
        ``additional_contacts`` and the user lacks the global ContactInfo
        ``change`` permission.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    data = {k: v for k, v in data.items() if v is not UNSET}
    data.pop("organization", None)  # organization cannot be changed after creation
    shelter_id = data.pop("id")

    cities_served_ids = data.pop("cities_served_ids", None)
    spas_served_ids = data.pop("spas_served_ids", None)

    # BA-only field: gate on the global tier only — a scoped Grant must never
    # pass (ADR 0001 §2.4).  Only global Roles carrying the ContactInfo perms
    # (the Global Shelter Operator) satisfy this.  Checked before the shelter
    # lookup so an unauthorized caller gets the same refusal whether or not
    # the shelter exists or is visible.
    if "additional_contacts" in data and not can_globally(user, ContactInfo.perms.CHANGE):
        raise PermissionDenied("Editing additional contacts is not allowed with this role.")

    shelter = shelter_get(
        user=user,
        shelter_id=shelter_id,
        permission=Shelter.perms.CHANGE,
    )

    has_schedules = "schedules" in data
    has_services = "services" in data
    has_contacts = "additional_contacts" in data
    additional_contacts = data.pop("additional_contacts", None)

    scalar_data, m2m_data, schedules_data = _prepare_shelter_data(data, _SHELTER_M2M_FIELDS)
    raw_services: List[Any] = m2m_data.pop("services", []) or []

    for k, v in scalar_data.items():
        setattr(shelter, k, v)
    shelter.full_clean()
    shelter.save()

    _set_m2m_from_enums(shelter, m2m_data)

    if has_services:
        _apply_services(shelter, raw_services)

    if has_contacts:
        _apply_additional_contacts(shelter, additional_contacts or [])

    if has_schedules:
        shelter.schedules.all().delete()
        _create_schedules(shelter, schedules_data)

    if cities_served_ids is not None:
        shelter.cities_served.set(cities_served_ids)

    if spas_served_ids is not None:
        shelter.spas_served.set(spas_served_ids)

    return shelter


@transaction.atomic
def shelter_delete(*, user: "User", shelter_id: str | int) -> Shelter:
    """Delete a shelter.

    Resolves the shelter via :func:`~shelters.selectors.shelter_get` with
    ``delete_shelter`` permission — reach-scoped by the user's grants — an
    unauthorized shelter is indistinguishable from a missing one (ADR 0001
    §2.6).

    Deleting cascades through the model FKs to the shelter's rooms, beds,
    photos, schedules and contacts (DB default).

    Raises:
        ``django.core.exceptions.ObjectDoesNotExist`` when no matching shelter
        exists or the user lacks DELETE permission.
    """
    shelter = shelter_get(
        user=user,
        shelter_id=shelter_id,
        permission=Shelter.perms.DELETE,
    )
    deleted_pk = shelter.pk
    shelter.delete()
    shelter.pk = deleted_pk  # Model.delete() nulls the instance pk; keep it for the caller.
    return shelter
