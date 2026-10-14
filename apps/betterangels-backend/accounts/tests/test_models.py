import pytest
from django.core.exceptions import ValidationError
from django.test import TestCase
from model_bakery import baker
from organizations.models import Organization

from accounts.models import OrganizationProfile, OrgTypeChoices, User, validate_iana_time_zone


class UserModelTestCase(TestCase):
    def test_str_method(self) -> None:
        user_with_name = baker.make(User, first_name="Dale", last_name="Cooper")
        user_without_name = baker.make(User)

        self.assertEqual(f"{user_with_name}", "Dale Cooper")
        self.assertEqual(f"{user_without_name}", f"{user_without_name.pk}")

    def test_full_name(self) -> None:
        user_1 = baker.make(User, first_name="Dale", middle_name=None, last_name="Cooper")
        self.assertEqual(user_1.full_name, "Dale Cooper")

        user_2 = baker.make(User, first_name="Dale", middle_name="Bartholomew", last_name="Cooper")
        self.assertEqual(user_2.full_name, "Dale Bartholomew Cooper")

    def test_save(self) -> None:
        user = baker.make(User, email="LOWERCASEME@EXAMPLE.COM")
        self.assertEqual(user.email, "lowercaseme@example.com")

        user.email = ""
        user.save()
        self.assertIsNone(user.email)


class OrganizationProfileTimeZoneValidatorTestCase(TestCase):
    """The stored report calendar has to be a zone ``zoneinfo`` can resolve.

    A typo here would otherwise sit in the data and mislabel every period the
    organization reports on — the failure would show up as wrong dates months
    later, not as an error at save time.
    """

    def test_a_known_iana_name_is_accepted(self) -> None:
        validate_iana_time_zone("America/Los_Angeles")

    def test_blank_is_allowed_and_means_the_site_default(self) -> None:
        validate_iana_time_zone("")

    def test_an_unknown_name_is_rejected(self) -> None:
        with pytest.raises(ValidationError):
            validate_iana_time_zone("America/Los_Angelos")

    def test_an_offset_is_rejected(self) -> None:
        """An offset is not a calendar: it cannot answer DST at a given instant."""
        with pytest.raises(ValidationError):
            validate_iana_time_zone("-08:00")

    def test_the_model_runs_the_validator_on_full_clean(self) -> None:
        profile = baker.make(
            OrganizationProfile,
            organization=baker.make(Organization),
            org_types=[OrgTypeChoices.OUTREACH],
        )
        profile.time_zone = "Not/AZone"

        with pytest.raises(ValidationError):
            profile.full_clean()
