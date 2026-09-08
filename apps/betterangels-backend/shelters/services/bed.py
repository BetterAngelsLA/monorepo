from typing import TYPE_CHECKING, Any, Dict, cast

from common.permissions.utils import require_can
from common.utils import get_by_pk_or_not_found
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from shelters.models import Bed, Shelter
from shelters.selectors import bed_get, bed_queryset, shelter_get
from shelters.services.utils import _BED_M2M_FIELDS, _clone_label, _set_m2m_from_enums, _validate_subset_attributes

if TYPE_CHECKING:
    from accounts.models import User


@transaction.atomic
def bed_create(*, user: "User", data: Dict[str, Any]) -> Bed:
    """Create a new Bed associated with an existing Shelter.

    Resolves *shelter* via :func:`~shelters.selectors.shelter_get` with
    ``view_shelter`` permission (reach-scoped, header-free — ADR 0001 §5.2),
    then checks create authority with ``can(user, Bed.perms.ADD, org)`` where
    the org is the parent shelter's (ADR 0001 §2.6).

    Raises:
        ``django.core.exceptions.ObjectDoesNotExist`` when the shelter is not found.
        ``django.core.exceptions.PermissionDenied`` when the user cannot add beds.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    data = dict(data)
    shelter_id = data.pop("shelter_id")

    shelter = shelter_get(
        user=user,
        shelter_id=shelter_id,
        permission=Shelter.perms.VIEW,
    )

    require_can(user, Bed.perms.ADD, org=shelter.organization_id)

    m2m_data: Dict[str, Any] = {k: data.pop(k) for k in list(data) if k in _BED_M2M_FIELDS and data[k] is not None}

    _validate_subset_attributes(shelter, m2m_data)

    # Drop None values so model defaults apply
    scalar_data = {k: v for k, v in data.items() if v is not None}

    bed = Bed(shelter=shelter, **scalar_data)
    bed.full_clean()
    bed.save()
    _set_m2m_from_enums(bed, m2m_data)

    # TODO: Assign perms here. See: SDB-178

    return bed


@transaction.atomic
def bed_update(*, user: "User", bed_id: int | str, data: Dict[str, Any]) -> Bed:
    """Update an existing bed, including M2M relationships when provided.

    Resolves *bed* via :func:`~shelters.selectors.bed_get` with
    ``change_bed`` permission — reach-scoped by the user's grants
    (header-free, ADR 0001 §5.2).

    Only keys present in *data* are applied; ``None`` scalar values are
    skipped.

    Raises:
        ``django.core.exceptions.ObjectDoesNotExist`` when the bed is not found.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    data = dict(data)
    data.pop("id", None)

    bed = bed_get(
        user=user,
        bed_id=bed_id,
        permission=Bed.perms.CHANGE,
    )

    m2m_data: Dict[str, Any] = {
        k: data.pop(k) for k in list(data) if k in _BED_M2M_FIELDS and k in data and data[k] is not None
    }

    _validate_subset_attributes(bed.shelter, m2m_data)

    for key, value in data.items():
        if value is not None:
            setattr(bed, key, value)

    bed.full_clean()
    bed.save()

    if m2m_data:
        _set_m2m_from_enums(bed, m2m_data)

    return bed


@transaction.atomic
def bed_delete(*, user: "User", bed_ids: list[int]) -> list[int]:
    """Delete beds and return the deleted IDs.

    The queryset is reach-scoped by the user's grants (header-free, ADR 0001
    §5.2).

    Unmatched or inaccessible IDs are silently skipped; only successfully
    deleted IDs are returned.

    Raises:
        ``django.core.exceptions.ObjectDoesNotExist`` when no matching beds exist.
    """
    qs = bed_queryset(user=user, permission=Bed.perms.DELETE)
    qs = qs.filter(pk__in=bed_ids)
    deleted_ids = list(qs.values_list("pk", flat=True))
    if not deleted_ids:
        raise ObjectDoesNotExist("No matching beds found.")
    qs.delete()
    return deleted_ids


@transaction.atomic
def bed_clone(*, user: "User", bed_id: str) -> Bed:
    """Clone an existing bed, including all M2M relationships.

    The source is resolved reach-scoped (header-free, ADR 0001 §5.2) and the
    create org is taken from the source shelter.  Cloning creates a new bed,
    so it follows the create convention (ADR 0001 §2.6): the source is
    resolved with view authority and create authority is checked with
    ``can(user, Bed.perms.ADD, org)``.

    Raises:
        ``ObjectDoesNotExist`` when the bed is not found.
        ``django.core.exceptions.PermissionDenied`` when the user cannot add beds.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    qs = bed_queryset(
        Bed.objects.select_related("shelter").prefetch_related(*_BED_M2M_FIELDS),
        user=user,
        permission=Bed.perms.VIEW,
    )
    source = get_by_pk_or_not_found(qs, pk=bed_id)

    require_can(user, Bed.perms.ADD, org=source.shelter.organization_id)

    return cast(Bed, source.make_clone(attrs={"name": _clone_label(source.name)}))
