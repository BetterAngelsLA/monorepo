"""Shared fixtures for the teams test suites."""

import uuid
from typing import Any

from accounts.groups import ORG_ADMIN
from accounts.models import User
from accounts.role_manager import OrgRoleManager
from common.tests.utils import GraphQLBaseTestCase
from model_bakery import baker
from teams.models import Team

TEAM_FIELDS = "id name"


class TeamGraphQLBaseTestCase(GraphQLBaseTestCase):
    """An org admin in ``org_1``, acting as ``org_1``, with a team in each org.

    Both organizations get the same team fixture so that any test asserting
    "only my org's" is asserting scoping rather than a difference in the data.
    """

    def setUp(self) -> None:
        super().setUp()

        self.org_1_admin = self._make_org_admin(org=self.org_1)
        self.org_2_admin = self._make_org_admin(org=self.org_2)

        self.org_1_team = Team.objects.get(name="WDI On-site", organization=self.org_1)
        self.org_2_team = Team.objects.get(name="WDI On-site", organization=self.org_2)

        self.graphql_client.force_login(self.org_1_admin)
        self._set_active_org(self.org_1)

    def _make_org_admin(self, *, org: Any) -> User:
        user = baker.make(User, username=f"org_admin_{uuid.uuid4()}")
        org.add_user(user)
        OrgRoleManager(org).add_roles(user, ORG_ADMIN)
        return user
