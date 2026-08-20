"""Tests for the organization admin's create-then-add-member workflow.

Creating an organization in the admin used to produce one that could hold no
roles and accept no members, and adding a member to it returned a 500.
"""

from accounts.models import (
    OrganizationProfile,
    OrgTypeChoices,
    PermissionGroup,
    PermissionGroupTemplate,
    User,
)
from django.contrib.auth.models import Group
from django.core.exceptions import ObjectDoesNotExist
from django.test import TestCase
from django.urls import reverse
from model_bakery import baker
from notes.groups import CASEWORKER
from organizations.models import Organization, OrganizationUser
from shelters.groups import GLOBAL_SHELTER_OPERATOR, SHELTER_OPERATOR

from .baker_recipes import organization_recipe


class OrganizationProfileAccessTestCase(TestCase):
    def test_reading_the_profile_of_a_bare_organization_creates_nothing(self) -> None:
        """The profile must not be conjured into existence by reading it.

        It used to be an ``AutoOneToOneField``, so ``org.profile`` inserted a row
        with empty ``org_types`` as a side effect of a read.  Every organization
        then looked configured while holding no org type at all.
        """
        organization = Organization.objects.create(name="Bare Organization")

        with self.assertRaises(ObjectDoesNotExist):
            _ = organization.profile

        self.assertFalse(OrganizationProfile.objects.filter(organization=organization).exists())


class OrganizationAdminTestCase(TestCase):
    def setUp(self) -> None:
        self.superuser = User.objects.create_superuser(
            username="admin_tests", email="admin_tests@example.com", password="password"
        )
        self.client.force_login(self.superuser)

    def _add_payload(self, name: str, org_types: list[str]) -> dict:
        return {
            "name": name,
            "is_active": "on",
            "org_types": org_types,
            # Management form for the required profile inline.
            "profile-TOTAL_FORMS": "1",
            "profile-INITIAL_FORMS": "0",
            "profile-MIN_NUM_FORMS": "1",
            "profile-MAX_NUM_FORMS": "1",
            "profile-0-org_types": org_types,
            "permission_groups-TOTAL_FORMS": "0",
            "permission_groups-INITIAL_FORMS": "0",
            "permission_groups-MIN_NUM_FORMS": "0",
            "permission_groups-MAX_NUM_FORMS": "1000",
        }

    def test_creating_an_organization_sets_org_types_and_permission_groups(self) -> None:
        response = self.client.post(
            reverse("admin:organizations_organization_add"),
            self._add_payload("Outreach Org", [OrgTypeChoices.OUTREACH.value]),
        )
        self.assertEqual(response.status_code, 302)

        organization = Organization.objects.get(name="Outreach Org")
        self.assertEqual([t.value for t in organization.profile.org_types], ["outreach"])
        self.assertSetEqual(
            set(PermissionGroup.objects.filter(organization=organization).values_list("template__name", flat=True)),
            {t.name for t in (CASEWORKER,)} | {"Organization Admin", "Organization Superuser"},
        )

    def test_creating_an_organization_without_an_org_type_is_rejected(self) -> None:
        response = self.client.post(
            reverse("admin:organizations_organization_add"),
            self._add_payload("No Type Org", []),
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(Organization.objects.filter(name="No Type Org").exists())

    def test_removing_an_org_type_deletes_its_groups_without_orphaning(self) -> None:
        organization = organization_recipe.make(preset_names=["outreach", "shelter"], owner_roles=())
        shelter_group = PermissionGroup.objects.get(organization=organization, template__name=SHELTER_OPERATOR.name)
        group_id = shelter_group.group_id

        OrganizationProfile.objects.filter(organization=organization).update(org_types=[OrgTypeChoices.OUTREACH])
        from accounts.services import reconcile_org_groups

        reconcile_org_groups(organization)

        self.assertFalse(PermissionGroup.objects.filter(pk=shelter_group.pk).exists())
        self.assertFalse(Group.objects.filter(pk=group_id).exists())

    def test_reconcile_leaves_a_hand_granted_role_revokable(self) -> None:
        """A template outside every org type is granted by hand, not derived.

        Reconciliation used to delete it through a queryset, which skipped the
        model's ``delete()`` and left the ``auth.Group`` behind — the member kept
        the permissions with no row left to revoke them through.
        """
        organization = organization_recipe.make(preset_names=["shelter"], owner_roles=())
        template = PermissionGroupTemplate.objects.get(name=GLOBAL_SHELTER_OPERATOR.name)
        hand_granted = PermissionGroup.objects.create(organization=organization, template=template)
        member = baker.make(User)
        member.groups.add(hand_granted.group)

        from accounts.services import reconcile_org_groups

        reconcile_org_groups(organization)

        self.assertTrue(PermissionGroup.objects.filter(pk=hand_granted.pk).exists())
        self.assertTrue(member.groups.filter(pk=hand_granted.group_id).exists())


class OrganizationAddMemberViewTestCase(TestCase):
    def setUp(self) -> None:
        self.superuser = User.objects.create_superuser(
            username="admin_member_tests", email="admin_member_tests@example.com", password="password"
        )
        self.client.force_login(self.superuser)
        self.organization = organization_recipe.make(preset_names=["outreach"], owner_roles=())
        self.url = reverse("admin:organizations_organization_add_member", args=[self.organization.pk])

    def test_adding_a_member_assigns_only_the_chosen_role(self) -> None:
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(
                self.url, {"email": "newmember@example.com", "permission_template": CASEWORKER.name}
            )

        self.assertEqual(response.status_code, 302)
        member = User.objects.get(email="newmember@example.com")
        self.assertTrue(OrganizationUser.objects.filter(organization=self.organization, user=member).exists())
        self.assertSetEqual(
            set(
                PermissionGroup.objects.filter(organization=self.organization, group__user=member).values_list(
                    "template__name", flat=True
                )
            ),
            {CASEWORKER.name},
        )

    def test_adding_a_member_sends_the_invitation_only_on_commit(self) -> None:
        with self.captureOnCommitCallbacks() as callbacks:
            self.client.post(self.url, {"email": "oncommit@example.com", "permission_template": CASEWORKER.name})

        self.assertEqual(len(callbacks), 1)

    def test_a_role_the_organization_cannot_hold_is_rejected(self) -> None:
        response = self.client.post(
            self.url,
            {"email": "wrongrole@example.com", "permission_template": SHELTER_OPERATOR.name},
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(User.objects.filter(email="wrongrole@example.com").exists())

    def test_a_non_invitable_role_is_rejected(self) -> None:
        response = self.client.post(
            self.url,
            {"email": "escalate@example.com", "permission_template": "Organization Superuser"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(User.objects.filter(email="escalate@example.com").exists())

    def test_organization_user_cannot_be_added_directly(self) -> None:
        response = self.client.get(reverse("admin:organizations_organizationuser_add"))

        self.assertEqual(response.status_code, 403)
