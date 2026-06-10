from typing import TYPE_CHECKING, Any, Dict

from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from shelters.models import Bed, Shelter
from shelters.selectors import shelter_get
from shelters.services.utils import _BED_M2M_FIELDS, _set_m2m_from_enums, _validate_subset_attributes

if TYPE_CHECKING:
    from accounts.models import User


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

    Validates org access via the bed's shelter. Only keys present in *data*
    are applied; ``None`` scalar values are skipped.

    Raises:
        ``ObjectDoesNotExist`` when the bed is not found.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    data = dict(data)
    try:
        bed = Bed.objects.select_related("shelter").prefetch_related(*_BED_M2M_FIELDS).get(pk=bed_id)
    except Bed.DoesNotExist:
        raise ObjectDoesNotExist(f"Bed matching ID {bed_id} could not be found.")

    shelter_get(user=user, shelter_id=bed.shelter_id)

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


def _duplicate_label(label: str | None) -> str | None:
    if not label:
        return None
    return f"{label} (Copy)"


@transaction.atomic
def bed_delete(*, ids: list[int | str]) -> list[Bed]:
    """Delete beds by their IDs and return the deleted instances.

    Raises:
        ``ObjectDoesNotExist`` when any of the given IDs does not match a bed.
    """
    beds = list(Bed.objects.filter(pk__in=ids))
    found_ids = {bed.pk for bed in beds}
    missing = [id for id in ids if int(id) not in found_ids]
    if missing:
        raise ObjectDoesNotExist(f"Bed(s) matching ID(s) {missing} could not be found.")
    for bed in beds:
        bed.delete()
    return beds


@transaction.atomic
def bed_clone(*, user: "User", bed_id: str, shelter_id: str) -> Bed:
    """Duplicate an existing bed on *shelter_id*, including all M2M relationships.

    Validates org access via ``shelter_get``. The source bed must belong to *shelter_id*.

    Raises:
        ``ObjectDoesNotExist`` when the shelter or bed is not found.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    shelter = shelter_get(user=user, shelter_id=shelter_id)
    try:
        source = Bed.objects.filter(shelter_id=shelter.pk).prefetch_related(*_BED_M2M_FIELDS).get(pk=bed_id)
    except Bed.DoesNotExist:
        raise ObjectDoesNotExist(f"Bed matching ID {bed_id} could not be found for shelter {shelter_id}.")

    duplicate = Bed(
        b7=source.b7,
        fees=source.fees,
        last_cleaned_inspected=source.last_cleaned_inspected,
        maintenance_flag=source.maintenance_flag,
        name=_duplicate_label(source.name),
        room=source.room,
        shelter=shelter,
        status=source.status,
        status_notes=source.status_notes,
        storage=source.storage,
        type=source.type,
    )
    duplicate.full_clean()
    duplicate.save()

    for field_name in _BED_M2M_FIELDS:
        getattr(duplicate, field_name).set(getattr(source, field_name).all())

    return duplicate
