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
    """

    # --- STEP 1: PRE-FLIGHT FIX ---
    # If the user is submitting a NEW date (not clearing it), but forgot to send
    # a Quality field, we must assume the Quality is FULL.
    # Otherwise, an existing "Not Collected" in the DB will accidentally destroy this new date.
    input_dob = getattr(data, "birth_date", UNSET)
    input_quality = getattr(data, "dob_quality", UNSET)

    if input_dob is not UNSET and input_dob is not None:
        if input_quality is UNSET:
            # Mutate immediately so _get_effective_value sees it
            data.dob_quality = HmisDobQualityEnum.FULL

    # --- STEP 2: DETERMINE EFFECTIVE STATE ---
    # Now this will pick up the 'FULL' we just set, instead of falling back to DB's 'NOT_COLLECTED'
    final_quality = _get_effective_value(data, instance, "dob_quality")

    clear_date_reasons = [
        HmisDobQualityEnum.NOT_COLLECTED,
        HmisDobQualityEnum.NO_ANSWER,
        HmisDobQualityEnum.DONT_KNOW,
    ]

    # --- STEP 3: DESTRUCTIVE LOGIC ---
    # If the effective quality says "No Date Allowed", we force clear the date.
    if final_quality in clear_date_reasons:
        data.birth_date = None
        return

    # --- STEP 4: CLEANUP ---
    # Handle edge case: User cleared date explicitly (birth_date=None) but left quality as FULL
    if getattr(data, "birth_date", UNSET) is None:
        # If the date is cleared, ensure we have a valid "No Date" reason.
        if final_quality not in clear_date_reasons:
            data.dob_quality = HmisDobQualityEnum.NOT_COLLECTED


def validate_and_sanitize_hmis_profile(data: T, instance: Optional[HmisClientProfile] = None) -> T:
    _sanitize_strings(data)
    _validate_dob(data, instance)
    return data
