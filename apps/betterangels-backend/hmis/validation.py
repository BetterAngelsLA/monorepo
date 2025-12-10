from typing import Any, Optional, TypeVar, Union

from django.core.exceptions import ValidationError
from hmis.enums import HmisDobQualityEnum
from hmis.models import HmisClientProfile
from hmis.types import CreateHmisClientProfileInput, UpdateHmisClientProfileInput
from strawberry import UNSET

HmisProfileInput = Union[CreateHmisClientProfileInput, UpdateHmisClientProfileInput]
T = TypeVar("T", bound=HmisProfileInput)


def _get_effective_value(data: T, instance: Optional[HmisClientProfile], field_name: str) -> Any:
    """
    Helper to determine the 'Effective State' of a field.
    Priority: Input Data > Existing DB Instance > None
    """
    # 1. Get the value from the input (defaulting to UNSET if missing)
    input_val = getattr(data, field_name, UNSET)

    # 2. CRITICAL: Check 'is not UNSET' to handle None (Clear) vs UNSET (Ignore)
    #    If input_val is None, we MUST return None (not fall back to instance)
    if input_val is not UNSET:
        return input_val

    # 3. Fallback: Only use instance if input was truly UNSET
    return getattr(instance, field_name, None) if instance else None


def _sanitize_strings(data: T) -> None:
    """
    Mutates data to enforce standard casing (Lowercase Email, Uppercase IDs).
    """
    # We use 'is not UNSET' to ensure we process even empty strings if passed
    if (email := getattr(data, "email", UNSET)) is not UNSET and email:
        data.email = email.lower()

    if (cid := getattr(data, "california_id", UNSET)) is not UNSET and cid:
        data.california_id = cid.upper()


def _validate_dob(data: T, instance: Optional[HmisClientProfile]) -> None:
    """
    Mutates data to enforce DOB Quality rules.
    """
    final_dob = _get_effective_value(data, instance, "birth_date")
    final_quality = _get_effective_value(data, instance, "dob_quality")

    # CASE A: Date Exists
    if final_dob:
        if not final_quality or final_quality == HmisDobQualityEnum.NOT_COLLECTED:
            data.dob_quality = HmisDobQualityEnum.FULL
            final_quality = HmisDobQualityEnum.FULL  # Update local for next check

        invalid_qualities = [HmisDobQualityEnum.NO_ANSWER, HmisDobQualityEnum.DONT_KNOW]
        if final_quality in invalid_qualities:
            raise ValidationError(
                "Data Conflict: You cannot provide a specific Birth Date "
                "if the Data Quality is set to 'Refused' or 'Client Doesn't Know'. "
                "Please update the Quality field."
            )

    # CASE B: Date is being Cleared (None)
    elif getattr(data, "birth_date", UNSET) is None:
        input_quality = getattr(data, "dob_quality", UNSET)

        # These are the ONLY valid qualities when you have no birth date
        valid_no_date_reasons = [
            HmisDobQualityEnum.NO_ANSWER,
            HmisDobQualityEnum.DONT_KNOW,
            HmisDobQualityEnum.NOT_COLLECTED,
        ]

        # If the provided quality is NOT one of the valid reasons (or is missing/null),
        # default it to "Not Collected".
        if input_quality not in valid_no_date_reasons:
            data.dob_quality = HmisDobQualityEnum.NOT_COLLECTED


def validate_and_sanitize_hmis_profile(data: T, instance: Optional[HmisClientProfile] = None) -> T:
    _sanitize_strings(data)
    _validate_dob(data, instance)
    return data
