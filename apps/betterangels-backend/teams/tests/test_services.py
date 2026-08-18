"""Tests for team services — slug stability and name uniqueness."""

from django.core.exceptions import ValidationError
from django.test import TestCase
from organizations.models import Organization
from teams.models import Team
from teams.services import team_create, team_update


class TeamCreateTestCase(TestCase):
    def setUp(self) -> None:
        self.org = Organization.objects.create(name="team_create_org")
        self.other_org = Organization.objects.create(name="team_create_other_org")

    def test_slug_is_derived_from_the_name(self) -> None:
        team = team_create(name="WDI On-site", organization=self.org)

        self.assertEqual(team.slug, "wdi-on-site")
        self.assertEqual(team.name, "WDI On-site")

    def test_name_is_stripped(self) -> None:
        team = team_create(name="  Hollywood Outreach  ", organization=self.org)

        self.assertEqual(team.name, "Hollywood Outreach")

    def test_duplicate_name_in_the_same_org_is_rejected(self) -> None:
        team_create(name="Hollywood Outreach", organization=self.org)

        with self.assertRaises(ValidationError):
            team_create(name="Hollywood Outreach", organization=self.org)

    def test_duplicate_name_is_rejected_case_insensitively(self) -> None:
        team_create(name="Hollywood Outreach", organization=self.org)

        with self.assertRaises(ValidationError):
            team_create(name="hollywood outreach", organization=self.org)

    def test_same_name_in_another_org_is_allowed(self) -> None:
        first = team_create(name="Hollywood Outreach", organization=self.org)
        second = team_create(name="Hollywood Outreach", organization=self.other_org)

        self.assertEqual(first.slug, second.slug)
        self.assertNotEqual(first.organization_id, second.organization_id)

    def test_name_without_alphanumerics_is_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            team_create(name="!!!", organization=self.org)

    def test_slug_held_by_a_renamed_team_does_not_block_the_name(self) -> None:
        # A team renamed away from "Hollywood Outreach" keeps its original slug,
        # so creating a new team with that name must still succeed.
        original = team_create(name="Hollywood Outreach", organization=self.org)
        team_update(team=original, name="Hollywood Outreach 2024")

        replacement = team_create(name="Hollywood Outreach", organization=self.org)

        self.assertEqual(original.slug, "hollywood-outreach")
        self.assertEqual(replacement.slug, "hollywood-outreach-2")
        self.assertEqual(replacement.name, "Hollywood Outreach")

    def test_name_longer_than_the_column_is_a_validation_error(self) -> None:
        """Services call ``full_clean()`` before ``save()``, per the styleguide.

        Nothing else bounds the length — the GraphQL input is an unbounded
        String — so without it the value reached Postgres and came back as
        ``DataError: value too long for type character varying(255)``, a 500
        rather than a message the caller can act on.
        """
        with self.assertRaises(ValidationError):
            team_create(name="x" * 256, organization=self.org)

        self.assertFalse(Team.objects.filter(organization=self.org).exists())

    def test_a_name_at_the_column_limit_is_accepted(self) -> None:
        """The derived slug is shorter than the name column, so it is truncated.

        Found by adding ``full_clean()``: a 150-character name is legal
        (``name`` allows 255) but produced a 150-character slug against a
        column that allows 100.
        """
        team = team_create(name="x" * 255, organization=self.org)

        self.assertEqual(len(team.name), 255)
        self.assertLessEqual(len(team.slug), 100)

    def test_truncated_slugs_stay_unique_within_the_org(self) -> None:
        first = team_create(name="y" * 250, organization=self.org)
        second = team_create(name="y" * 250 + " two", organization=self.org)

        self.assertNotEqual(first.slug, second.slug)
        self.assertLessEqual(len(second.slug), 100)


class TeamUpdateTestCase(TestCase):
    def setUp(self) -> None:
        self.org = Organization.objects.create(name="team_update_org")
        self.team = team_create(name="WDI On-site", organization=self.org)

    def test_rename_does_not_move_the_slug(self) -> None:
        """The slug is the stable identifier — report fixtures key off it."""
        team_update(team=self.team, name="WDI Onsite")

        self.team.refresh_from_db()
        self.assertEqual(self.team.name, "WDI Onsite")
        self.assertEqual(self.team.slug, "wdi-on-site")

    def test_rename_to_an_existing_name_is_rejected(self) -> None:
        team_create(name="Hollywood Outreach", organization=self.org)

        with self.assertRaises(ValidationError):
            team_update(team=self.team, name="Hollywood Outreach")

    def test_rename_to_its_own_name_is_allowed(self) -> None:
        team_update(team=self.team, name="WDI On-site")

        self.team.refresh_from_db()
        self.assertEqual(self.team.name, "WDI On-site")

    def test_rename_to_a_blank_name_is_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            team_update(team=self.team, name="   ")

    def test_omitting_the_name_leaves_it_unchanged(self) -> None:
        team_update(team=self.team)

        self.team.refresh_from_db()
        self.assertEqual(self.team.name, "WDI On-site")
        self.assertEqual(Team.objects.filter(organization=self.org).count(), 1)

    def test_rename_longer_than_the_column_is_a_validation_error(self) -> None:
        original = self.team.name

        with self.assertRaises(ValidationError):
            team_update(team=self.team, name="y" * 256)

        self.team.refresh_from_db()
        self.assertEqual(self.team.name, original)
