"""Unit tests for shelter privacy selector — no GraphQL, no HTTP.

Tests ``shelters.selectors.operator.shelter_list`` directly.
"""

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from model_bakery import baker
from unittest_parametrize import parametrize

from shelters.enums import StatusChoices
from shelters.models import Shelter
from shelters.selectors.operator import shelter_list


class ShelterPrivacySelectorTestCase(TestCase):
    """Verify shelter_list() respects view_private_shelter permission."""

    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()
        cls.user = baker.make("accounts.User")
        cls.public_shelter = baker.make(
            Shelter, status=StatusChoices.APPROVED, is_private=False, name="Public Shelter"
        )
        cls.private_shelter = baker.make(
            Shelter, status=StatusChoices.APPROVED, is_private=True, name="Private Shelter"
        )
        # Draft shelter — should always be excluded (not approved)
        cls.draft_shelter = baker.make(
            Shelter, status=StatusChoices.DRAFT, is_private=False, name="Draft Shelter"
        )

    # ── Without permission ────────────────────────────────────────────

    def test_unauthenticated_cannot_see_private(self) -> None:
        result = shelter_list(Shelter.objects.all(), user=None)
        self.assertIn(self.public_shelter, result)
        self.assertNotIn(self.private_shelter, result)
        self.assertNotIn(self.draft_shelter, result)  # not approved

    def test_authenticated_without_perm_cannot_see_private(self) -> None:
        result = shelter_list(Shelter.objects.all(), user=self.user)
        self.assertIn(self.public_shelter, result)
        self.assertNotIn(self.private_shelter, result)

    # ── With permission ───────────────────────────────────────────────

    def test_with_perm_can_see_private(self) -> None:
        ct = ContentType.objects.get_for_model(Shelter)
        perm = Permission.objects.get(codename="view_private_shelter", content_type=ct)
        self.user.user_permissions.add(perm)

        result = shelter_list(Shelter.objects.all(), user=self.user)
        self.assertIn(self.public_shelter, result)
        self.assertIn(self.private_shelter, result)
        self.assertNotIn(self.draft_shelter, result)  # still not approved

    # ── Edge cases ────────────────────────────────────────────────────

    def test_no_shelters_returns_empty(self) -> None:
        Shelter.objects.all().delete()
        result = shelter_list(Shelter.objects.all(), user=self.user)
        self.assertEqual(result.count(), 0)

    def test_only_private_shelter_without_perm_returns_empty(self) -> None:
        Shelter.objects.all().delete()
        baker.make(Shelter, status=StatusChoices.APPROVED, is_private=True)
        result = shelter_list(Shelter.objects.all(), user=self.user)
        self.assertEqual(result.count(), 0)

    # ── Performance: verify no query explosion ────────────────────────

    def test_query_count_constant(self) -> None:
        """shelter_list should use a constant number of queries regardless of count."""
        baker.make(Shelter, status=StatusChoices.APPROVED, is_private=False, _quantity=10)

        ct = ContentType.objects.get_for_model(Shelter)
        perm = Permission.objects.get(codename="view_private_shelter", content_type=ct)
        self.user.user_permissions.add(perm)

        # 2 permission lookups (user + group) + 1 data query = 3
        with self.assertNumQueries(3):
            result = list(shelter_list(Shelter.objects.all(), user=self.user))
        self.assertGreaterEqual(len(result), 10)
