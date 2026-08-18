"""Read paths for teams — the styleguide's other primary test surface.

``team_list`` and ``team_get`` were previously exercised only through GraphQL,
so their org scoping was asserted several layers away from where it is
implemented.
"""

from accounts.selectors import organization_get_for_member
from accounts.tests.baker_recipes import organization_recipe
from common.tests.utils import GraphQLBaseTestCase
from teams.models import Team
from teams.selectors import team_get, team_list
from teams.services import team_create


class TeamListTestCase(GraphQLBaseTestCase):
    def test_returns_only_the_given_organizations_teams(self) -> None:
        teams = team_list(organization=self.org_1)

        self.assertTrue(teams.exists())
        self.assertEqual({t.organization_id for t in teams}, {self.org_1.pk})

    def test_orders_by_name(self) -> None:
        """Insertion order differs from name order, so this pins the contract.

        Pins the *observable* ordering, not one implementation of it: it comes
        from ``Team.Meta.ordering`` with the selector's ``order_by`` on top,
        and callers should not have to know which.

        Names are deliberately unambiguous across collations. Asserting
        against Python's ``sorted()`` instead would compare Postgres'
        locale-aware ordering with Python's codepoint ordering, and they
        disagree on case (``SLCC`` before ``Silver Lake``, or after).
        """
        org = organization_recipe.make(name="team_list_ordering_org")
        for name in ("Charlie", "Alpha", "Bravo"):
            team_create(name=name, organization=org)

        names = list(team_list(organization=org).values_list("name", flat=True))

        self.assertEqual(names, ["Alpha", "Bravo", "Charlie"])

    def test_is_empty_for_an_organization_with_no_teams(self) -> None:
        Team.objects.filter(organization=self.org_1).delete()

        self.assertEqual(list(team_list(organization=self.org_1)), [])


class TeamGetTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        team = Team.objects.filter(organization=self.org_1).first()
        assert team is not None, "the base fixture provisions teams for org_1"
        self.org_1_team: Team = team

    def test_returns_a_team_in_the_organization(self) -> None:
        self.assertEqual(team_get(pk=self.org_1_team.pk, organization=self.org_1), self.org_1_team)

    def test_returns_none_for_another_organizations_team(self) -> None:
        """The cross-org guard the update/delete mutations rely on."""
        self.assertIsNone(team_get(pk=self.org_1_team.pk, organization=self.org_2))

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
