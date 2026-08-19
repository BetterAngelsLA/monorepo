"""Read paths for teams — the styleguide's other primary test surface.

``team_list`` and ``team_get`` were previously exercised only through GraphQL,
so their org scoping was asserted several layers away from where it is
implemented.
"""

from accounts.selectors import organization_get_for_member
from accounts.tests.baker_recipes import organization_recipe
from common.tests.utils import GraphQLBaseTestCase
from teams.selectors import team_get, team_list
from teams.services import team_create


class TeamListTestCase(GraphQLBaseTestCase):
    def test_returns_only_the_given_organizations_teams(self) -> None:
        teams = team_list(organization=self.org_1)

        self.assertTrue(teams.exists())
        self.assertEqual({t.organization_id for t in teams}, {self.org_1.pk})

    def test_orders_by_name(self) -> None:
        """Names are deliberately unambiguous across collations.

        Asserting against Python's ``sorted()`` would compare Postgres'
        locale-aware ordering with Python's codepoint ordering, and the two
        disagree on case.
        """
        org = organization_recipe.make(name="team_list_ordering_org")
        for name in ("Charlie", "Alpha", "Bravo"):
            team_create(name=name, organization=org)

        names = list(team_list(organization=org).values_list("name", flat=True))

        self.assertEqual(names, ["Alpha", "Bravo", "Charlie"])

    def test_is_empty_for_an_organization_with_no_teams(self) -> None:
        org = organization_recipe.make()

        self.assertEqual(list(team_list(organization=org)), [])


class TeamGetTestCase(GraphQLBaseTestCase):
    def test_returns_a_team_in_the_organization(self) -> None:
        self.assertEqual(team_get(pk=self.org_1_team_1.pk, organization=self.org_1), self.org_1_team_1)

    def test_returns_none_for_another_organizations_team(self) -> None:
        """The cross-org guard the update/delete mutations rely on."""
        self.assertIsNone(team_get(pk=self.org_1_team_1.pk, organization=self.org_2))

    def test_returns_none_for_an_unknown_pk(self) -> None:
        self.assertIsNone(team_get(pk=999999, organization=self.org_1))


class OrganizationGetForMemberTestCase(GraphQLBaseTestCase):
    """Backs the ``teams`` query — the header names an org, membership grants it."""

    def test_returns_the_organization_for_a_member(self) -> None:
        org = organization_get_for_member(user=self.org_1_case_manager_1, organization_id=self.org_1.pk)

        self.assertEqual(org, self.org_1)

    def test_accepts_a_string_id_as_the_header_delivers_it(self) -> None:
        org = organization_get_for_member(user=self.org_1_case_manager_1, organization_id=str(self.org_1.pk))

        self.assertEqual(org, self.org_1)

    def test_returns_none_for_an_organization_the_user_is_not_in(self) -> None:
        self.assertFalse(self.org_2.users.filter(pk=self.org_1_case_manager_1.pk).exists())

        self.assertIsNone(organization_get_for_member(user=self.org_1_case_manager_1, organization_id=self.org_2.pk))

    def test_returns_none_for_an_unknown_organization(self) -> None:
        self.assertIsNone(organization_get_for_member(user=self.org_1_case_manager_1, organization_id=999999))

    def test_returns_none_for_a_malformed_id_rather_than_raising(self) -> None:
        """A junk header must read as a denial, not a 500."""
        self.assertIsNone(organization_get_for_member(user=self.org_1_case_manager_1, organization_id="not-an-id"))
