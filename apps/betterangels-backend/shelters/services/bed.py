from typing import TYPE_CHECKING, cast

from common.permissions.utils import require_can
from common.utils import get_by_pk_or_not_found
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from shelters.models import Bed, Shelter
from shelters.selectors import bed_get, bed_queryset, shelter_get
from shelters.services.data import BedCreateData, BedUpdateData
from shelters.services.utils import (
    _BED_M2M_FIELDS,
    _clone_label,
    _set_m2m_from_enums,
    _split_payload,
    _validate_subset_attributes,
)

if TYPE_CHECKING:
    from accounts.models import User


@transaction.atomic
def bed_create(*, user: "User", organization_id: str, data: BedCreateData) -> Bed:
    """Create a new Bed associated with an existing Shelter.

    Resolves *shelter* via :func:`~shelters.selectors.shelter_get` with
    ``view_shelter`` permission, then checks create authority with
    ``require_can(user, Bed.perms.ADD, org)`` (ADR 0001 §2.6).

    *data* is a typed write payload (:class:`BedCreateData`); ``None`` fields
    are left to model defaults.

    Raises:
        ``django.core.exceptions.ObjectDoesNotExist`` when the shelter is not found.
        ``django.core.exceptions.PermissionDenied`` when the user cannot add beds.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    shelter = shelter_get(
        user=user,
        shelter_id=data.shelter_id,
        organization_id=organization_id,
        permission=Shelter.perms.VIEW,
    )

    require_can(user, Bed.perms.ADD, org=organization_id)

    scalar_data, m2m_data = _split_payload(data, _BED_M2M_FIELDS, skip=frozenset({"shelter_id"}), model=Bed)

    _validate_subset_attributes(shelter, m2m_data)

    bed = Bed(shelter=shelter, **scalar_data)
    bed.full_clean()
    bed.save()
    _set_m2m_from_enums(bed, m2m_data)

    # TODO: Assign perms here. See: SDB-178

    return bed


@transaction.atomic
def bed_update(*, user: "User", organization_id: str, data: BedUpdateData) -> Bed:
    """Update an existing bed, including M2M relationships when provided.

    Resolves *bed* (``data.bed_id``) via :func:`~shelters.selectors.bed_get`
    with ``change_bed`` permission.

    *data* is a typed write payload (:class:`BedUpdateData`) that carries the
    target ``bed_id``; ``None`` fields (absent or explicit null) are left
    unchanged.

    Raises:
        ``django.core.exceptions.ObjectDoesNotExist`` when the bed is not found.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    bed = bed_get(
        user=user,
        bed_id=data.bed_id,
        organization_id=organization_id,
        permission=Bed.perms.CHANGE,
    )

    scalar_data, m2m_data = _split_payload(data, _BED_M2M_FIELDS, skip=frozenset({"bed_id"}), model=Bed)

    _validate_subset_attributes(bed.shelter, m2m_data)

    for key, value in scalar_data.items():
        setattr(bed, key, value)

    bed.full_clean()
    bed.save()

    if m2m_data:
        _set_m2m_from_enums(bed, m2m_data)

    return bed


@transaction.atomic
def bed_delete(*, user: "User", organization_id: str, bed_ids: list[int]) -> list[int]:
    """Delete beds and return the deleted IDs.

    Scopes to *organization_id* where *user* is a member.

    Unmatched or inaccessible IDs are silently skipped; only successfully
    deleted IDs are returned.

    Raises:
        ``django.core.exceptions.ObjectDoesNotExist`` when no matching beds exist.
    """
    qs = bed_queryset(user=user, organization_id=organization_id, permission=Bed.perms.DELETE)
    qs = qs.filter(pk__in=bed_ids)
    deleted_ids = list(qs.values_list("pk", flat=True))
    if not deleted_ids:
        raise ObjectDoesNotExist("No matching beds found.")
    qs.delete()
    return deleted_ids


@transaction.atomic
def bed_clone(*, user: "User", organization_id: str, bed_id: str) -> Bed:
    """Clone an existing bed, including all M2M relationships.

    Scopes to *organization_id* where *user* is a member.  Cloning creates a
    new bed, so it follows the create convention (ADR 0001 §2.6): the source
    is resolved with view authority and create authority is checked with
    ``can(user, Bed.perms.ADD, org)``.

    Raises:
        ``ObjectDoesNotExist`` when the bed is not found.
        ``django.core.exceptions.PermissionDenied`` when the user cannot add beds.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    qs = bed_queryset(
        Bed.objects.select_related("shelter").prefetch_related(*_BED_M2M_FIELDS),
        user=user,
        organization_id=organization_id,
        permission=Bed.perms.VIEW,
    )
    source = get_by_pk_or_not_found(qs, pk=bed_id)

    require_can(user, Bed.perms.ADD, org=organization_id)

    return cast(Bed, source.make_clone(attrs={"name": _clone_label(source.name)}))
