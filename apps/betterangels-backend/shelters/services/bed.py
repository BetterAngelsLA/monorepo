from typing import TYPE_CHECKING, Any, Dict, cast

from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from shelters.models import Bed, Shelter
from shelters.selectors import bed_get, bed_queryset, shelter_get
from shelters.services.utils import _BED_M2M_FIELDS, _clone_label, _set_m2m_from_enums, _validate_subset_attributes

if TYPE_CHECKING:
    from accounts.models import User


@transaction.atomic
def bed_create(*, user: "User", organization_id: str, data: Dict[str, Any]) -> Bed:
    """Create a new Bed associated with an existing Shelter.

    Resolves *shelter* via :func:`~shelters.selectors.shelter_get` with
    ``view_shelter`` permission.

    Raises:
        ``django.core.exceptions.ObjectDoesNotExist`` when the shelter is not found.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    data = dict(data)
    shelter_id = data.pop("shelter_id")

    try:
        shelter = shelter_get(
            user=user,
            shelter_id=shelter_id,
            organization_id=organization_id,
            permission=Shelter.perms.VIEW,
        )
    except Shelter.DoesNotExist:
        raise ObjectDoesNotExist(f"Shelter matching ID {shelter_id} could not be found.")

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
def bed_update(*, user: "User", organization_id: str, bed_id: int | str, data: Dict[str, Any]) -> Bed:
    """Update an existing bed, including M2M relationships when provided.

    Resolves *bed* via :func:`~shelters.selectors.bed_get` with
    ``change_bed`` permission.

    Only keys present in *data* are applied; ``None`` scalar values are
    skipped.

    Raises:
        ``django.core.exceptions.ObjectDoesNotExist`` when the bed is not found.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    data = dict(data)
    data.pop("id", None)

    try:
        bed = bed_get(
            user=user,
            bed_id=bed_id,
            organization_id=organization_id,
            permission=Bed.perms.CHANGE,
        )
    except Bed.DoesNotExist:
        raise ObjectDoesNotExist(f"Bed matching ID {bed_id} could not be found.")

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
def bed_delete(*, user: "User", organization_id: str, bed_ids: list[int]) -> list[int]:
    """Delete beds and return the deleted IDs.

    Scopes to *organization_id* where *user* is a member.

    Raises:
        ``django.core.exceptions.ObjectDoesNotExist`` when no matching beds exist.
    """
    qs = bed_queryset(user=user, organization_id=organization_id)
    qs = qs.filter(pk__in=bed_ids)
    deleted_ids = list(qs.values_list("pk", flat=True))
    if not deleted_ids:
        raise ObjectDoesNotExist("No matching beds found.")
    qs.delete()
    return deleted_ids


@transaction.atomic
def bed_clone(*, user: "User", organization_id: str, bed_id: str) -> Bed:
    """Clone an existing bed, including all M2M relationships.

    Scopes to *organization_id* where *user* is a member.

    Raises:
        ``ObjectDoesNotExist`` when the bed is not found.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    qs = bed_queryset(
        Bed.objects.select_related("shelter").prefetch_related(*_BED_M2M_FIELDS),
        user=user,
        organization_id=organization_id,
    )
    try:
        source = qs.get(pk=bed_id)
    except Bed.DoesNotExist:
        raise ObjectDoesNotExist(f"Bed matching ID {bed_id} could not be found.")

    return cast(Bed, source.make_clone(attrs={"name": _clone_label(source.name)}))
