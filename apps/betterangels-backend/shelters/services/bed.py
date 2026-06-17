from typing import Any, Dict, cast

from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from django.db.models import QuerySet
from shelters.models import Bed, Shelter
from shelters.services.utils import _BED_M2M_FIELDS, _clone_label, _set_m2m_from_enums, _validate_subset_attributes


@transaction.atomic
def bed_create(*, shelter: "Shelter", data: Dict[str, Any]) -> Bed:
    """Create a new Bed associated with *shelter*.

    The caller is responsible for resolving *shelter* (e.g. via
    :func:`~shelters.selectors.shelter_get`).

    Raises:
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    data = dict(data)
    data.pop("shelter_id", None)
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
def bed_update(*, bed: Bed, data: Dict[str, Any]) -> Bed:
    """Update *bed*, including M2M relationships when provided.

    Only keys present in *data* are applied; ``None`` scalar values are
    skipped.

    The caller is responsible for resolving *bed* (e.g. via
    :func:`~shelters.selectors.bed_get`).

    Raises:
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    data = dict(data)
    data.pop("id", None)

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
def bed_delete(*, queryset: "QuerySet[Bed]") -> list[int]:
    """Delete beds in *queryset* and return the deleted IDs.

    The caller is responsible for scoping *queryset* appropriately
    (e.g. via :func:`~shelters.selectors.operator_bed_list`).

    Raises:
        ``django.core.exceptions.ObjectDoesNotExist`` when *queryset* is empty.
    """
    deleted_ids = list(queryset.values_list("pk", flat=True))
    if not deleted_ids:
        raise ObjectDoesNotExist("No matching beds found.")
    queryset.delete()
    return deleted_ids


@transaction.atomic
def bed_clone(*, queryset: "QuerySet[Bed]", bed_id: str) -> Bed:
    """Clone an existing bed, including all M2M relationships.

    The caller is responsible for scoping *queryset* and prefetching M2M
    fields (e.g. via ``operator_bed_list(...).prefetch_related(...)``).

    Raises:
        ``ObjectDoesNotExist`` when the bed is not found.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    try:
        source = queryset.get(pk=bed_id)
    except Bed.DoesNotExist:
        raise ObjectDoesNotExist(f"Bed matching ID {bed_id} could not be found.")

    return cast(Bed, source.make_clone(attrs={"name": _clone_label(source.name)}))
