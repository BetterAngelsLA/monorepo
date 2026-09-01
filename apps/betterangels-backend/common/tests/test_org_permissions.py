"""HasOrgPerm must match the user's group against the permission-holding group.

``Organization.permission_groups`` is multi-valued, so two chained ``.filter()``
calls on it build independent joins and can be satisfied by different groups.
That made ``HasOrgPerm(X)`` mean "the user is in some group of this org, and
some group of this org has X" — and since every org is provisioned with every
template, effectively "any member holds every permission in their org".
"""

import uuid

from accounts.groups import ORG_ADMIN
from accounts.models import PermissionGroup, PermissionGroupTemplate, User
from accounts.role_manager import OrgRoleManager
from accounts.tests.baker_recipes import organization_recipe
from django.contrib.auth.models import Permission
from django.test import TestCase, ignore_warnings
from model_bakery import baker
from organizations.models import Organization
from shelters.models import Shelter
from teams.models import Team

from common.permissions.utils import permissioned_queryset, user_holds_org_bypass_perms
from common.tests.utils import GraphQLBaseTestCase

CREATE_TEAM = """
    mutation ($data: CreateTeamInput!) {
        createTeam(data: $data) {
            ... on OperationInfo { messages { kind field message } }
            ... on TeamType { id name }
        }
    }
"""


@ignore_warnings(category=UserWarning)
class OrgPermSameGroupTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

        # Provision the Org Admin template for org_1 so the org holds a group
        # carrying teams.* — the permissions the caseworker must NOT inherit.
        self.org_1_admin = baker.make(User, username=f"org_admin_{uuid.uuid4()}")
        self.org_1.add_user(self.org_1_admin)
        OrgRoleManager(self.org_1).add_roles(self.org_1_admin, ORG_ADMIN)

        self._set_active_org(self.org_1)

    def _create_team(self, name: str) -> dict:
        return self.execute_graphql(CREATE_TEAM, {"data": {"name": name}})

    def test_org_admin_can_create_a_team(self) -> None:
        """The permission still works for the group that actually holds it."""
        self.graphql_client.force_login(self.org_1_admin)

        response = self._create_team("Admin Team")

        team_id = response["data"]["createTeam"]["id"]
        self.assertEqual(Team.objects.get(pk=team_id).organization_id, self.org_1.pk)

    def test_caseworker_cannot_create_a_team(self) -> None:
        """A caseworker holds no teams.* perms, even though Org Admin does."""
        self.graphql_client.force_login(self.org_1_case_manager_1)

        response = self._create_team("Caseworker Team")

        payload = (response.get("data") or {}).get("createTeam") or {}
        self.assertIsNone(payload.get("id"))
        self.assertEqual(Team.objects.filter(name="Caseworker Team").count(), 0)


class PermissionedQuerysetSameGroupTestCase(TestCase):
    """Direct coverage of the helper, independent of any app's mutations.

    The end-to-end case above goes through ``createTeam``; this pins the same
    rule at the level the fix lives, so it still holds if that mutation changes.
    """

    def setUp(self) -> None:
        self.org = organization_recipe.make(name="perm_same_group_org")
        self.user = baker.make(User, username=f"member_{uuid.uuid4()}")
        self.org.add_user(self.user)

        groups = list(PermissionGroup.objects.filter(organization=self.org)[:2])
        assert len(groups) >= 2, "the org recipe should provision at least two permission groups"
        self.member_group, self.holder_group = groups[0], groups[1]

        permission = Permission.objects.exclude(pk__in=self.member_group.permissions.values("pk")).first()
        assert permission is not None
        self.permission = permission

        # The permission lives in one group; the user belongs to the other.
        self.holder_group.permissions.add(self.permission)
        self.member_group.user_set.add(self.user)

    def _matches(self) -> bool:
        perm = f"{self.permission.content_type.app_label}.{self.permission.codename}"
        return permissioned_queryset(
            Organization.objects.all(),
            user=self.user,
            organization_id=str(self.org.pk),
            perms=[perm],
            organization_field="pk",
        ).exists()

    def test_membership_in_one_group_does_not_borrow_another_groups_permission(self) -> None:
        self.assertFalse(self._matches())

    def test_membership_in_the_holding_group_matches(self) -> None:
        self.holder_group.user_set.add(self.user)

        self.assertTrue(self._matches())


class PermissionedQuerysetBypassTestCase(TestCase):
    """Direct coverage of the org-bypass branch in ``permissioned_queryset``.

    Pins the permission-scoped semantics at the layer where they live: a user
    holding a permission through an org-bypassing role matches rows in *any*
    organization, but only for permissions the bypass template actually
    carries. Also covers the ``any_perm=False`` (all-perms) path for both the
    org-scoped and bypass branches, plus the resolver-branch helper.
    """

    def setUp(self) -> None:
        self.org_1 = organization_recipe.make(name="bypass_org_1")
        self.org_2 = organization_recipe.make(name="bypass_org_2")

        self.bypass_user = baker.make(User, username=f"bypass_{uuid.uuid4()}")
        self.bypass_template = PermissionGroupTemplate.objects.create(
            name="Bypass Test Role", bypasses_org_scoping=True
        )
        self.bypass_group = PermissionGroup.objects.create(organization=self.org_1, template=self.bypass_template)
        self.bypass_user.groups.add(self.bypass_group)

        self.org_user = baker.make(User, username=f"org_member_{uuid.uuid4()}")
        self.org_group = PermissionGroup.objects.create(organization=self.org_1, label="org-only-role")
        self.org_user.groups.add(self.org_group)

    @staticmethod
    def _perm(perm_str: str) -> Permission:
        app_label, codename = perm_str.split(".")
        return Permission.objects.get(codename=codename, content_type__app_label=app_label)

    def _matches(self, user: User, perms: list[str], organization_id: str, *, any_perm: bool = True) -> bool:
        return permissioned_queryset(
            Organization.objects.all(),
            user=user,
            organization_id=organization_id,
            perms=perms,
            any_perm=any_perm,
            organization_field="pk",
        ).exists()

    # ── Bypass: cross-org, permission-scoped ────────────────────────────

    def test_bypass_user_matches_any_org_when_holding_perm(self) -> None:
        self.bypass_group.permissions.add(self._perm(Shelter.perms.VIEW))

        self.assertTrue(self._matches(self.bypass_user, [Shelter.perms.VIEW], str(self.org_1.id)))
        # Same grant, different org: the bypass descopes the org filter.
        self.assertTrue(self._matches(self.bypass_user, [Shelter.perms.VIEW], str(self.org_2.id)))

    def test_bypass_user_without_perm_matches_nothing(self) -> None:
        """Permission-scoped: the bypass never grants what the template lacks."""
        self.assertFalse(self._matches(self.bypass_user, [Shelter.perms.VIEW], str(self.org_2.id)))
        # Even in the org hosting the bypass group.
        self.assertFalse(self._matches(self.bypass_user, [Shelter.perms.VIEW], str(self.org_1.id)))

    def test_bypass_user_any_perm_true_requires_one(self) -> None:
        self.bypass_group.permissions.add(self._perm(Shelter.perms.VIEW))

        self.assertTrue(self._matches(self.bypass_user, [Shelter.perms.VIEW, Shelter.perms.CHANGE], str(self.org_2.id)))

    def test_bypass_user_any_perm_false_requires_all(self) -> None:
        self.bypass_group.permissions.add(self._perm(Shelter.perms.VIEW))

        # Holds VIEW via the bypass but not CHANGE: the all-perms bypass must not fire.
        self.assertFalse(
            self._matches(
                self.bypass_user, [Shelter.perms.VIEW, Shelter.perms.CHANGE], str(self.org_2.id), any_perm=False
            )
        )

        self.bypass_group.permissions.add(self._perm(Shelter.perms.CHANGE))
        self.assertTrue(
            self._matches(
                self.bypass_user, [Shelter.perms.VIEW, Shelter.perms.CHANGE], str(self.org_2.id), any_perm=False
            )
        )

    # ── Non-bypass: strictly org-scoped ─────────────────────────────────

    def test_org_scoped_user_does_not_leak_across_orgs(self) -> None:
        self.org_group.permissions.add(self._perm(Shelter.perms.VIEW))

        self.assertTrue(self._matches(self.org_user, [Shelter.perms.VIEW], str(self.org_1.id)))
        self.assertFalse(self._matches(self.org_user, [Shelter.perms.VIEW], str(self.org_2.id)))

    def test_org_scoped_any_perm_false_requires_all(self) -> None:
        """Pins the and_-reduce org-scoped path (no bypass involved)."""
        self.org_group.permissions.add(self._perm(Shelter.perms.VIEW))

        self.assertFalse(
            self._matches(self.org_user, [Shelter.perms.VIEW, Shelter.perms.CHANGE], str(self.org_1.id), any_perm=False)
        )

        self.org_group.permissions.add(self._perm(Shelter.perms.CHANGE))
        self.assertTrue(
            self._matches(self.org_user, [Shelter.perms.VIEW, Shelter.perms.CHANGE], str(self.org_1.id), any_perm=False)
        )

    # ── Resolver-branch helper ──────────────────────────────────────────

    def test_user_holds_org_bypass_perms_is_permission_scoped(self) -> None:
        self.bypass_group.permissions.add(self._perm(Shelter.perms.VIEW))

        self.assertTrue(user_holds_org_bypass_perms(self.bypass_user, [Shelter.perms.VIEW]))
        self.assertFalse(user_holds_org_bypass_perms(self.bypass_user, [Shelter.perms.CHANGE]))
        self.assertFalse(
            user_holds_org_bypass_perms(self.bypass_user, [Shelter.perms.VIEW, Shelter.perms.CHANGE], any_perm=False)
        )
        # The empty-perms guard: all([]) is vacuously True, so it must return False.
        self.assertFalse(user_holds_org_bypass_perms(self.bypass_user, []))

    # ── Membership-only path: bypass never applies ─────────────────────

    def test_bypass_does_not_extend_the_membership_only_path(self) -> None:
        """perms=None is a plain org-membership check, bypass or not.

        The bypass branch needs a permission to gate on; the membership branch
        has none, so even a bypass user stays confined to orgs they belong to.
        """
        from shelters.tests.baker_recipes import shelter_recipe

        self.org_1.users.add(self.bypass_user)
        shelter_in_host = shelter_recipe.make(organization=self.org_1)
        shelter_in_other = shelter_recipe.make(organization=self.org_2)

        host_pks = permissioned_queryset(
            Shelter.objects.all(),
            user=self.bypass_user,
            organization_id=str(self.org_1.id),
            perms=None,
            organization_field="organization_id",
        ).values_list("pk", flat=True)
        self.assertIn(shelter_in_host.pk, host_pks)
        self.assertNotIn(shelter_in_other.pk, host_pks)

        # Not a member of org_2: membership-only access matches nothing there.
        self.assertFalse(
            permissioned_queryset(
                Shelter.objects.all(),
                user=self.bypass_user,
                organization_id=str(self.org_2.id),
                perms=None,
                organization_field="organization_id",
            ).exists()
        )

    # ── Empty perms: org-scoped only, bypass never fires ───────────────

    def test_empty_perms_does_not_drop_the_org_filter(self) -> None:
        """perms=[] must stay org-scoped — even a bypass user sees only the requested org.

        Without the guard, ``(org_filter & Q()) | Q()`` collapses to an
        unfiltered ``Q()``: an empty OR-reduce is the identity, so the bypass
        branch would match *everything* with no permission to gate on. Pins
        that empty perms behave like the pre-bypass org-only path.
        """
        from shelters.tests.baker_recipes import shelter_recipe

        shelter_in_host = shelter_recipe.make(organization=self.org_1)
        shelter_in_other = shelter_recipe.make(organization=self.org_2)

        host_pks = permissioned_queryset(
            Shelter.objects.all(),
            user=self.bypass_user,
            organization_id=str(self.org_1.id),
            perms=[],
            organization_field="organization_id",
        ).values_list("pk", flat=True)
        self.assertIn(shelter_in_host.pk, host_pks)
        self.assertNotIn(shelter_in_other.pk, host_pks)

        # The bypass group is irrelevant: with no permission to gate on, even a
        # bypass user is confined to the org they asked for.
        other_pks = permissioned_queryset(
            Shelter.objects.all(),
            user=self.bypass_user,
            organization_id=str(self.org_2.id),
            perms=[],
            organization_field="organization_id",
        ).values_list("pk", flat=True)
        self.assertIn(shelter_in_other.pk, other_pks)
        self.assertNotIn(shelter_in_host.pk, other_pks)
