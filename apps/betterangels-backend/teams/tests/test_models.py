"""Team deletion through the writers that never reach ``teams.services.team_delete``."""

from accounts.tests.baker_recipes import organization_recipe
from django.db.models import RestrictedError
from django.test import TestCase
from model_bakery import baker
from notes.models import Note
from tasks.models import Task

from teams.models import Team


class TeamDeletionTestCase(TestCase):
    def setUp(self) -> None:
        self.organization = organization_recipe.make(owner_roles=())
        self.team = baker.make(Team, organization=self.organization)

    def test_a_queryset_delete_is_refused_too(self) -> None:
        """The writer ``team_delete`` cannot cover — no service call, no ``clean()``."""
        baker.make(Note, organization=self.organization, team=self.team)

        with self.assertRaises(RestrictedError):
            Team.objects.filter(pk=self.team.pk).delete()

        self.assertTrue(Team.objects.filter(pk=self.team.pk).exists())

    def test_deleting_the_organization_still_removes_its_teams_and_notes(self) -> None:
        """``Note.organization`` is CASCADE, so the notes go too and nothing is stranded.

        This is why ``RESTRICT`` rather than ``PROTECT``: ``PROTECT`` refuses even when
        the referencing rows are themselves being deleted by the same cascade.
        """
        baker.make(Note, organization=self.organization, team=self.team)

        self.organization.delete()

        self.assertFalse(Team.objects.filter(pk=self.team.pk).exists())
        self.assertFalse(Note.objects.filter(team_id=self.team.pk).exists())

    def test_deleting_the_organization_is_refused_when_a_task_holds_a_team(self) -> None:
        """``Task.organization`` is SET_NULL, so the task outlives its organization.

        That makes it *not* a candidate for deletion via the cascade, so ``RESTRICT``
        fires and the organization cannot be deleted until the task releases the team.
        Notes are unaffected — ``Note.organization`` is CASCADE.
        """
        baker.make(Task, organization=self.organization, team=self.team)

        with self.assertRaises(RestrictedError):
            self.organization.delete()
