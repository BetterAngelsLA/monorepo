import datetime
from typing import Any, Dict, Optional, Type, TypeVar

from django.core.exceptions import ValidationError
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
            # --- DOB SANITIZATION (Valid Date Cases) ---
            (
                "Create: Date provided, Quality UNSET -> Default to FULL",
                _make(CreateHmisClientProfileInput, birth_date=DATE_1990, dob_quality=UNSET),
                None,
                {"dob_quality": HmisDobQualityEnum.FULL},
            ),
            (
                "Update: Date provided, Quality explicitly NOT_COLLECTED -> Upgrade to FULL",
                _make(
                    UpdateHmisClientProfileInput,
                    id=ID("1"),
                    birth_date=DATE_1990,
                    dob_quality=HmisDobQualityEnum.NOT_COLLECTED,
                ),
                None,
                {"dob_quality": HmisDobQualityEnum.FULL},
            ),
            # --- NEW: DOB CLEARING LOGIC (The Fix) ---
            (
                "Update: Clear Date + Quality UNSET -> Reset Quality to NOT_COLLECTED",
                _make(UpdateHmisClientProfileInput, id=ID("1"), birth_date=None, dob_quality=UNSET),
                None,
                {"dob_quality": HmisDobQualityEnum.NOT_COLLECTED},
            ),
            (
                "Update: Clear Date + Quality Invalid (FULL) -> Reset Quality to NOT_COLLECTED",
                # This simulates the frontend bug: sending birthDate: null but keeping dobQuality: FULL
                _make(UpdateHmisClientProfileInput, id=ID("1"), birth_date=None, dob_quality=HmisDobQualityEnum.FULL),
                None,
                {"dob_quality": HmisDobQualityEnum.NOT_COLLECTED},
            ),
            (
                "Update: Clear Date + Quality Valid (REFUSED) -> Keep REFUSED",
                # If user clears date but explicitly sets Refused, we should respect that.
                _make(
                    UpdateHmisClientProfileInput, id=ID("1"), birth_date=None, dob_quality=HmisDobQualityEnum.NO_ANSWER
                ),
                None,
                {"dob_quality": HmisDobQualityEnum.NO_ANSWER},
            ),
            # --- MERGE LOGIC (INSTANCE + INPUT) ---
            (
                "Merge: Input has Date, Instance has Bad Quality -> Fix Input",
                _make(UpdateHmisClientProfileInput, id=ID("1"), birth_date=DATE_1990, dob_quality=UNSET),
                HmisClientProfile(dob_quality=HmisDobQualityEnum.NOT_COLLECTED),
                {"dob_quality": HmisDobQualityEnum.FULL},
            ),
            (
                "Merge: Input has Date, Instance has Good Quality -> Keep UNSET (Don't touch)",
                _make(UpdateHmisClientProfileInput, id=ID("1"), birth_date=DATE_1990, dob_quality=UNSET),
                HmisClientProfile(dob_quality=HmisDobQualityEnum.FULL),
                {"dob_quality": UNSET},
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

    @parametrize(
        "test_id, input_data, instance_data",
        [
            (
                "Conflict: Date + Refused",
                _make(
                    UpdateHmisClientProfileInput,
                    id=ID("1"),
                    birth_date=DATE_1990,
                    dob_quality=HmisDobQualityEnum.NO_ANSWER,
                ),
                None,
            ),
            (
                "Conflict: Date + Don't Know",
                _make(
                    UpdateHmisClientProfileInput,
                    id=ID("1"),
                    birth_date=DATE_1990,
                    dob_quality=HmisDobQualityEnum.DONT_KNOW,
                ),
                None,
            ),
            (
                "Merge Conflict: Instance has Date + Input sets Refused (without clearing date)",
                _make(
                    UpdateHmisClientProfileInput,
                    id=ID("1"),
                    birth_date=UNSET,
                    dob_quality=HmisDobQualityEnum.NO_ANSWER,
                ),
                HmisClientProfile(birth_date=DATE_1990),
            ),
        ],
    )
    def test_validation_raises_error(
        self,
        test_id: str,
        input_data: Any,
        instance_data: Optional[HmisClientProfile],
    ) -> None:
        """
        Tests that invalid combinations raise a ValidationError.
        """
        with self.assertRaisesMessage(ValidationError, "Data Conflict"):
            validate_and_sanitize_hmis_profile(input_data, instance=instance_data)
