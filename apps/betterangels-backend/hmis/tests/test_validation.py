import datetime
from typing import Any, Dict, Optional, Type, TypeVar

from django.test import SimpleTestCase
from hmis.enums import HmisDobQualityEnum
from hmis.models import HmisClientProfile
from hmis.types import CreateHmisClientProfileInput, UpdateHmisClientProfileInput
from hmis.validation import validate_and_sanitize_hmis_profile
from strawberry import ID, UNSET
from unittest_parametrize import ParametrizedTestCase, parametrize

DATE_1990 = datetime.date(1990, 1, 1)

TInput = TypeVar("TInput")


def _make(cls: Type[TInput], **kwargs: Any) -> TInput:
    """
    Constructs a Strawberry Input class with partial arguments.
    Missing arguments are left as UNSET.
    """
    return cls(**kwargs)  # type: ignore


class HmisValidationTests(ParametrizedTestCase, SimpleTestCase):

    @parametrize(
        "test_id, input_data, instance_data, expected_checks",
        [
            # --- STRING NORMALIZATION ---
            (
                "Normalize Strings",
                _make(CreateHmisClientProfileInput, email="TEST@EXAMPLE.COM", california_id="ca123"),
                None,
                {"email": "test@example.com", "california_id": "CA123"},
            ),
            # --- DOB: DEFAULTING LOGIC ---
            (
                "Create: Date provided, Quality UNSET -> Default to FULL",
                _make(CreateHmisClientProfileInput, birth_date=DATE_1990, dob_quality=UNSET),
                None,
                {"dob_quality": HmisDobQualityEnum.FULL},
            ),
            (
                "Update: Date provided, Quality explicitly NOT_COLLECTED (Conflict) -> Force Clear Date",
                # Rule change: If you say "Not Collected", we nuke the date.
                _make(
                    UpdateHmisClientProfileInput,
                    id=ID("1"),
                    birth_date=DATE_1990,
                    dob_quality=HmisDobQualityEnum.NOT_COLLECTED,
                ),
                None,
                {"birth_date": None},  # Date gets cleared
            ),
            # --- DOB: CLEARING LOGIC (Explicit Nulls) ---
            (
                "Update: Clear Date + Quality UNSET -> Reset Quality to NOT_COLLECTED",
                _make(UpdateHmisClientProfileInput, id=ID("1"), birth_date=None, dob_quality=UNSET),
                None,
                {"dob_quality": HmisDobQualityEnum.NOT_COLLECTED},
            ),
            (
                "Update: Clear Date + Quality Invalid (FULL) -> Reset Quality to NOT_COLLECTED",
                _make(UpdateHmisClientProfileInput, id=ID("1"), birth_date=None, dob_quality=HmisDobQualityEnum.FULL),
                None,
                {"dob_quality": HmisDobQualityEnum.NOT_COLLECTED},
            ),
            (
                "Update: Clear Date + Quality Valid (REFUSED) -> Keep REFUSED",
                _make(
                    UpdateHmisClientProfileInput, id=ID("1"), birth_date=None, dob_quality=HmisDobQualityEnum.NO_ANSWER
                ),
                None,
                {"dob_quality": HmisDobQualityEnum.NO_ANSWER},
            ),
            # --- DOB: CONFLICT RESOLUTION (The new "Destructive" rules) ---
            (
                "Conflict: Input Date + Quality Refused -> Force Clear Date",
                _make(
                    UpdateHmisClientProfileInput,
                    id=ID("1"),
                    birth_date=DATE_1990,
                    dob_quality=HmisDobQualityEnum.NO_ANSWER,
                ),
                None,
                {"birth_date": None},  # Data is destroyed to resolve conflict
            ),
            (
                "Conflict: Input Date + Quality Dont Know -> Force Clear Date",
                _make(
                    UpdateHmisClientProfileInput,
                    id=ID("1"),
                    birth_date=DATE_1990,
                    dob_quality=HmisDobQualityEnum.DONT_KNOW,
                ),
                None,
                {"birth_date": None},
            ),
            # --- MERGE LOGIC (INSTANCE + INPUT) ---
            (
                "Merge: Input has Date, Instance has Bad Quality -> Fix Input to FULL",
                # Date is present (input), Quality is missing (input) but Bad in DB.
                # Since we have a date, we default quality to FULL.
                _make(UpdateHmisClientProfileInput, id=ID("1"), birth_date=DATE_1990, dob_quality=UNSET),
                HmisClientProfile(dob_quality=HmisDobQualityEnum.NOT_COLLECTED),
                {"dob_quality": HmisDobQualityEnum.FULL},
            ),
            (
                "Merge Conflict: Instance has Date + Input sets Refused -> Force Clear Date",
                # User is updating ONLY the quality to "Refused", implying the date should be removed.
                _make(
                    UpdateHmisClientProfileInput,
                    id=ID("1"),
                    birth_date=UNSET,
                    dob_quality=HmisDobQualityEnum.NO_ANSWER,
                ),
                HmisClientProfile(birth_date=DATE_1990),
                {"birth_date": None},
            ),
        ],
    )
    def test_sanitization_success(
        self,
        test_id: str,
        input_data: Any,
        instance_data: Optional[HmisClientProfile],
        expected_checks: Dict[str, Any],
    ) -> None:
        """
        Tests that data is correctly mutated/sanitized based on various inputs.
        """
        validate_and_sanitize_hmis_profile(input_data, instance=instance_data)

        for field, expected_value in expected_checks.items():
            actual_value = getattr(input_data, field)
            self.assertEqual(
                actual_value,
                expected_value,
                f"Failed: {test_id} - Field '{field}' expected {expected_value}, got {actual_value}",
            )
