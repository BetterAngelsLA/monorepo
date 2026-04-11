from django.core.exceptions import ValidationError
from django.test import TestCase
from shelters.enums import AccessibilityChoices, DemographicChoices
from shelters.models import Accessibility, Demographic, Shelter
from shelters.services import _validate_subset_attributes


class ValidateSubsetAttributesTestCase(TestCase):
    """Tests for _validate_subset_attributes."""

    def setUp(self) -> None:
        self.shelter = Shelter.objects.create(name="Test Shelter")
        allowed_demographic, _ = Demographic.objects.get_or_create(name=DemographicChoices.SINGLE_MEN)
        self.shelter.demographics.add(allowed_demographic)
        allowed_accessibility, _ = Accessibility.objects.get_or_create(name=AccessibilityChoices.WHEELCHAIR_ACCESSIBLE)
        self.shelter.accessibility.add(allowed_accessibility)

    def test_valid_subset_passes(self) -> None:
        """Providing values that are all on the shelter raises no error."""
        _validate_subset_attributes(self.shelter, {"demographics": [DemographicChoices.SINGLE_MEN]})

    def test_multiple_valid_fields_pass(self) -> None:
        """Multiple common fields, each a valid subset, raises no error."""
        _validate_subset_attributes(
            self.shelter,
            {
                "demographics": [DemographicChoices.SINGLE_MEN],
                "accessibility": [AccessibilityChoices.WHEELCHAIR_ACCESSIBLE],
            },
        )

    def test_invalid_value_raises_validation_error(self) -> None:
        """A value not on the shelter raises ValidationError."""
        with self.assertRaises(ValidationError) as ctx:
            _validate_subset_attributes(self.shelter, {"demographics": [DemographicChoices.FAMILIES]})
        self.assertIn("demographics", ctx.exception.message_dict)

    def test_mix_of_valid_and_invalid_raises(self) -> None:
        """Even one invalid value in the list raises ValidationError."""
        with self.assertRaises(ValidationError) as ctx:
            _validate_subset_attributes(
                self.shelter,
                {"demographics": [DemographicChoices.SINGLE_MEN, DemographicChoices.SENIORS]},
            )
        self.assertIn("demographics", ctx.exception.message_dict)

    def test_empty_list_skips_validation(self) -> None:
        """An empty list for a field is skipped — no error raised."""
        _validate_subset_attributes(self.shelter, {"demographics": []})

    def test_missing_field_key_is_skipped(self) -> None:
        """Fields absent from m2m_data are not validated."""
        _validate_subset_attributes(self.shelter, {})

    def test_field_not_in_common_m2m_fields_is_ignored(self) -> None:
        """Keys that are not in _COMMON_M2M_FIELDS are silently ignored."""
        _validate_subset_attributes(self.shelter, {"shelter_types": ["building"]})

    def test_raw_string_values_are_accepted(self) -> None:
        """Raw strings (as opposed to enum instances) work via getattr(v, 'value', v)."""
        _validate_subset_attributes(self.shelter, {"demographics": [DemographicChoices.SINGLE_MEN.value]})
