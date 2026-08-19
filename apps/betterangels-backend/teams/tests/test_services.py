"""Tests for team services — name is the only identifier."""

from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from django.test import TestCase
from organizations.models import Organization
from teams.models import Team
from teams.services import team_create, team_delete, team_update


class TeamCreateTestCase(TestCase):
    def setUp(self) -> None:
        self.org = Organization.objects.create(name="team_create_org")
        self.other_org = Organization.objects.create(name="team_create_other_org")

    def test_creates_a_team_in_the_organization(self) -> None:
        team = team_create(name="Morning Outreach", organization=self.org)

        self.assertEqual(team.name, "Morning Outreach")
        self.assertEqual(team.organization_id, self.org.pk)

    def test_name_is_stripped(self) -> None:
        team = team_create(name="  Drop-in Center  ", organization=self.org)

        self.assertEqual(team.name, "Drop-in Center")

    def test_duplicate_name_in_the_same_org_is_rejected(self) -> None:
        team_create(name="Drop-in Center", organization=self.org)

        with self.assertRaises(ValidationError):
            team_create(name="Drop-in Center", organization=self.org)

    def test_duplicate_name_is_rejected_case_insensitively(self) -> None:
        team_create(name="Drop-in Center", organization=self.org)

        with self.assertRaises(ValidationError):
            team_create(name="drop-in center", organization=self.org)

    def test_same_name_in_another_org_is_allowed(self) -> None:
        first = team_create(name="Drop-in Center", organization=self.org)
        second = team_create(name="Drop-in Center", organization=self.other_org)

        self.assertEqual(first.name, second.name)
        self.assertNotEqual(first.organization_id, second.organization_id)

    def test_blank_name_is_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            team_create(name="   ", organization=self.org)

    def test_a_reused_name_is_available_after_the_holder_is_renamed(self) -> None:
        original = team_create(name="Drop-in Center", organization=self.org)
        team_update(team=original, name="Drop-in Center 2024")

        replacement = team_create(name="Drop-in Center", organization=self.org)

        self.assertEqual(replacement.name, "Drop-in Center")
        self.assertNotEqual(replacement.pk, original.pk)

    def test_a_reused_name_is_available_after_the_holder_is_deleted(self) -> None:
        original = team_create(name="Drop-in Center", organization=self.org)
        team_delete(team=original)

        replacement = team_create(name="Drop-in Center", organization=self.org)

        self.assertEqual(replacement.name, "Drop-in Center")

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
        """The boundary the rejection above sits against."""
        team = team_create(name="x" * 255, organization=self.org)

        self.assertEqual(len(team.name), 255)


class TeamUpdateTestCase(TestCase):
    def setUp(self) -> None:
        self.org = Organization.objects.create(name="team_update_org")
        self.team = team_create(name="Morning Outreach", organization=self.org)

    def test_renames_the_team(self) -> None:
        team_update(team=self.team, name="Morning Outreach Team")

        self.team.refresh_from_db()
        self.assertEqual(self.team.name, "Morning Outreach Team")

    def test_rename_to_an_existing_name_is_rejected(self) -> None:
        team_create(name="Drop-in Center", organization=self.org)

        with self.assertRaises(ValidationError):
            team_update(team=self.team, name="Drop-in Center")

    def test_rename_to_an_existing_name_is_rejected_case_insensitively(self) -> None:
        team_create(name="Drop-in Center", organization=self.org)

        with self.assertRaises(ValidationError):
            team_update(team=self.team, name="DROP-IN CENTER")

    def test_rename_to_its_own_name_is_allowed(self) -> None:
        team_update(team=self.team, name="Morning Outreach")

        self.team.refresh_from_db()
        self.assertEqual(self.team.name, "Morning Outreach")

    def test_recasing_its_own_name_is_allowed(self) -> None:
        team_update(team=self.team, name="MORNING OUTREACH")

        self.team.refresh_from_db()
        self.assertEqual(self.team.name, "MORNING OUTREACH")

    def test_rename_to_a_blank_name_is_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            team_update(team=self.team, name="   ")

    def test_omitting_the_name_leaves_it_unchanged(self) -> None:
        team_update(team=self.team)

        self.team.refresh_from_db()
        self.assertEqual(self.team.name, "Morning Outreach")
        self.assertEqual(Team.objects.filter(organization=self.org).count(), 1)

    def test_rename_longer_than_the_column_is_a_validation_error(self) -> None:
        original = self.team.name

        with self.assertRaises(ValidationError):
            team_update(team=self.team, name="y" * 256)

        self.team.refresh_from_db()
        self.assertEqual(self.team.name, original)


class TeamNameConstraintTestCase(TestCase):
    """The database enforces it too, not just the service."""

    def setUp(self) -> None:
        self.org = Organization.objects.create(name="team_constraint_org")

    def test_duplicate_name_is_rejected_by_the_database(self) -> None:
        Team.objects.create(name="Drop-in Center", organization=self.org)

        with self.assertRaises(IntegrityError):
            Team.objects.create(name="drop-in center", organization=self.org)

    def test_name_without_alphanumerics_is_rejected_by_the_model(self) -> None:
        """Declared as a field validator, so writers that never reach the
        services -- the Django admin, where name is free text -- are covered."""
        with self.assertRaises(ValidationError):
            Team(name="---", organization=self.org).full_clean()
