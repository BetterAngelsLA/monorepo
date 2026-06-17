from typing import TYPE_CHECKING, Any, Dict, cast

from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from shelters.models import Bed, Shelter
from shelters.selectors import admin_bed_list, bed_get, shelter_get
from shelters.services.utils import _BED_M2M_FIELDS, _clone_label, _set_m2m_from_enums, _validate_subset_attributes

if TYPE_CHECKING:
    from accounts.models import User


@transaction.atomic
def bed_create(*, user: "User", data: Dict[str, Any], organization_id: str) -> Bed:
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
        shelter = shelter_get(user=user, shelter_id=shelter_id, organization_id=organization_id)
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
def bed_update(*, user: "User", bed_id: int | str, data: Dict[str, Any], organization_id: str) -> Bed:
    """Update an existing bed, including M2M relationships when provided.

    Validates org access via the bed's shelter. Only keys present in *data*
    are applied; ``None`` scalar values are skipped.

    Raises:
        ``ObjectDoesNotExist`` when the bed is not found.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    data = dict(data)
    try:
        bed = bed_get(user=user, bed_id=bed_id, organization_id=organization_id)
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
def bed_delete(*, user: "User", ids: list[int], organization_id: str) -> list[int]:
    """Delete beds by their IDs and return the deleted IDs.

    Raises:
        ``ObjectDoesNotExist`` when any of the given IDs does not match a bed.
    """
    beds = admin_bed_list(Bed.objects.all(), user=user, organization_id=organization_id).filter(pk__in=ids)
    deleted_ids = list(beds.values_list("pk", flat=True))
    beds.delete()
    return deleted_ids


@transaction.atomic
def bed_clone(*, user: "User", bed_id: str, organization_id: str) -> Bed:
    """Clone an existing bed, including all M2M relationships.

    Validates org access via ``bed_get``.

    Raises:
        ``ObjectDoesNotExist`` when the bed is not found.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    try:
        source = admin_bed_list(
            Bed.objects.select_related("shelter").prefetch_related(*_BED_M2M_FIELDS),
            user=user,
            organization_id=organization_id,
        ).get(pk=bed_id)
    except Bed.DoesNotExist:
        raise ObjectDoesNotExist(f"Bed matching ID {bed_id} could not be found.")

    return cast(Bed, source.make_clone(attrs={"name": _clone_label(source.name)}))
