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
from shelters.models import Shelter


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

    def test_weak_holder_at_b_does_not_report_strong_delegated_perms_at_c(self) -> None:
        """Permission-matched report: a VIEW-only member of B does not see B's delegated
        Shelter-Operator permissions at C (the audit C-1 no-amplification rule)."""
        view_role, _ = Role.objects.get_or_create(name="Reachability Viewer", is_global=False)
        app_label, codename = "shelters.view_shelter".split(".")
        view_role.permissions.add(Permission.objects.get(codename=codename, content_type__app_label=app_label))

        b = organization_recipe.make(name="Weak B")
        c = organization_recipe.make(name="Weak C")
        grant_delegate(principal_org=b, role=self.shelter_role, scope_org=c)

        user = baker.make(User)
        b.add_user(user)
        grant_create(user=user, role=view_role, scope_org=b)
        self.graphql_client.force_login(user)

        orgs = self._orgs()
        self.assertIn("Weak C", orgs)
        # VIEW is inherited (the user's role at B carries it)…
        self.assertIn("shelters.view_shelter", orgs["Weak C"])
        # …but the strong delegated perms are not (permission-matched ∩).
        self.assertNotIn("shelters.change_shelter", orgs["Weak C"])
        self.assertNotIn("shelters.delete_shelter", orgs["Weak C"])

    def test_a_user_permission_holder_sees_every_org(self) -> None:
        """A ``user_permission`` is 'acts anywhere': every org is reachable."""
        organization_recipe.make(name="Unjoined Perm Org")
        user = baker.make(User)
        app_label, codename = "shelters.view_shelter".split(".")
        user.user_permissions.add(Permission.objects.get(codename=codename, content_type__app_label=app_label))
        self.graphql_client.force_login(user)

        orgs = self._orgs()
        self.assertIn("Unjoined Perm Org", orgs)
        # No org-scoped grants or legacy roles there — the acts-anywhere perm is
        # carried by the global list, not duplicated per org.
        self.assertEqual(orgs["Unjoined Perm Org"], [])

    def test_an_org_scoped_grant_survives_an_unrelated_user_permission(self) -> None:
        """The report is never skipped for acts-anywhere holders.

        A grant-derived permission must stay visible per org even when the user
        also holds an unrelated ``user_permission`` — emptying the per-org report
        would hide an action ``can()`` allows.
        """
        org = organization_recipe.make(name="Granted Plus Perm Org")
        user = baker.make(User)
        org.add_user(user)
        grant_create(user=user, role=self.shelter_role, scope_org=org)
        app_label, codename = "accounts.view_user".split(".")
        user.user_permissions.add(Permission.objects.get(codename=codename, content_type__app_label=app_label))
        self.graphql_client.force_login(user)

        orgs = self._orgs()
        self.assertIn("Granted Plus Perm Org", orgs)
        self.assertIn("shelters.change_shelter", orgs["Granted Plus Perm Org"])

    def test_a_legacy_org_role_survives_an_unrelated_user_permission(self) -> None:
        """Legacy per-org roles are still reported for acts-anywhere holders."""
        from accounts.models import PermissionGroup

        org = organization_recipe.make(name="Legacy Plus Perm Org")
        user = baker.make(User)
        org.add_user(user)
        group = PermissionGroup.objects.create(organization=org, label="Hand-granted role")
        app_label, codename = "accounts.view_user".split(".")
        group.permissions.add(Permission.objects.get(codename=codename, content_type__app_label=app_label))
        group.user_set.add(user)
        # An unrelated acts-anywhere permission must not empty the per-org report.
        app_label, codename = "shelters.view_shelter".split(".")
        user.user_permissions.add(Permission.objects.get(codename=codename, content_type__app_label=app_label))
        self.graphql_client.force_login(user)

        orgs = self._orgs()
        self.assertIn("Legacy Plus Perm Org", orgs)
        self.assertEqual(orgs["Legacy Plus Perm Org"], ["accounts.view_user"])

    def test_reported_shelter_perms_are_enforceable(self) -> None:
        """Property (domain-aware): the report never claims a grant-only perm
        (``LEGACY_INERT_APPS``) that ``can()`` would deny at that org."""
        from common.permissions.selectors import can
        from organizations.models import Organization

        b = organization_recipe.make(name="Prop B")
        c = organization_recipe.make(name="Prop C")
        grant_delegate(principal_org=b, role=self.shelter_role, scope_org=c)

        user = baker.make(User)
        b.add_user(user)
        grant_create(user=user, role=self.shelter_role, scope_org=b)
        self.graphql_client.force_login(user)

        for name, perms in self._orgs().items():
            org = Organization.objects.get(name=name)
            for perm in perms:
                if perm.startswith("shelters."):
                    self.assertTrue(can(user, perm, org=org), f"{perm} reported at {name} but not enforceable")


class CurrentUserReportCanEquivalenceTestCase(GraphQLBaseTestCase):
    """The FE union (per-org ∪ global) equals ``can()`` at each org.

    ``user_permissions`` are per-permission "acts anywhere", so the frontend's
    ``hasPermission(P)`` at org O — ``P ∈ orgPermissions[O]`` or
    ``P ∈ globalPermissions`` — must equal ``can(user, P, org=O)``.  Otherwise
    the UI hides actions the backend allows or shows actions it refuses.
    Fixtures span grant-only, user_permission-only, grant + unrelated
    ``user_permission`` (the collision case), and a weak-role delegated holder.
    """

    SHELTER_PERMS = (
        Shelter.perms.VIEW,
        Shelter.perms.ADD,
        Shelter.perms.CHANGE,
        Shelter.perms.DELETE,
    )

    def setUp(self) -> None:
        super().setUp()
        sync_roles()
        self.shelter_role = Role.objects.get(name=SHELTER_OPERATOR_ROLE.name)

    def _assert_report_matches_can(self, user: User) -> None:
        """For every reachable org and every shelter perm: report ≡ can()."""
        from common.permissions.selectors import can
        from organizations.models import Organization

        response = self.execute_graphql(
            """
            query {
                currentUser {
                    permissions
                    organizations: organizationsOrganization {
                        name
                        permissions
                    }
                }
            }
            """
        )
        self.assertIsNone(response.get("errors"))
        global_perms = set(response["data"]["currentUser"]["permissions"])
        orgs = {o["name"]: set(o["permissions"]) for o in response["data"]["currentUser"]["organizations"]}

        for org_name, org_perms in orgs.items():
            org = Organization.objects.get(name=org_name)
            for perm in self.SHELTER_PERMS:
                reported = perm in org_perms or perm in global_perms
                self.assertEqual(
                    reported,
                    can(user, perm, org=org),
                    f"{perm} at {org_name}: report says {reported}, can() says otherwise",
                )

    def test_scoped_grant_only(self) -> None:
        """A scoped grant alone: report matches can() at the grant org."""
        org = organization_recipe.make(name="Equiv Grant Org")
        user = baker.make(User)
        org.add_user(user)
        grant_create(user=user, role=self.shelter_role, scope_org=org)
        self.graphql_client.force_login(user)

        self._assert_report_matches_can(user)

    def test_user_permission_only(self) -> None:
        """An unscoped user_permission alone: carried globally, can() applies everywhere."""
        organization_recipe.make(name="Equiv Unjoined Org")
        user = baker.make(User)
        app_label, codename = "shelters.view_shelter".split(".")
        user.user_permissions.add(Permission.objects.get(codename=codename, content_type__app_label=app_label))
        self.graphql_client.force_login(user)

        self._assert_report_matches_can(user)

    def test_grant_plus_unrelated_user_permission(self) -> None:
        """The collision case: the unrelated permission must not leak (or hide)."""
        org = organization_recipe.make(name="Equiv Mixed Org")
        organization_recipe.make(name="Equiv Mixed Unjoined Org")
        user = baker.make(User)
        org.add_user(user)
        grant_create(user=user, role=self.shelter_role, scope_org=org)
        app_label, codename = "accounts.view_user".split(".")
        user.user_permissions.add(Permission.objects.get(codename=codename, content_type__app_label=app_label))
        self.graphql_client.force_login(user)

        self._assert_report_matches_can(user)

    def test_weak_role_delegated_holder(self) -> None:
        """Delegation with a weak role at B: only shared perms are inherited at C."""
        view_role, _ = Role.objects.get_or_create(name="Equiv Delegation Viewer", is_global=False)
        app_label, codename = "shelters.view_shelter".split(".")
        view_role.permissions.add(Permission.objects.get(codename=codename, content_type__app_label=app_label))
        b = organization_recipe.make(name="Equiv Delegator B")
        c = organization_recipe.make(name="Equiv Delegatee C")
        grant_delegate(principal_org=b, role=self.shelter_role, scope_org=c)

        user = baker.make(User)
        b.add_user(user)
        grant_create(user=user, role=view_role, scope_org=b)
        self.graphql_client.force_login(user)

        self._assert_report_matches_can(user)
