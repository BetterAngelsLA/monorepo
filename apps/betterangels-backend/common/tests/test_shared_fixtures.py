"""Regression coverage for the class-level fixtures in GraphQLBaseTestCase."""

from model_bakery import baker

from accounts.models import User
from common.tests.utils import GraphQLBaseTestCase
from teams.models import Team


class SharedGraphQLFixtureIsolationTest(GraphQLBaseTestCase):
    """A test's mutations must not leak into the next test's shared graph."""

    def test_1_mutations_are_confined_to_the_test(self) -> None:
        self.org_1.name = "renamed-org"
        self.org_1.save()
        self.org_1_case_manager_1.first_name = "Renamed"
        self.org_1_case_manager_1.save()
        self.org_1.add_user(baker.make(User))
        self.org_1_team_1.delete()

    def test_2_shared_graph_is_restored(self) -> None:
        self.assertEqual(self.org_1.name, "org_1")
        self.assertNotEqual(self.org_1_case_manager_1.first_name, "Renamed")
        self.assertTrue(Team.objects.filter(pk=self.org_1_team_1.pk).exists())
        self.assertEqual(self.org_1.users.count(), 3)


class SharedGraphQLFixtureRebuildTest(GraphQLBaseTestCase):
    """A class re-entry must be able to rebuild the shared graph safely."""

    def test_rebuilding_shared_fixtures_is_idempotent(self) -> None:
        from organizations.models import Organization

        before = Organization.objects.filter(name__in=("org_1", "org_2")).count()
        type(self).setUpTestData()
        after = Organization.objects.filter(name__in=("org_1", "org_2")).count()
        self.assertEqual(before, 2)
        self.assertEqual(after, 2)
