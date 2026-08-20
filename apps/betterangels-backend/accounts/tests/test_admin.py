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
from accounts.services import member_add, reconcile_org_groups
from django.contrib.auth.models import Group
from django.core.exceptions import ObjectDoesNotExist
from django.test import TestCase
from django.urls import reverse
from model_bakery import baker
from notes.groups import CASEWORKER
from organizations.models import Organization, OrganizationOwner, OrganizationUser
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
            "organization_users-TOTAL_FORMS": "0",
            "organization_users-INITIAL_FORMS": "0",
            "organization_users-MIN_NUM_FORMS": "0",
            "organization_users-MAX_NUM_FORMS": "0",
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

        reconcile_org_groups(organization)

        self.assertTrue(PermissionGroup.objects.filter(pk=hand_granted.pk).exists())
        self.assertTrue(member.groups.filter(pk=hand_granted.group_id).exists())

    def test_an_unconfigured_organization_still_has_its_permissions_synced(self) -> None:
        """No profile means no *derived* groups — not that config stops applying.

        Reconciliation used to return before syncing permissions for such an
        organization, which is why a second unscoped sync had to run after the
        per-org loop on every ``migrate``.
        """
        organization = organization_recipe.make(preset_names=["shelter"], owner_roles=())
        template = PermissionGroupTemplate.objects.get(name=GLOBAL_SHELTER_OPERATOR.name)
        hand_granted = PermissionGroup.objects.create(organization=organization, template=template)
        hand_granted.group.permissions.clear()
        OrganizationProfile.objects.filter(organization=organization).delete()

        reconcile_org_groups(organization)

        granted = set(hand_granted.group.permissions.values_list("content_type__app_label", "codename"))
        self.assertSetEqual(granted, {tuple(entry.split(".", 1)) for entry in GLOBAL_SHELTER_OPERATOR.permissions})

    def test_the_permission_group_inline_does_not_offer_the_group_field(self) -> None:
        """``group`` is created and torn down by code, so staff must not pick one.

        Binding a row to a group used for something else means deleting the row
        takes that group's members with it.
        """
        organization = organization_recipe.make(preset_names=["outreach"], owner_roles=())

        response = self.client.get(
            reverse("admin:organizations_organization_change", args=[organization.pk]),
        )

        inline_formset = next(
            formset for formset in response.context["inline_admin_formsets"] if formset.formset.model is PermissionGroup
        )
        self.assertNotIn("group", inline_formset.formset.empty_form.fields)


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

    def test_the_invite_lands_back_on_the_organization_listing_the_member(self) -> None:
        """It used to redirect to the changelist, where the new member is invisible."""
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(
                self.url, {"email": "listed@example.com", "permission_template": CASEWORKER.name}
            )

        organization_url = reverse("admin:organizations_organization_change", args=[self.organization.pk])
        self.assertRedirects(response, organization_url)

        page = self.client.get(organization_url).content.decode()
        self.assertIn("listed@example.com", page)
        self.assertIn(CASEWORKER.name, page)

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

    def test_an_unconfigured_organization_refuses_members(self) -> None:
        """Its role list is empty, so the page must say why instead of offering nothing."""
        OrganizationProfile.objects.filter(organization=self.organization).delete()

        response = self.client.post(
            self.url, {"email": "unconfigured@example.com", "permission_template": CASEWORKER.name}
        )

        self.assertEqual(response.status_code, 302)
        self.assertFalse(User.objects.filter(email="unconfigured@example.com").exists())


class OrganizationMembershipDeletionTestCase(TestCase):
    """Removing a membership through the admin must behave like the service.

    ``organization_remove_member`` clears the member's org-scoped roles and
    refuses to remove the owner.  The admin deletes the row directly, so both
    rules have to hold there too.
    """

    def setUp(self) -> None:
        self.superuser = User.objects.create_superuser(
            username="admin_delete_tests", email="admin_delete_tests@example.com", password="password"
        )
        self.client.force_login(self.superuser)
        self.organization = organization_recipe.make(preset_names=["outreach"], owner_roles=())
        self.member = member_add(
            email="member@example.com",
            first_name="",
            last_name="",
            middle_name=None,
            organization=self.organization,
            permission_templates=(CASEWORKER,),
        )
        self.membership = OrganizationUser.objects.get(organization=self.organization, user=self.member)

    def _org_role_count(self) -> int:
        return self.member.groups.filter(permissiongroup__organization=self.organization).count()

    def test_deleting_a_membership_revokes_the_organizations_roles(self) -> None:
        self.assertEqual(self._org_role_count(), 1)

        response = self.client.post(
            reverse("admin:organizations_organizationuser_delete", args=[self.membership.pk]),
            {"post": "yes"},
        )

        self.assertEqual(response.status_code, 302)
        self.assertFalse(OrganizationUser.objects.filter(pk=self.membership.pk).exists())
        self.assertEqual(self._org_role_count(), 0)

    def test_the_bulk_delete_action_also_revokes_roles(self) -> None:
        """The action deletes through a queryset, so it needs its own routing."""
        self.assertEqual(self._org_role_count(), 1)

        self.client.post(
            reverse("admin:organizations_organizationuser_changelist"),
            {"action": "delete_selected", "_selected_action": [str(self.membership.pk)], "post": "yes"},
        )

        self.assertFalse(OrganizationUser.objects.filter(pk=self.membership.pk).exists())
        self.assertEqual(self._org_role_count(), 0)

    def test_the_owners_membership_cannot_be_deleted(self) -> None:
        """``OrganizationOwner.organization_user`` cascades, so this would un-own the org."""
        owner_membership = OrganizationOwner.objects.get(organization=self.organization).organization_user

        response = self.client.post(
            reverse("admin:organizations_organizationuser_delete", args=[owner_membership.pk]),
            {"post": "yes"},
        )

        self.assertEqual(response.status_code, 403)
        self.assertTrue(OrganizationUser.objects.filter(pk=owner_membership.pk).exists())
        self.assertTrue(OrganizationOwner.objects.filter(organization=self.organization).exists())

    def test_you_cannot_delete_your_own_membership(self) -> None:
        """``organization_remove_member`` refuses it, which would surface as a 500."""
        own = member_add(
            email=self.superuser.email or "admin_delete_tests@example.com",
            first_name="",
            last_name="",
            middle_name=None,
            organization=self.organization,
            permission_templates=(CASEWORKER,),
        )
        own_membership = OrganizationUser.objects.get(organization=self.organization, user=own)

        response = self.client.post(
            reverse("admin:organizations_organizationuser_delete", args=[own_membership.pk]),
            {"post": "yes"},
        )

        self.assertEqual(response.status_code, 403)
        self.assertTrue(OrganizationUser.objects.filter(pk=own_membership.pk).exists())

    def test_a_bulk_delete_including_the_owner_deletes_nothing(self) -> None:
        """``delete_selected`` refuses the whole batch if any row is protected.

        ``get_deleted_objects`` consults ``has_delete_permission`` per selected
        row, so the guard covers the bulk action without a ``delete_queryset``
        override — and it is all-or-nothing rather than a silent partial delete.
        """
        owner_membership = OrganizationOwner.objects.get(organization=self.organization).organization_user

        response = self.client.post(
            reverse("admin:organizations_organizationuser_changelist"),
            {
                "action": "delete_selected",
                "_selected_action": [str(owner_membership.pk), str(self.membership.pk)],
                "post": "yes",
            },
        )

        self.assertEqual(response.status_code, 403)
        self.assertTrue(OrganizationUser.objects.filter(pk=owner_membership.pk).exists())
        self.assertTrue(OrganizationOwner.objects.filter(organization=self.organization).exists())
        self.assertTrue(OrganizationUser.objects.filter(pk=self.membership.pk).exists())
        self.assertEqual(self._org_role_count(), 1)


class OrganizationUserAddViewTestCase(TestCase):
    """Adding a member from the Organization users page picks the org and the role.

    The default ModelForm would have created a membership with no role at all —
    the state that made an organization unusable — so this page previously 403'd.
    """

    def setUp(self) -> None:
        self.superuser = User.objects.create_superuser(
            username="admin_orguser_tests", email="admin_orguser_tests@example.com", password="password"
        )
        self.client.force_login(self.superuser)
        self.organization = organization_recipe.make(preset_names=["outreach"], owner_roles=())
        self.url = reverse("admin:organizations_organizationuser_add")

    def test_the_form_asks_which_organization_and_offers_every_invitable_role(self) -> None:
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        form = response.context["form"]
        self.assertIn("organization", form.fields)
        self.assertEqual(
            [choice[0] for choice in form.fields["permission_template"].choices],
            [CASEWORKER.name, SHELTER_OPERATOR.name],
        )

    def test_adding_a_member_assigns_only_the_chosen_role(self) -> None:
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(
                self.url,
                {
                    "organization": str(self.organization.pk),
                    "email": "crossorg@example.com",
                    "permission_template": CASEWORKER.name,
                },
            )

        self.assertRedirects(response, reverse("admin:organizations_organization_change", args=[self.organization.pk]))
        member = User.objects.get(email="crossorg@example.com")
        self.assertTrue(OrganizationUser.objects.filter(organization=self.organization, user=member).exists())
        self.assertSetEqual(
            set(
                PermissionGroup.objects.filter(organization=self.organization, group__user=member).values_list(
                    "template__name", flat=True
                )
            ),
            {CASEWORKER.name},
        )

    def test_the_membership_form_does_not_offer_is_admin(self) -> None:
        """django-organizations' own field; nothing here reads it."""
        membership = OrganizationUser.objects.get(organization=self.organization)

        response = self.client.get(reverse("admin:organizations_organizationuser_change", args=[membership.pk]))

        self.assertNotIn("is_admin", response.context["adminform"].form.fields)

    def test_the_user_page_lists_the_organizations_and_roles(self) -> None:
        member = member_add(
            email="rolesonuser@example.com",
            first_name="",
            last_name="",
            middle_name=None,
            organization=self.organization,
            permission_templates=(CASEWORKER,),
        )

        page = self.client.get(reverse("admin:accounts_user_change", args=[member.pk])).content.decode()

        self.assertIn(self.organization.name, page)
        self.assertIn(CASEWORKER.name, page)

    def test_a_role_the_chosen_organization_cannot_hold_is_rejected(self) -> None:
        """The organization is outreach-only, so Shelter Operator must not apply."""
        response = self.client.post(
            self.url,
            {
                "organization": str(self.organization.pk),
                "email": "wrongrole@example.com",
                "permission_template": SHELTER_OPERATOR.name,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("permission_template", response.context["form"].errors)
        self.assertFalse(User.objects.filter(email="wrongrole@example.com").exists())
