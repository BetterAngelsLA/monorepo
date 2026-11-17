"""Write helpers for shelter availability, shared by the admin and the API."""

from typing import Any, Mapping, Optional

from django.core.exceptions import ValidationError
from strawberry import UNSET

from shelters.models import AVAILABILITY_FIELDS, Shelter, ShelterAvailability
from shelters.services.utils import rekey_validation_errors


def apply_availability(shelter: Shelter, values: Mapping[str, Any]) -> Optional[ShelterAvailability]:
    """Persist availability *values* onto *shelter*'s row.

    Only the whitelisted fields are written. Values that already match are
    skipped, so a profile save that does not touch availability leaves no
    ``ShelterAvailabilityEvent`` in the audit log, and a missing row is created
    with a single INSERT instead of an INSERT followed by an UPDATE.

    Returns the row (including when nothing changed) so callers can reuse it, or
    ``None`` when the payload carried no availability field. Raises
    ``ValidationError`` keyed under ``availability`` when the model rules reject
    the result.
    """
    payload = {field: values[field] for field in AVAILABILITY_FIELDS if field in values and values[field] is not UNSET}
    if not payload:
        return None

    # ``restriction_notes`` is non-null with a blank default: a null note clears it.
    if "restriction_notes" in payload and payload["restriction_notes"] is None:
        payload["restriction_notes"] = ""

    # Get-then-insert is safe only because every caller writes the shelter row
    # first (``shelter_update`` saves it, the admin form saves it), and that
    # UPDATE holds a row lock on the shelter until the transaction commits — so
    # two first writes cannot both miss this row and collide on the OneToOne.
    # A caller that skips the shelter write would need a lock or a retry here.
    try:
        availability = ShelterAvailability.objects.get(shelter=shelter)
    except ShelterAvailability.DoesNotExist:
        availability = ShelterAvailability(shelter=shelter)
        changed = payload
    else:
        # Reuse the caller's instance so full_clean() need not query the FK.
        availability.shelter = shelter
        changed = {field: value for field, value in payload.items() if getattr(availability, field) != value}
        if not changed:
            return availability

    for field, value in changed.items():
        setattr(availability, field, value)

    try:
        # Both checks are redundant here: the row was addressed by its shelter, and
        # the shelter is an instance the caller fetched or just saved. Skipping the
        # FK-existence probe and the OneToOne uniqueness re-check takes an
        # availability write from four queries to two.
        availability.full_clean(exclude=["shelter"], validate_unique=False)
    except ValidationError as exc:
        raise ValidationError(rekey_validation_errors(exc, "availability")) from exc

    availability.save()
    return availability
