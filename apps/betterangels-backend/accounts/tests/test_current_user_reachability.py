"""Frontend reachability (ADR 0001 phase 3, finding F24).

The contract the frontend gates on: ``currentUser.permissions`` is the GLOBAL
permission list (superuser / global roles / user_permissions), and
``currentUser.organizations`` is the GRANTS-BASED org list — membership, direct
grants, inherited delegations, and all orgs for global holders — with per-org
permissions now including grant-derived role permissions.
"""

from accounts.models import Role, User
from accounts.services import grant_create, grant_delegate, role_assign, sync_roles
from accounts.tests.baker_recipes import organization_recipe
from common.tests.utils import GraphQLBaseTestCase
from django.contrib.auth.models import Permission
from model_bakery import baker
from shelters.groups import GLOBAL_SHELTER_OPERATOR_ROLE, SHELTER_OPERATOR_ROLE


class CurrentUserGlobalPermissionsTestCase(GraphQLBaseTestCase):
    QUERY = """
        query {
            currentUser {
                permissions
                organizations: organizationsOrganization {
                    name
                }
            }
        }
    """

    def setUp(self) -> None:
        super().setUp()
        sync_roles()
        self.gso_role = Role.objects.get(name=GLOBAL_SHELTER_OPERATOR_ROLE.name)
        self.shelter_role = Role.objects.get(name=SHELTER_OPERATOR_ROLE.name)

    def _permissions(self) -> list[str]:
        response = self.execute_graphql(self.QUERY)
        self.assertIsNone(response.get("errors"))
        return list(response["data"]["currentUser"]["permissions"])

    def test_superuser_holds_every_permission(self) -> None:
        admin = baker.make(User, is_superuser=True)
        self.graphql_client.force_login(admin)

        perms = self._permissions()

        self.assertIn("shelters.view_shelter", perms)
        self.assertIn("accounts.view_user", perms)

    def test_global_role_holder_reports_the_roles_permissions(self) -> None:
        gso = baker.make(User)
        role_assign(user=gso, role=self.gso_role)
        self.graphql_client.force_login(gso)

        perms = self._permissions()

        self.assertIn("shelters.view_shelter", perms)
        self.assertIn("shelters.delete_shelter", perms)

    def test_direct_user_permissions_are_reported(self) -> None:
        user = baker.make(User)
        app_label, codename = "shelters.view_shelter".split(".")
        user.user_permissions.add(Permission.objects.get(codename=codename, content_type__app_label=app_label))
        self.graphql_client.force_login(user)

        self.assertIn("shelters.view_shelter", self._permissions())

    def test_scoped_grant_permissions_are_not_in_the_global_list(self) -> None:
        """Grant-derived permissions are per-org, not global (finding F24)."""
        user = baker.make(User)
        org = organization_recipe.make(name="Scoped Org")
        grant_create(user=user, role=self.shelter_role, scope_org=org)
        self.graphql_client.force_login(user)

        self.assertNotIn("shelters.view_shelter", self._permissions())


class CurrentUserGrantsBasedOrgListTestCase(GraphQLBaseTestCase):
    QUERY = """
        query {
            currentUser {
                organizations: organizationsOrganization {
                    name
                    permissions
                }
            }
        }
    """

    def setUp(self) -> None:
        super().setUp()
        sync_roles()
        self.shelter_role = Role.objects.get(name=SHELTER_OPERATOR_ROLE.name)

    def _orgs(self) -> dict[str, list[str]]:
        response = self.execute_graphql(self.QUERY)
        self.assertIsNone(response.get("errors"))
        return {o["name"]: o["permissions"] for o in response["data"]["currentUser"]["organizations"]}

    def test_membership_orgs_still_appear(self) -> None:
        user = baker.make(User)
        org = organization_recipe.make(name="Member Org")
        org.add_user(user)
        self.graphql_client.force_login(user)

        self.assertIn("Member Org", self._orgs())

    def test_direct_grant_org_without_membership_appears(self) -> None:
        """A user granted a role at an org they are not a member of sees it."""
        user = baker.make(User)
        org = organization_recipe.make(name="Granted Org")
        grant_create(user=user, role=self.shelter_role, scope_org=org)
        self.graphql_client.force_login(user)

        orgs = self._orgs()
        self.assertIn("Granted Org", orgs)
        # Per-org permissions now include the grant role's permissions.
        self.assertIn("shelters.view_shelter", orgs["Granted Org"])

    def test_delegated_org_appears_for_an_acting_member(self) -> None:
        """Org B delegates to C; a member-with-grant at B sees C."""
        b = organization_recipe.make(name="Org B")
        c = organization_recipe.make(name="Org C")
        grant_delegate(principal_org=b, role=self.shelter_role, scope_org=c)

        user = baker.make(User)
        b.add_user(user)
        grant_create(user=user, role=self.shelter_role, scope_org=b)
        self.graphql_client.force_login(user)

        orgs = self._orgs()
        self.assertIn("Org B", orgs)
        self.assertIn("Org C", orgs)
        self.assertIn("shelters.view_shelter", orgs["Org C"])

    def test_global_holder_sees_every_org(self) -> None:
        """A GSO sees all orgs, membership or not (ADR 0001 §2.6)."""
        organization_recipe.make(name="Unowned Org")
        gso = baker.make(User)
        role_assign(user=gso, role=Role.objects.get(name=GLOBAL_SHELTER_OPERATOR_ROLE.name))
        self.graphql_client.force_login(gso)

        self.assertIn("Unowned Org", self._orgs())

    def test_consultant_grant_without_membership_does_not_inherit_delegations(self) -> None:
        """No amplification: a grant at B without membership does not surface C."""
        b = organization_recipe.make(name="Org B")
        c = organization_recipe.make(name="Org C")
        grant_delegate(principal_org=b, role=self.shelter_role, scope_org=c)

        user = baker.make(User)
        grant_create(user=user, role=self.shelter_role, scope_org=b)
        self.graphql_client.force_login(user)

        orgs = self._orgs()
        self.assertIn("Org B", orgs)
        self.assertNotIn("Org C", orgs)
