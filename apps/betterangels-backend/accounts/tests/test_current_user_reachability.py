"""Frontend reachability (ADR 0001 phase 3, finding F24).

The contract the frontend gates on:

- ``currentUser.permissions`` — the GLOBAL permission list: superuser → every
  product-modeled permission, otherwise global Roles / ``user_permissions``
  (bounded to the modeled set).
- ``currentUser.organizations`` — the FINITE grants-based org list (membership,
  direct grants, inherited delegations); never every org for a global holder —
  their cross-org reach is unscoped reads + ``currentUser.permissions``.
- per-org ``permissions`` — EFFECTIVE: org-scoped perms (grants, delegations,
  legacy groups) plus the global tier folded in where the backend enforces it.
"""

from accounts.groups import ORG_ADMIN
from accounts.models import Role, User
from accounts.role_manager import OrgRoleManager
from accounts.services import grant_create, grant_delegate, role_assign, sync_roles
from accounts.tests.baker_recipes import organization_recipe
from common.tests.utils import GraphQLBaseTestCase
from django.contrib.auth.models import Permission
from model_bakery import baker
from shelters.groups import GLOBAL_SHELTER_OPERATOR_ROLE, SHELTER_OPERATOR_ROLE
from shelters.models import Shelter
from teams.models import Team


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

    def test_superuser_holds_every_modeled_permission(self) -> None:
        """A superuser holds every product-modeled permission — and nothing else.

        ``global_permissions`` is bounded server-side to the modeled catalog
        (the registry the FE ``PermissionEnum`` is generated from): real DB
        permissions the product never gates on (e.g. ``accounts.view_user``,
        ``auth.add_permission``) must not ship to the client as gateable state.
        """
        admin = baker.make(User, is_superuser=True)
        self.graphql_client.force_login(admin)

        perms = self._permissions()

        self.assertIn("shelters.view_shelter", perms)
        self.assertIn("reports.view_reports", perms)
        # Real DB permissions the FE does not model are not exposed.
        self.assertNotIn("accounts.view_user", perms)
        self.assertNotIn("auth.add_permission", perms)

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

    def test_global_holder_org_list_is_finite_membership_only(self) -> None:
        """A GSO sees NO orgs in the switcher unless member/granted there.

        A global holder's cross-org reach is unscoped reads + ``currentUser.permissions``
        (ADR 0001 §5.2) — the FE org list is never expanded to every org in the
        platform (no "All" mode / every-org enumeration).
        """
        organization_recipe.make(name="Unowned Org")
        gso = baker.make(User)
        role_assign(user=gso, role=Role.objects.get(name=GLOBAL_SHELTER_OPERATOR_ROLE.name))
        self.graphql_client.force_login(gso)

        self.assertEqual(self._orgs(), {})

    def test_global_holder_member_org_lists_effective_global_perms(self) -> None:
        """A GSO who is also a member sees that org, with the global tier folded in.

        The per-org entry is EFFECTIVE (``global_permissions(user) ∪ org-scoped``)
        — the complete "what can I do fully here" answer.
        """
        org = organization_recipe.make(name="GSO Member Org")
        gso = baker.make(User)
        role_assign(user=gso, role=Role.objects.get(name=GLOBAL_SHELTER_OPERATOR_ROLE.name))
        org.add_user(gso)
        self.graphql_client.force_login(gso)

        orgs = self._orgs()
        self.assertIn("GSO Member Org", orgs)
        self.assertIn("shelters.view_shelter", orgs["GSO Member Org"])
        self.assertIn("shelters.change_shelter", orgs["GSO Member Org"])

    def test_superuser_member_org_entry_is_effective_and_list_is_finite(self) -> None:
        """A superuser's member org entry folds grant-only global perms, not legacy-only ones.

        ``currentUser.permissions`` carries every permission, but the org entry
        only claims what is enforceable at the org: grant-only (shelters) global
        perms fold in (``can()`` honors the global tier at any org), while
        legacy-only-domain perms (e.g. ``accounts.view_user``) are group-gated
        even for superusers (``HasOrgPerm`` never consults the global tier).  The
        org list stays finite (no unowned orgs).
        """
        org = organization_recipe.make(name="Super Member Org")
        organization_recipe.make(name="Unowned Super Org")
        admin = baker.make(User, is_superuser=True)
        org.add_user(admin)
        self.graphql_client.force_login(admin)

        orgs = self._orgs()
        self.assertIn("Super Member Org", orgs)
        # Grant-only global perms are enforceable at any org via can().
        self.assertIn("shelters.view_shelter", orgs["Super Member Org"])
        self.assertIn("shelters.change_shelter", orgs["Super Member Org"])
        # Legacy-only-domain perms stay group-gated even for a superuser.
        self.assertNotIn("accounts.view_user", orgs["Super Member Org"])
        self.assertNotIn("reports.view_reports", orgs["Super Member Org"])
        self.assertNotIn("Unowned Super Org", orgs)

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

    def test_a_user_permission_holder_org_list_is_finite(self) -> None:
        """A ``user_permission`` is 'acts anywhere' for reach, but the switcher stays finite.

        No membership or grant at an org → it does not appear in the FE org list;
        the permission rides ``currentUser.permissions`` and unscoped reads.
        """
        organization_recipe.make(name="Unjoined Perm Org")
        user = baker.make(User)
        app_label, codename = "shelters.view_shelter".split(".")
        user.user_permissions.add(Permission.objects.get(codename=codename, content_type__app_label=app_label))
        self.graphql_client.force_login(user)

        self.assertEqual(self._orgs(), {})

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
        # EFFECTIVE entry: the legacy org role AND the acts-anywhere permission
        # both show — the global tier is folded into the org's list.
        self.assertEqual(orgs["Legacy Plus Perm Org"], ["accounts.view_user", "shelters.view_shelter"])

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
    """The org-scoped FE gate equals ``can()`` at each org (grant-only domain).

    ``hasPermission(P)`` at org O is a single membership test on O's EFFECTIVE
    entry (the global tier is folded in server-side where enforceable, finding
    H2), so ``P ∈ entry[O]`` must equal ``can(user, P, org=O)`` for the
    grant-only (shelters) domain — otherwise the UI hides actions the backend
    allows or shows actions it refuses.  No client union with
    ``currentUser.permissions``: the global tier reaches the gate only through
    the fold.

    Fixtures span scoped grant-only, grant + unrelated ``user_permission`` (the
    collision case), a weak-role delegated holder, and a ``user_permission``
    holder who is a member of the org (exercising the fold non-vacuously).
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
        """For every switchable org and every shelter perm: entry ≡ can()."""
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
        # Org entries are EFFECTIVE (the global tier is folded in server-side),
        # so the gate is a single membership test — no client union.  The query
        # still selects ``permissions`` to exercise the global-list transport.
        orgs = {o["name"]: set(o["permissions"]) for o in response["data"]["currentUser"]["organizations"]}

        for org_name, org_perms in orgs.items():
            org = Organization.objects.get(name=org_name)
            for perm in self.SHELTER_PERMS:
                reported = perm in org_perms
                self.assertEqual(
                    reported,
                    can(user, perm, org=org),
                    f"{perm} at {org_name}: entry says {reported}, can() says otherwise",
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

    def test_user_permission_holder_member_org_folds_the_global_tier(self) -> None:
        """A ``user_permission`` holder who is a member: the entry folds the grant-only perm.

        ``can()`` honors the ``user_permission`` at any org (``scopes()`` is ALL
        for it), so the effective entry at a member org must carry it — the
        non-vacuous case the plain ``user_permission``-only fixture cannot reach
        (it has no switchable orgs).  The non-held shelter perms must stay out
        of the entry and remain ``can()``-false.
        """
        org = organization_recipe.make(name="Equiv Perm Member Org")
        user = baker.make(User)
        org.add_user(user)
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


class CurrentUserLegacyDomainReportEquivalenceTestCase(GraphQLBaseTestCase):
    """The per-org report's legacy arm equals legacy (``PermissionGroup``) enforcement.

    Member management and reports are still enforced through ``HasOrgPerm`` —
    gated per org by the legacy ``PermissionGroup`` predicate
    (``permissioned_queryset``), not by grants (``can()``).  The report must
    agree with that predicate so the admin UI neither hides an action the
    backend allows nor shows one it refuses.

    Teams cut over to grant-only (mutations read ``can()``; ``teams`` is in
    ``LEGACY_INERT_APPS``), so its per-org presence comes from the grant arm
    (ORG_ADMIN/ORG_SUPERUSER roles, backfilled) and the global tier folds —
    like shelters.  The ORG_ADMIN template bundle is still the fixture of
    record: an ORG_ADMIN member's org entry carries the full bundle through
    grant (teams, reports) + legacy (member management) arms combined.

    Cutover contract: this class encodes the CURRENT state.  When the
    remaining legacy-only domains flip (reports, member management) the
    report's arms and this test must flip in lockstep — the equivalence
    predicate becomes ``can()`` and the domain's app_label moves into
    ``LEGACY_INERT_APPS``.  These tests are the tripwire: they fail the
    moment the report and the enforcement predicate disagree.

    The global-tier × legacy-only cross product is pinned here too: a superuser
    or ``user_permission`` holder carries these permissions in
    ``currentUser.permissions`` (acts-anywhere for ``scopes()``), but the legacy
    predicate never consults the global tier — so the effective per-org fold
    must NOT advertise them at an org the user has no group in (finding H2).
    """

    # The ORG_ADMIN template is the canonical role for member management /
    # reports / teams (accounts/groups.py) — the full reported bundle.
    LEGACY_PERMS = tuple(str(p) for p in ORG_ADMIN.permissions)

    def setUp(self) -> None:
        super().setUp()
        # Provision the Role rows so ORG_ADMIN memberships mirror Grants at the
        # m2m edge (the grant arm the report reads teams from).
        sync_roles()
        # Presets create the ORG_ADMIN PermissionGroup on the org.
        self.org = organization_recipe.make(name="Legacy Admin Org")

    def _report(self) -> tuple[set[str], dict[str, set[str]]]:
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
        return global_perms, orgs

    def _legacy_holds(self, user: User, perm: str) -> bool:
        """The exact predicate ``HasOrgPerm`` enforces for the active org."""
        from common.permissions.utils import permissioned_queryset
        from organizations.models import Organization

        return permissioned_queryset(
            Organization.objects.all(),
            user=user,
            organization_id=str(self.org.pk),
            perms=[perm],
            any_perm=True,
            organization_field="pk",
        ).exists()

    def test_org_admin_member_report_matches_legacy_enforcement(self) -> None:
        """An ORG_ADMIN member: the report carries exactly the enforceable perms."""
        user = baker.make(User)
        self.org.add_user(user)
        OrgRoleManager(self.org).add_roles(user, ORG_ADMIN)
        self.graphql_client.force_login(user)

        global_perms, orgs = self._report()
        org_perms = orgs[self.org.name]

        # Sanity: the role is actually reported per org…
        self.assertIn("organizations.add_org_member", org_perms)
        self.assertIn("reports.view_reports", org_perms)
        self.assertIn("teams.add_team", org_perms)
        # …and nothing more than the group + role grants (no amplification).
        self.assertEqual(org_perms, set(self.LEGACY_PERMS))

        # Every reported perm is enforceable by the predicate that enforces it:
        # teams.* is grant-only (``can()``), member management / reports are
        # legacy (``permissioned_queryset``).  Asserting the legacy predicate
        # for teams would pass vacuously while the ORG_ADMIN member still holds
        # the (now inert) legacy group, letting report-vs-enforcement drift
        # through unnoticed.
        from common.permissions.selectors import can

        for perm in self.LEGACY_PERMS:
            reported = perm in org_perms or perm in global_perms
            self.assertTrue(reported, f"{perm} not reported for an ORG_ADMIN member")
            if perm.startswith("teams."):
                self.assertTrue(
                    can(user, perm, org=self.org),
                    f"{perm} reported but grant enforcement denies",
                )
            else:
                self.assertTrue(self._legacy_holds(user, perm), f"{perm} reported but legacy enforcement denies")

    def test_plain_member_report_matches_legacy_enforcement(self) -> None:
        """A member with no role: nothing reported, nothing enforceable."""
        user = baker.make(User)
        self.org.add_user(user)
        self.graphql_client.force_login(user)

        global_perms, orgs = self._report()
        org_perms = orgs[self.org.name]

        self.assertEqual(org_perms, set())
        self.assertEqual(global_perms, set())
        for perm in self.LEGACY_PERMS:
            self.assertFalse(self._legacy_holds(user, perm), f"{perm} held without any PermissionGroup")

    def test_superuser_org_entry_is_group_scoped_for_legacy_only_domains(self) -> None:
        """A superuser's per-org entry folds grant-only global perms, not legacy-only ones.

        ``currentUser.permissions`` (the global list) carries every permission —
        including member management / reports / teams.  The grant-only domains
        (shelters, teams) enforce the global tier at any org via ``can()``, so
        their perms fold into the entry.  Member management and reports are
        still ``HasOrgPerm`` → org ``PermissionGroup`` rows, which never consult
        the global tier (no superuser bypass) — advertising them at an org
        where the superuser has no group would show controls the backend
        refuses.
        """
        user = baker.make(User, is_superuser=True)
        self.org.add_user(user)
        self.graphql_client.force_login(user)

        global_perms, orgs = self._report()
        org_perms = orgs[self.org.name]

        # The global list still reports everything…
        self.assertIn("reports.view_reports", global_perms)
        self.assertIn("shelters.view_shelter", global_perms)

        # …but the org entry only claims what is enforceable at the org.
        self.assertIn("shelters.view_shelter", org_perms)  # grant-only: folds
        self.assertIn("shelters.change_shelter", org_perms)  # grant-only: folds
        self.assertIn("teams.add_team", org_perms)  # grant-only (cutover): folds
        self.assertIn("teams.change_team", org_perms)  # grant-only (cutover): folds
        self.assertNotIn("reports.view_reports", org_perms)  # legacy-only: group-gated
        self.assertNotIn("organizations.add_org_member", org_perms)  # legacy-only
        for perm in ("reports.view_reports", "organizations.add_org_member"):
            self.assertFalse(self._legacy_holds(user, perm), f"{perm} enforceable for a groupless superuser")

    def test_superuser_org_entry_folds_legacy_perms_once_in_the_group(self) -> None:
        """…and adding the superuser to the org's group surfaces the legacy perms.

        The scoped (legacy) arm runs even for a superuser — the old
        "global subsumes everything" short-circuit would have hidden these.
        """
        user = baker.make(User, is_superuser=True)
        self.org.add_user(user)
        OrgRoleManager(self.org).add_roles(user, ORG_ADMIN)
        self.graphql_client.force_login(user)

        _, orgs = self._report()
        org_perms = orgs[self.org.name]
        self.assertIn("organizations.add_org_member", org_perms)
        self.assertIn("reports.view_reports", org_perms)
        self.assertIn("teams.add_team", org_perms)
        for perm in ("organizations.add_org_member", "reports.view_reports"):
            self.assertTrue(self._legacy_holds(user, perm), f"{perm} not enforceable for a grouped superuser")

    def test_user_permission_on_legacy_only_domain_is_not_org_enforceable(self) -> None:
        """A ``user_permission`` on a legacy-only perm is global-tier but NOT org-enforceable.

        ``scopes()``/``global_permissions`` treat a ``user_permission`` as
        acts-anywhere (``can()`` would even say yes at the org), but the legacy
        domain's per-org gate reads org groups only — so it must not surface in
        the org entry (the FE must not gate that org's legacy-domain UI on the
        global list).  A grant-only ``user_permission`` (shelters, teams) DOES
        fold, because ``can()`` honors the global tier there.
        """
        user = baker.make(User)
        self.org.add_user(user)
        member_perm = Permission.objects.get(codename="add_org_member", content_type__app_label="organizations")
        teams_perm = Permission.objects.get(codename="add_team", content_type__app_label="teams")
        shelters_perm = Permission.objects.get(codename="view_shelter", content_type__app_label="shelters")
        user.user_permissions.add(member_perm, teams_perm, shelters_perm)
        self.graphql_client.force_login(user)

        global_perms, orgs = self._report()
        org_perms = orgs[self.org.name]

        # All three are global-tier…
        self.assertIn("organizations.add_org_member", global_perms)
        self.assertIn("teams.add_team", global_perms)
        self.assertIn("shelters.view_shelter", global_perms)
        # …but only the grant-only ones are enforceable at the org.
        self.assertNotIn("organizations.add_org_member", org_perms)
        self.assertIn("teams.add_team", org_perms)
        self.assertIn("shelters.view_shelter", org_perms)
        self.assertFalse(self._legacy_holds(user, "organizations.add_org_member"))


class CurrentUserTeamsReportCanEquivalenceTestCase(GraphQLBaseTestCase):
    """teams (grant-only domain): the org entry equals ``can()`` per org.

    Mirrors the shelters equivalence (``CurrentUserReportCanEquivalenceTestCase``):
    the FE's ``hasPermission(P)`` at org O is a membership test on O's effective
    entry, so ``P ∈ entry[O]`` must equal ``can(user, P, org=O)`` for the
    grant-only teams domain — otherwise the admin UI hides/shows team actions
    the backend allows/refuses.  This is the tripwire that catches a drift
    between ``teams`` in ``LEGACY_INERT_APPS`` and the grant-only mutations.
    """

    TEAM_PERMS = (Team.perms.VIEW, Team.perms.ADD, Team.perms.CHANGE, Team.perms.DELETE)

    def setUp(self) -> None:
        super().setUp()
        sync_roles()
        self.org = organization_recipe.make(name="Teams Equiv Org")

    def _assert_report_matches_can(self, user: User) -> None:
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
        orgs = {o["name"]: set(o["permissions"]) for o in response["data"]["currentUser"]["organizations"]}

        for org_name, org_perms in orgs.items():
            org = Organization.objects.get(name=org_name)
            for perm in self.TEAM_PERMS:
                reported = perm in org_perms
                self.assertEqual(
                    reported,
                    can(user, perm, org=org),
                    f"{perm} at {org_name}: entry says {reported}, can() says otherwise",
                )

    def test_scoped_grant_only(self) -> None:
        """A scoped grant alone: report matches can() at the grant org."""
        org = organization_recipe.make(name="Teams Equiv Grant Org")
        user = baker.make(User)
        org.add_user(user)
        role, _ = Role.objects.get_or_create(name="Teams Equiv Admin", is_global=False)
        for perm in self.TEAM_PERMS:
            app_label, codename = perm.split(".")
            role.permissions.add(Permission.objects.get(codename=codename, content_type__app_label=app_label))
        grant_create(user=user, role=role, scope_org=org)
        self.graphql_client.force_login(user)

        self._assert_report_matches_can(user)

    def test_superuser_member_folds_all_team_perms(self) -> None:
        """A member superuser: every team perm folds and can() is true at the org."""
        user = baker.make(User, is_superuser=True)
        self.org.add_user(user)
        self.graphql_client.force_login(user)

        self._assert_report_matches_can(user)

    def test_user_permission_holder_member_folds_the_global_tier(self) -> None:
        """A member holding teams.view_team via user_permissions: entry folds it."""
        org = organization_recipe.make(name="Teams Equiv Perm Member Org")
        user = baker.make(User)
        org.add_user(user)
        app_label, codename = Team.perms.VIEW.split(".")
        user.user_permissions.add(Permission.objects.get(codename=codename, content_type__app_label=app_label))
        self.graphql_client.force_login(user)

        self._assert_report_matches_can(user)
