"""Regression coverage for the class-level fixtures in GraphQLBaseTestCase."""

from model_bakery import baker
from organizations.models import Organization

from accounts.models import User
from common.tests.utils import GraphQLBaseTestCase
from teams.models import Team

_SHARED_CLASS_ATTRS = (
    "org_1",
    "org_2",
    "org_1_team_1",
    "org_1_team_2",
    "org_2_team_1",
    "user_map",
    "org_1_case_manager_1",
    "org_1_case_manager_2",
    "org_2_case_manager_1",
    "non_case_manager_user",
)


def _save_shared_class_attrs(test_case: GraphQLBaseTestCase) -> None:
    """Restore the class-level fixture references after a test rebuilds them."""
    cls = type(test_case)
    saved = {name: getattr(cls, name) for name in _SHARED_CLASS_ATTRS}

    def restore() -> None:
        for name, value in saved.items():
            setattr(cls, name, value)

    test_case.addCleanup(restore)


class SharedGraphQLFixtureIsolationTest(GraphQLBaseTestCase):
    """A test's mutations must not leak into the next test's shared graph."""

    def test_1_mutations_are_confined_to_the_test(self) -> None:
        self.org_1.name = "renamed-org"
        self.org_1.save()
        self.org_1_case_manager_1.first_name = "Renamed"
        self.org_1_case_manager_1.save()
        self.org_1.add_user(baker.make(User))
        self.org_1_team_1.delete()

        # Assert the writes, otherwise this test passes if they silently no-op.
        self.assertEqual(Organization.objects.get(pk=self.org_1.pk).name, "renamed-org")
        self.assertEqual(self.org_1_case_manager_1.first_name, "Renamed")
        self.assertEqual(self.org_1.users.count(), 4)
        self.assertFalse(Team.objects.filter(pk=self.org_1_team_1.pk).exists())

    def test_2_shared_graph_is_restored(self) -> None:
        self.assertEqual(self.org_1.name, "org_1")
        self.assertNotEqual(self.org_1_case_manager_1.first_name, "Renamed")
        self.assertTrue(Team.objects.filter(pk=self.org_1_team_1.pk).exists())
        self.assertEqual(self.org_1.users.count(), 3)


class SharedGraphQLFixtureRebuildTest(GraphQLBaseTestCase):
    """A class re-entry must be able to rebuild the shared graph safely."""

    def test_rebuilding_shared_fixtures_is_idempotent(self) -> None:
        _save_shared_class_attrs(self)
        cls = type(self)
        before = Organization.objects.filter(name__in=("org_1", "org_2")).count()
        cls.setUpTestData()
        after = Organization.objects.filter(name__in=("org_1", "org_2")).count()
        self.assertEqual(before, 2)
        self.assertEqual(after, 2)
