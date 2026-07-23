"""Unit tests for operator selectors — no GraphQL, no HTTP.

Tests ``shelters.selectors.operator`` functions directly.
"""

from django.test import TestCase
from model_bakery import baker

from accounts.tests.baker_recipes import organization_recipe
from shelters.models import Bed, Room, Shelter
from shelters.selectors.operator import (
    bed_queryset,
    operator_shelter_list,
    room_queryset,
    shelter_queryset,
    user_shelter_list,
)


class OperatorShelterListTestCase(TestCase):
    """Test operator_shelter_list / user_shelter_list / shelter_queryset."""

    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()
        cls.user = baker.make("accounts.User")
        cls.org_1 = organization_recipe.make(name="org_1")
        cls.org_2 = organization_recipe.make(name="org_2")
        cls.org_1.add_user(cls.user)

        cls.shelter_org1 = baker.make(Shelter, organization=cls.org_1, name="Org1 Shelter")
        cls.shelter_org2 = baker.make(Shelter, organization=cls.org_2, name="Org2 Shelter")

    def test_operator_shelter_list_filters_to_org(self) -> None:
        result = operator_shelter_list(
            Shelter.objects.all(), user=self.user, organization_id=str(self.org_1.pk)
        )
        self.assertIn(self.shelter_org1, result)
        self.assertNotIn(self.shelter_org2, result)

    def test_operator_shelter_list_requires_membership(self) -> None:
        """User not in org_2 should get empty results."""
        result = operator_shelter_list(
            Shelter.objects.all(), user=self.user, organization_id=str(self.org_2.pk)
        )
        self.assertEqual(result.count(), 0)

    def test_user_shelter_list_shows_member_orgs_only(self) -> None:
        result = user_shelter_list(Shelter.objects.all(), user=self.user)
        self.assertIn(self.shelter_org1, result)
        self.assertNotIn(self.shelter_org2, result)

    def test_shelter_queryset_empty(self) -> None:
        """Empty shelter list for org with no shelters."""
        qs = shelter_queryset(
            user=self.user, organization_id=str(self.org_2.pk), perms=["shelters.view_shelter"]
        )
        self.assertEqual(qs.count(), 0)


class QuerysetScopingTestCase(TestCase):
    """Test bed_queryset and room_queryset org scoping (membership check only)."""

    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()
        cls.user = baker.make("accounts.User")
        cls.org_1 = organization_recipe.make(name="org_1")
        cls.org_2 = organization_recipe.make(name="org_2")
        cls.org_1.add_user(cls.user)

        cls.shelter_2 = baker.make(Shelter, organization=cls.org_2)
        cls.bed_2 = baker.make(Bed, shelter=cls.shelter_2, name="Bed B")
        cls.room_2 = baker.make(Room, shelter=cls.shelter_2, name="Room B")

    def test_bed_queryset_no_membership_returns_empty(self) -> None:
        """User not in org_2 should get no beds from org_2."""
        qs = bed_queryset(
            user=self.user, organization_id=str(self.org_2.pk), perms=["shelters.view_bed"]
        )
        self.assertEqual(qs.count(), 0)

    def test_room_queryset_no_membership_returns_empty(self) -> None:
        """User not in org_2 should get no rooms from org_2."""
        qs = room_queryset(
            user=self.user, organization_id=str(self.org_2.pk), perms=["shelters.view_room"]
        )
        self.assertEqual(qs.count(), 0)
