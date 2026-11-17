"""Rules shared by more than one writer.

A rule lives here when a non-service writer can violate it, so the admin, the
service and the model all reach the same definition instead of three copies.
"""

from typing import Optional

from django.core.exceptions import ValidationError


def validate_availability_counts(
    *,
    non_restricted_beds: int,
    restricted_beds: int,
    total_beds: Optional[int],
) -> None:
    """Reject availability counts that do not fit the shelter's total bed count.

    ``total_beds`` is nullable — an unknown capacity imposes no rule.

    Called from :meth:`shelters.models.ShelterAvailability.clean` (the rule),
    from the ``total_beds`` guard in :func:`shelters.services.shelter.shelter_update`
    (the other direction, lowering capacity), and from the shelter admin form.
    The admin form call is the redundant one: it exists only to move the error to
    the field before ``save_related``, because ``apply_availability`` re-runs
    ``full_clean()`` a moment later. Neither of the other two is redundant — they
    cover opposite sides of the relation.

    The sum is what violates the rule, so both counters carry the error — neither
    is wrong on its own.
    """
    if total_beds is None:
        return

    available_beds = non_restricted_beds + restricted_beds
    if available_beds > total_beds:
        message = (
            f"Unrestricted + restricted beds ({available_beds}) cannot exceed the shelter's total beds ({total_beds})."
        )
        raise ValidationError(
            {
                "non_restricted_beds": [message],
                "restricted_beds": [message],
            }
        )
