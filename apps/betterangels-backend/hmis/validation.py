from typing import Any, Optional, TypeVar, Union

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
    Mutates data to enforce DOB rules.
    Rule: If the Quality indicates the date is unknown/refused/not collected,
    we MUST clear the birth_date.
    """
    # 1. Determine the effective quality (Input > DB > None)
    final_quality = _get_effective_value(data, instance, "dob_quality")

    # 2. Define the states that mandate a cleared date
    clear_date_reasons = [
        HmisDobQualityEnum.NOT_COLLECTED,
        HmisDobQualityEnum.NO_ANSWER,
        HmisDobQualityEnum.DONT_KNOW,
    ]

    # 3. CRITICAL RULE: If quality is one of the "Missing" types, force clear the date.
    if final_quality in clear_date_reasons:
        # We explicitly overwrite any input or existing date with None
        data.birth_date = None
        return

    # 4. If we are here, the Quality allows for a date. Let's check the date.
    final_dob = _get_effective_value(data, instance, "birth_date")

    if final_dob:
        # If we have a date, but quality is missing (None), default it to FULL.
        # (Note: We don't need to check for NOT_COLLECTED here because Step 3 handled it)
        if not final_quality:
            data.dob_quality = HmisDobQualityEnum.FULL

    # 5. Handle case where Date is manually cleared (set to None)
    #    but Quality wasn't updated.
    elif getattr(data, "birth_date", UNSET) is None:
        # If the user explicitly cleared the date, ensure we have a valid "No Date" reason.
        # If the current quality is FULL or APPROXIMATE (or missing), revert to NOT_COLLECTED.
        valid_no_date_reasons = clear_date_reasons

        if final_quality not in valid_no_date_reasons:
            data.dob_quality = HmisDobQualityEnum.NOT_COLLECTED


def validate_and_sanitize_hmis_profile(data: T, instance: Optional[HmisClientProfile] = None) -> T:
    _sanitize_strings(data)
    _validate_dob(data, instance)
    return data
