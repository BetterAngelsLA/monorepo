"""Tests for the organization admin's create-then-add-member workflow.

Creating an organization in the admin used to produce one that could hold no
roles and accept no members, and adding a member to it returned a 500.
"""

from typing import Any, cast

from accounts.admin import CustomOrganizationUserAdmin
from accounts.groups import ORG_ADMIN
from accounts.models import (
    OrganizationProfile,
    OrgTypeChoices,
    PermissionGroup,
    PermissionGroupTemplate,
    User,
)
from accounts.seed import seed_permission_templates
from accounts.services import invitation_role, member_add, reconcile_org_groups
from common.permissions.config import TemplateConfig
from django.contrib import admin
from django.contrib.auth.models import Group, Permission
from django.core.exceptions import ObjectDoesNotExist
from django.db import IntegrityError, connection, transaction
from django.test import SimpleTestCase, TestCase
from django.test.utils import CaptureQueriesContext
from django.urls import NoReverseMatch, reverse
from model_bakery import baker
from notes.groups import CASEWORKER
from organizations.models import Organization, OrganizationOwner, OrganizationUser
from shelters.groups import GLOBAL_SHELTER_OPERATOR, SHELTER_OPERATOR

from .baker_recipes import organization_recipe, permission_group_recipe


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
            "organization_users-MAX_NUM_FORMS": "1000",
            "grants-TOTAL_FORMS": "0",
            "grants-INITIAL_FORMS": "0",
            "grants-MIN_NUM_FORMS": "0",
            "grants-MAX_NUM_FORMS": "1000",
            "delegated_grants-TOTAL_FORMS": "0",
            "delegated_grants-INITIAL_FORMS": "0",
            "delegated_grants-MIN_NUM_FORMS": "0",
            "delegated_grants-MAX_NUM_FORMS": "1000",
        }

    def _change_payload(
        self, organization: Organization, permission_group: PermissionGroup, *, template_id: int
    ) -> dict:
        """POST body for the org change form, repointing one inline row's template."""
        rows = list(PermissionGroup.objects.filter(organization=organization).order_by("pk"))
        payload = {
            "name": organization.name,
            "profile-TOTAL_FORMS": "1",
            "profile-INITIAL_FORMS": "1",
            "profile-MIN_NUM_FORMS": "1",
            "profile-MAX_NUM_FORMS": "1",
            "profile-0-id": str(organization.profile.pk),
            "profile-0-organization": str(organization.pk),
            "profile-0-org_types": [t.value for t in organization.profile.org_types],
            "permission_groups-TOTAL_FORMS": str(len(rows)),
            "permission_groups-INITIAL_FORMS": str(len(rows)),
            "permission_groups-MIN_NUM_FORMS": "0",
            "permission_groups-MAX_NUM_FORMS": "1000",
        }
        # The read-only Members inline still needs its management form. Zero forms
        # rather than the real count: nothing is saved from it and it cannot delete,
        # so there is no reason to echo every membership back. Harmless where that
        # inline is absent — Django ignores unused POST keys.
        payload |= {
            "organization_users-TOTAL_FORMS": "0",
            "organization_users-INITIAL_FORMS": "0",
            "organization_users-MIN_NUM_FORMS": "0",
            "organization_users-MAX_NUM_FORMS": "1000",
            "grants-TOTAL_FORMS": "0",
            "grants-INITIAL_FORMS": "0",
            "grants-MIN_NUM_FORMS": "0",
            "grants-MAX_NUM_FORMS": "1000",
            "delegated_grants-TOTAL_FORMS": "0",
            "delegated_grants-INITIAL_FORMS": "0",
            "delegated_grants-MIN_NUM_FORMS": "0",
            "delegated_grants-MAX_NUM_FORMS": "1000",
        }
        pk_field = PermissionGroup._meta.pk.name
        for index, row in enumerate(rows):
            payload[f"permission_groups-{index}-{pk_field}"] = str(row.pk)
            payload[f"permission_groups-{index}-organization"] = str(organization.pk)
            payload[f"permission_groups-{index}-label"] = row.label
            payload[f"permission_groups-{index}-template"] = str(
                template_id if row.pk == permission_group.pk else (row.template_id or "")
            )
        return payload

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

    def test_form_hides_is_active(self) -> None:
        """django-organizations' own field; nothing in this codebase filters on it."""
        organization = organization_recipe.make(preset_names=["outreach"], owner_roles=())

        response = self.client.get(reverse("admin:organizations_organization_change", args=[organization.pk]))

        self.assertNotIn("is_active", response.context["adminform"].form.fields)

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
        group_id = shelter_group.pk

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
        member.groups.add(hand_granted)

        reconcile_org_groups(organization)

        self.assertTrue(PermissionGroup.objects.filter(pk=hand_granted.pk).exists())
        self.assertTrue(member.groups.filter(pk=hand_granted.pk).exists())

    def test_an_unconfigured_organization_still_has_its_permissions_synced(self) -> None:
        """No profile means no *derived* groups — not that config stops applying.

        Reconciliation used to return before syncing permissions for such an
        organization, which is why a second unscoped sync had to run after the
        per-org loop on every ``migrate``.
        """
        organization = organization_recipe.make(preset_names=["shelter"], owner_roles=())
        template = PermissionGroupTemplate.objects.get(name=GLOBAL_SHELTER_OPERATOR.name)
        hand_granted = PermissionGroup.objects.create(organization=organization, template=template)
        hand_granted.permissions.clear()
        OrganizationProfile.objects.filter(organization=organization).delete()

        reconcile_org_groups(organization)

        granted = set(hand_granted.permissions.values_list("content_type__app_label", "codename"))
        self.assertSetEqual(granted, {tuple(entry.split(".", 1)) for entry in GLOBAL_SHELTER_OPERATOR.permissions})

    def test_repointing_an_existing_rows_template_cannot_drop_its_members(self) -> None:
        """``template`` is fixed once the row exists, or saving the org 500s.

        Repointing it leaves the row holding a group still named after the old
        role, so reconciliation's ``get_or_create`` for that role tries to create a
        second ``auth.Group`` with the same name and hits
        ``auth_group_name_key`` — before it reaches the delete that would have
        freed the name. The admin's transaction rolls back, so nothing is lost, but
        a plausible edit crashes. ``main`` refused the save outright with a
        ValidationError; the field is now disabled instead.
        """
        organization = organization_recipe.make(preset_names=["outreach"], owner_roles=())
        caseworker = PermissionGroup.objects.get(organization=organization, template__name=CASEWORKER.name)
        group_id = caseworker.pk
        member = baker.make(User)
        member.groups.add(caseworker)
        shelter_operator = PermissionGroupTemplate.objects.get(name=SHELTER_OPERATOR.name)

        payload = self._change_payload(organization, caseworker, template_id=shelter_operator.pk)
        response = self.client.post(reverse("admin:organizations_organization_change", args=[organization.pk]), payload)

        self.assertEqual(response.status_code, 302)
        caseworker.refresh_from_db()
        self.assertEqual(
            PermissionGroup.objects.filter(pk=caseworker.pk).values_list("template__name", flat=True).first(),
            CASEWORKER.name,
        )
        self.assertTrue(Group.objects.filter(pk=group_id).exists())
        self.assertTrue(member.groups.filter(pk=group_id).exists())

    def test_the_inline_offers_template_on_a_new_row_but_not_an_existing_one(self) -> None:
        organization = organization_recipe.make(preset_names=["outreach"], owner_roles=())

        response = self.client.get(
            reverse("admin:organizations_organization_change", args=[organization.pk]),
        )

        formset = next(
            f.formset for f in response.context["inline_admin_formsets"] if f.formset.model is PermissionGroup
        )
        self.assertFalse(formset.empty_form.fields["template"].disabled)
        self.assertTrue(all(form.fields["template"].disabled for form in formset.initial_forms))

    def test_the_permission_group_inline_does_not_offer_the_group_field(self) -> None:
        """``group`` is created and torn down by code, so staff must not pick one.

        Binding a row to a group used for something else means deleting the row
        deletes that group's members with it.
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

    def test_adding_a_member_assigns_only_the_chosen_roles(self) -> None:
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(
                self.url, {"email": "newmember@example.com", "permission_templates": [CASEWORKER.name]}
            )

        self.assertEqual(response.status_code, 302)
        member = User.objects.get(email="newmember@example.com")
        self.assertTrue(OrganizationUser.objects.filter(organization=self.organization, user=member).exists())
        self.assertSetEqual(
            set(
                PermissionGroup.objects.filter(organization=self.organization, user=member).values_list(
                    "template__name", flat=True
                )
            ),
            {CASEWORKER.name},
        )

    def test_the_invite_lands_back_on_the_organization_listing_the_member(self) -> None:
        """It used to redirect to the changelist, where the new member is invisible."""
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(
                self.url, {"email": "listed@example.com", "permission_templates": [CASEWORKER.name]}
            )

        organization_url = reverse("admin:organizations_organization_change", args=[self.organization.pk])
        self.assertRedirects(response, organization_url)

        page = self.client.get(organization_url).content.decode()
        self.assertIn("listed@example.com", page)
        self.assertIn(CASEWORKER.name, page)

    def test_adding_a_member_sends_the_invitation_only_on_commit(self) -> None:
        with self.captureOnCommitCallbacks() as callbacks:
            self.client.post(self.url, {"email": "oncommit@example.com", "permission_templates": [CASEWORKER.name]})

        self.assertEqual(len(callbacks), 1)

    def test_a_role_the_organization_cannot_hold_is_rejected(self) -> None:
        response = self.client.post(
            self.url,
            {"email": "wrongrole@example.com", "permission_templates": [SHELTER_OPERATOR.name]},
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(User.objects.filter(email="wrongrole@example.com").exists())

    def test_a_non_invitable_role_is_rejected(self) -> None:
        response = self.client.post(
            self.url,
            {"email": "escalate@example.com", "permission_templates": ["Organization Superuser"]},
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(User.objects.filter(email="escalate@example.com").exists())

    def test_an_unconfigured_organization_refuses_members(self) -> None:
        """Its role list is empty, so the page must say why instead of offering nothing."""
        OrganizationProfile.objects.filter(organization=self.organization).delete()

        response = self.client.post(
            self.url, {"email": "unconfigured@example.com", "permission_templates": [CASEWORKER.name]}
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
            [choice[0] for choice in form.fields["permission_templates"].choices],
            [CASEWORKER.name, SHELTER_OPERATOR.name],
        )

    def test_adding_a_member_assigns_only_the_chosen_role(self) -> None:
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(
                self.url,
                {
                    "organization": str(self.organization.pk),
                    "email": "crossorg@example.com",
                    "permission_templates": [CASEWORKER.name],
                },
            )

        self.assertRedirects(response, reverse("admin:organizations_organization_change", args=[self.organization.pk]))
        member = User.objects.get(email="crossorg@example.com")
        self.assertTrue(OrganizationUser.objects.filter(organization=self.organization, user=member).exists())
        self.assertSetEqual(
            set(
                PermissionGroup.objects.filter(organization=self.organization, user=member).values_list(
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

    def test_the_membership_cannot_be_repointed_at_another_organization(self) -> None:
        """Moving the row by FK would strand the org-scoped groups on the old pair."""
        membership = OrganizationUser.objects.get(organization=self.organization)
        elsewhere = organization_recipe.make(preset_names=["outreach"], owner_roles=())
        url = reverse("admin:organizations_organizationuser_change", args=[membership.pk])

        response = self.client.get(url)
        self.assertNotIn("organization", response.context["adminform"].form.fields)
        self.assertNotIn("user", response.context["adminform"].form.fields)

        self.client.post(url, {"organization": str(elsewhere.pk), "user": str(self.superuser.pk)})

        membership.refresh_from_db()
        self.assertEqual(membership.organization_id, self.organization.pk)

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
                "permission_templates": [SHELTER_OPERATOR.name],
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("permission_templates", response.context["form"].errors)
        self.assertFalse(User.objects.filter(email="wrongrole@example.com").exists())


class OrganizationMemberMultipleRolesTestCase(TestCase):
    """Inviting with several roles, and editing a member's roles afterwards."""

    def setUp(self) -> None:
        self.superuser = User.objects.create_superuser(
            username="admin_roles_tests", email="admin_roles_tests@example.com", password="password"
        )
        self.client.force_login(self.superuser)
        self.organization = organization_recipe.make(preset_names=["outreach", "shelter"], owner_roles=())

    def _roles_of(self, member: User) -> set[str]:
        return set(
            PermissionGroup.objects.filter(organization=self.organization, user=member).values_list(
                "template__name", flat=True
            )
        )

    def test_inviting_with_two_roles_grants_both(self) -> None:
        with self.captureOnCommitCallbacks(execute=True):
            self.client.post(
                reverse("admin:organizations_organization_add_member", args=[self.organization.pk]),
                {
                    "email": "dual@example.com",
                    "permission_templates": [CASEWORKER.name, SHELTER_OPERATOR.name],
                },
            )

        member = User.objects.get(email="dual@example.com")
        self.assertSetEqual(self._roles_of(member), {CASEWORKER.name, SHELTER_OPERATOR.name})

    def test_the_invitation_email_uses_the_role_that_has_its_own_template(self) -> None:
        """Only one email is sent, so the role-specific body beats the generic fallback."""
        self.assertEqual(invitation_role((CASEWORKER, SHELTER_OPERATOR)), SHELTER_OPERATOR)
        self.assertEqual(invitation_role((SHELTER_OPERATOR, CASEWORKER)), SHELTER_OPERATOR)
        self.assertEqual(invitation_role((CASEWORKER,)), CASEWORKER)

    def test_changing_roles_revokes_the_ones_unchecked(self) -> None:
        member = member_add(
            email="demote@example.com",
            first_name="",
            last_name="",
            middle_name=None,
            organization=self.organization,
            permission_templates=(CASEWORKER, SHELTER_OPERATOR),
        )
        self.assertSetEqual(self._roles_of(member), {CASEWORKER.name, SHELTER_OPERATOR.name})

        url = reverse("admin:organizations_organization_change_member_roles", args=[self.organization.pk, member.pk])
        response = self.client.post(url, {"permission_templates": [SHELTER_OPERATOR.name]})

        self.assertRedirects(response, reverse("admin:organizations_organization_change", args=[self.organization.pk]))
        self.assertSetEqual(self._roles_of(member), {SHELTER_OPERATOR.name})

    def test_the_role_form_is_prefilled_with_the_roles_held(self) -> None:
        member = member_add(
            email="prefilled@example.com",
            first_name="",
            last_name="",
            middle_name=None,
            organization=self.organization,
            permission_templates=(CASEWORKER,),
        )

        url = reverse("admin:organizations_organization_change_member_roles", args=[self.organization.pk, member.pk])
        response = self.client.get(url)

        self.assertEqual(response.context["form"].fields["permission_templates"].initial, [CASEWORKER.name])

    def test_clearing_every_role_is_allowed_and_leaves_membership(self) -> None:
        """A member with no roles is a real state — it is what Add member starts from."""
        member = member_add(
            email="noroles@example.com",
            first_name="",
            last_name="",
            middle_name=None,
            organization=self.organization,
            permission_templates=(CASEWORKER,),
        )

        url = reverse("admin:organizations_organization_change_member_roles", args=[self.organization.pk, member.pk])
        self.client.post(url, {"permission_templates": []})

        self.assertSetEqual(self._roles_of(member), set())
        self.assertTrue(OrganizationUser.objects.filter(organization=self.organization, user=member).exists())

    def test_changing_roles_keeps_a_role_the_form_never_offered(self) -> None:
        """Org Admin is ``is_invitable=False``, so it has no checkbox to keep ticked.

        Clearing every org-scoped group and re-adding the posted ones revoked it on
        any save, including one that changed nothing — and the owner, who holds it,
        is offered this form from the Members inline.
        """
        member = member_add(
            email="promoted@example.com",
            first_name="",
            last_name="",
            middle_name=None,
            organization=self.organization,
            permission_templates=(CASEWORKER, ORG_ADMIN),
        )

        url = reverse("admin:organizations_organization_change_member_roles", args=[self.organization.pk, member.pk])
        self.client.post(url, {"permission_templates": [CASEWORKER.name]})

        self.assertSetEqual(self._roles_of(member), {CASEWORKER.name, ORG_ADMIN.name})

    def test_changing_roles_keeps_a_group_created_by_hand(self) -> None:
        """A row with a name and no template cannot be re-added, only left alone.

        ``add_roles`` resolves a ``PermissionGroup`` by template name, so clearing
        this one would have destroyed the grant with nothing able to restore it.
        """
        member = member_add(
            email="handgranted@example.com",
            first_name="",
            last_name="",
            middle_name=None,
            organization=self.organization,
            permission_templates=(CASEWORKER,),
        )
        hand_granted = permission_group_recipe.make(organization=self.organization, template=None)
        member.groups.add(hand_granted)

        url = reverse("admin:organizations_organization_change_member_roles", args=[self.organization.pk, member.pk])
        self.client.post(url, {"permission_templates": [SHELTER_OPERATOR.name]})

        self.assertTrue(member.groups.filter(pk=hand_granted.pk).exists())
        self.assertNotIn(CASEWORKER.name, self._roles_of(member))
        self.assertIn(SHELTER_OPERATOR.name, self._roles_of(member))

    def test_the_role_form_names_the_roles_it_does_not_offer(self) -> None:
        member = member_add(
            email="locked@example.com",
            first_name="",
            last_name="",
            middle_name=None,
            organization=self.organization,
            permission_templates=(CASEWORKER, ORG_ADMIN),
        )

        url = reverse("admin:organizations_organization_change_member_roles", args=[self.organization.pk, member.pk])
        response = self.client.get(url)

        self.assertEqual(response.context["form"].locked_role_names, [ORG_ADMIN.name])
        self.assertContains(response, f"Also holds, and keeps: {ORG_ADMIN.name}.")

    def test_the_role_editor_is_not_offered_for_someone_who_is_not_a_member(self) -> None:
        stranger = baker.make(User)

        url = reverse("admin:organizations_organization_change_member_roles", args=[self.organization.pk, stranger.pk])

        self.assertEqual(self.client.get(url).status_code, 404)

    def test_a_role_the_organization_cannot_hold_is_rejected(self) -> None:
        outreach_only = organization_recipe.make(preset_names=["outreach"], owner_roles=())
        member = member_add(
            email="outreachonly@example.com",
            first_name="",
            last_name="",
            middle_name=None,
            organization=outreach_only,
            permission_templates=(CASEWORKER,),
        )

        url = reverse("admin:organizations_organization_change_member_roles", args=[outreach_only.pk, member.pk])
        response = self.client.post(url, {"permission_templates": [SHELTER_OPERATOR.name]})

        self.assertEqual(response.status_code, 200)
        self.assertIn("permission_templates", response.context["form"].errors)
        self.assertSetEqual(
            set(
                PermissionGroup.objects.filter(organization=outreach_only, user=member).values_list(
                    "template__name", flat=True
                )
            ),
            {CASEWORKER.name},
        )


class OrganizationRoleLossConfirmationTestCase(TestCase):
    """A save that takes someone's role away has to say so first, by either route."""

    def setUp(self) -> None:
        self.superuser = User.objects.create_superuser(
            username="admin_orgtype_tests", email="admin_orgtype_tests@example.com", password="password"
        )
        self.client.force_login(self.superuser)
        self.organization = organization_recipe.make(preset_names=["outreach", "shelter"], owner_roles=())
        self.url = reverse("admin:organizations_organization_change", args=[self.organization.pk])

    def _rows(self) -> list[PermissionGroup]:
        return list(PermissionGroup.objects.filter(organization=self.organization).order_by("pk"))

    def _payload(self, org_types: list[str], **extra: str) -> dict:
        rows = self._rows()
        payload: dict = {
            "name": self.organization.name,
            "is_active": "on",
            "profile-TOTAL_FORMS": "1",
            "profile-INITIAL_FORMS": "1",
            "profile-MIN_NUM_FORMS": "1",
            "profile-MAX_NUM_FORMS": "1",
            "profile-0-id": str(self.organization.profile.pk),
            "profile-0-organization": str(self.organization.pk),
            "profile-0-org_types": org_types,
            "permission_groups-TOTAL_FORMS": str(len(rows)),
            "permission_groups-INITIAL_FORMS": str(len(rows)),
            "permission_groups-MIN_NUM_FORMS": "0",
            "permission_groups-MAX_NUM_FORMS": "1000",
            "organization_users-TOTAL_FORMS": "0",
            "organization_users-INITIAL_FORMS": "0",
            "organization_users-MIN_NUM_FORMS": "0",
            "organization_users-MAX_NUM_FORMS": "1000",
            "grants-TOTAL_FORMS": "0",
            "grants-INITIAL_FORMS": "0",
            "grants-MIN_NUM_FORMS": "0",
            "grants-MAX_NUM_FORMS": "1000",
            "delegated_grants-TOTAL_FORMS": "0",
            "delegated_grants-INITIAL_FORMS": "0",
            "delegated_grants-MIN_NUM_FORMS": "0",
            "delegated_grants-MAX_NUM_FORMS": "1000",
        }
        pk_field = PermissionGroup._meta.pk.name
        for index, row in enumerate(rows):
            payload[f"permission_groups-{index}-{pk_field}"] = str(row.pk)
            payload[f"permission_groups-{index}-organization"] = str(self.organization.pk)
            payload[f"permission_groups-{index}-label"] = row.label
            payload[f"permission_groups-{index}-template"] = str(row.template_id or "")
        return payload | extra

    def _tick_delete(self, template: TemplateConfig) -> dict[str, str]:
        """The POST key the inline's Delete checkbox sends for *template*'s row."""
        index = next(
            index for index, row in enumerate(self._rows()) if row.template and row.template.name == template.name
        )
        return {f"permission_groups-{index}-DELETE": "on"}

    def _member_holding(self, template: TemplateConfig, email: str) -> User:
        return member_add(
            email=email,
            first_name="",
            last_name="",
            middle_name=None,
            organization=self.organization,
            permission_templates=(template,),
        )

    def _holds(self, member: User, template: TemplateConfig) -> bool:
        return PermissionGroup.objects.filter(
            organization=self.organization,
            template__name=template.name,
            user=member,
        ).exists()

    def _holds_shelter_operator(self) -> bool:
        return PermissionGroup.objects.filter(
            organization=self.organization,
            template__name=SHELTER_OPERATOR.name,
        ).exists()

    def test_dropping_a_held_type_asks_first_and_changes_nothing(self) -> None:
        self._member_holding(SHELTER_OPERATOR, "losesit@example.com")

        response = self.client.post(self.url, self._payload(["outreach"]))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, SHELTER_OPERATOR.name)
        self.assertContains(response, "1 member")
        self.assertTrue(self._holds_shelter_operator())

    def test_confirming_goes_through(self) -> None:
        member = self._member_holding(SHELTER_OPERATOR, "confirmed@example.com")

        self.client.post(self.url, self._payload(["outreach"], _confirm_role_loss="1"))

        self.assertFalse(self._holds_shelter_operator())
        self.assertFalse(PermissionGroup.objects.filter(organization=self.organization, user=member).exists())

    def test_dropping_a_type_nobody_holds_does_not_ask(self) -> None:
        """A prompt that always fires stops being read."""
        self.client.post(self.url, self._payload(["outreach"]))

        self.assertFalse(self._holds_shelter_operator())

    def test_a_role_the_remaining_type_keeps_is_not_named(self) -> None:
        """Organization Admin belongs to both org types, so dropping one does not revoke it."""
        self._member_holding(ORG_ADMIN, "stays_admin@example.com")
        self._member_holding(SHELTER_OPERATOR, "loses_operator@example.com")

        response = self.client.post(self.url, self._payload(["outreach"]))

        # Against the context, not the HTML: the replayed POST carries every role
        # name in a hidden field, so the page contains them either way.
        losses = dict(response.context["losses"])
        self.assertIn(SHELTER_OPERATOR.name, losses)
        self.assertNotIn(ORG_ADMIN.name, losses)

    def test_deleting_a_role_row_asks_first_and_changes_nothing(self) -> None:
        """The quieter route: reconcile rebuilds the row, so the saved page looks untouched."""
        member = self._member_holding(SHELTER_OPERATOR, "row_delete@example.com")

        response = self.client.post(
            self.url, self._payload(["outreach", "shelter"], **self._tick_delete(SHELTER_OPERATOR))
        )

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, SHELTER_OPERATOR.name)
        self.assertContains(response, "1 member")
        self.assertTrue(self._holds(member, SHELTER_OPERATOR))

    def test_confirming_a_row_deletion_goes_through(self) -> None:
        member = self._member_holding(SHELTER_OPERATOR, "row_delete_ok@example.com")

        self.client.post(
            self.url,
            self._payload(["outreach", "shelter"], _confirm_role_loss="1", **self._tick_delete(SHELTER_OPERATOR)),
        )

        self.assertFalse(self._holds(member, SHELTER_OPERATOR))

    def test_a_view_only_staff_user_is_refused_rather_than_asked(self) -> None:
        """The prompt must not answer a question Django is about to refuse."""
        self._member_holding(SHELTER_OPERATOR, "viewonly_subject@example.com")
        viewer = User.objects.create_user(username="orgtype_viewer", password="password", is_staff=True)
        viewer.user_permissions.add(Permission.objects.get(codename="view_organization"))
        self.client.force_login(viewer)

        response = self.client.post(self.url, self._payload(["outreach"]))

        self.assertEqual(response.status_code, 403)
        self.assertNotContains(response, SHELTER_OPERATOR.name, status_code=403)


class OrganizationOwnershipTransferTestCase(TestCase):
    """The owner cannot be removed, so there has to be a way to stop being one."""

    def setUp(self) -> None:
        self.superuser = User.objects.create_superuser(
            username="admin_owner_tests", email="admin_owner_tests@example.com", password="password"
        )
        self.client.force_login(self.superuser)
        self.organization = organization_recipe.make(preset_names=["outreach"])
        self.owner_membership = OrganizationOwner.objects.get(organization=self.organization).organization_user
        self.member = member_add(
            email="successor@example.com",
            first_name="",
            last_name="",
            middle_name=None,
            organization=self.organization,
            permission_templates=(CASEWORKER,),
        )
        self.url = reverse("admin:organizations_organization_transfer_ownership", args=[self.organization.pk])

    def test_the_organization_page_offers_the_transfer(self) -> None:
        page = self.client.get(
            reverse("admin:organizations_organization_change", args=[self.organization.pk])
        ).content.decode()

        self.assertIn(self.url, page)

    def test_the_form_offers_members_but_not_the_current_owner(self) -> None:
        response = self.client.get(self.url)

        offered = set(response.context["form"].fields["new_owner"].queryset)
        self.assertIn(self.member, offered)
        self.assertNotIn(self.owner_membership.user, offered)

    def test_an_organization_with_no_owner_offers_every_member(self) -> None:
        """The shelter importer left 97 of 99 production organizations with no owner row."""
        OrganizationOwner.objects.filter(organization=self.organization).delete()

        response = self.client.get(self.url)

        self.assertIn("Currently owned by nobody", response.context["help_text"])
        offered = set(response.context["form"].fields["new_owner"].queryset)
        self.assertIn(self.member, offered)
        self.assertIn(self.owner_membership.user, offered)

    def test_transferring_moves_ownership_and_frees_the_old_owner(self) -> None:
        old_owner = self.owner_membership.user

        response = self.client.post(self.url, {"new_owner": str(self.member.pk)})

        self.assertRedirects(response, reverse("admin:organizations_organization_change", args=[self.organization.pk]))
        self.assertEqual(
            OrganizationOwner.objects.get(organization=self.organization).organization_user.user, self.member
        )
        # The old owner's row is now deletable, which it was not before.
        old_membership = OrganizationUser.objects.get(organization=self.organization, user=old_owner)
        deleted = self.client.post(
            reverse("admin:organizations_organizationuser_delete", args=[old_membership.pk]),
            {"post": "yes"},
        )
        self.assertEqual(deleted.status_code, 302)
        self.assertFalse(OrganizationUser.objects.filter(pk=old_membership.pk).exists())


class OrganizationMemberInlineQueryCountTestCase(TestCase):
    """The Members inline renders every row, so its cost must not grow per member."""

    def setUp(self) -> None:
        self.superuser = User.objects.create_superuser(
            username="admin_inline_tests", email="admin_inline_tests@example.com", password="password"
        )
        self.client.force_login(self.superuser)
        self.organization = organization_recipe.make(preset_names=["outreach"], owner_roles=())
        self.url = reverse("admin:organizations_organization_change", args=[self.organization.pk])

    def _add_members(self, count: int) -> None:
        for index in range(count):
            member_add(
                email=f"inline{index}-{count}@example.com",
                first_name="",
                last_name="",
                middle_name=None,
                organization=self.organization,
                permission_templates=(CASEWORKER,),
            )

    def test_rendering_the_members_inline_does_not_query_per_member(self) -> None:
        self._add_members(2)
        # Warm the content type cache, which is per process, not per member.
        self.client.get(self.url)
        with CaptureQueriesContext(connection) as few:
            self.client.get(self.url)

        self._add_members(6)
        with CaptureQueriesContext(connection) as many:
            self.client.get(self.url)

        self.assertEqual(len(many), len(few))


class OrganizationAdminLinksTestCase(TestCase):
    """The admin must not offer links it cannot honour, and must offer the role editor."""

    def setUp(self) -> None:
        self.superuser = User.objects.create_superuser(
            username="admin_links_tests", email="admin_links_tests@example.com", password="password"
        )
        self.client.force_login(self.superuser)
        self.organization = organization_recipe.make(preset_names=["outreach"], owner_roles=())
        self.membership = OrganizationUser.objects.get(organization=self.organization)

    def test_the_organization_page_offers_no_view_on_site_link(self) -> None:
        """``get_absolute_url`` reverses a route accounts/urls.py no longer includes."""
        page = self.client.get(
            reverse("admin:organizations_organization_change", args=[self.organization.pk])
        ).content.decode()

        self.assertNotIn("viewsitelink", page)
        self.assertNotIn("/people/", page)

    def test_the_membership_page_offers_no_view_on_site_link(self) -> None:
        page = self.client.get(
            reverse("admin:organizations_organizationuser_change", args=[self.membership.pk])
        ).content.decode()

        self.assertNotIn("viewsitelink", page)
        self.assertNotIn("/people/", page)

    def test_the_organization_page_links_to_the_filtered_member_list(self) -> None:
        """The Members inline has no pagination, and production has an org with 90."""
        page = self.client.get(
            reverse("admin:organizations_organization_change", args=[self.organization.pk])
        ).content.decode()

        expected = (
            f"{reverse('admin:organizations_organizationuser_changelist')}"
            f"?organization__id__exact={self.organization.pk}"
        )
        self.assertIn(expected, page)

    def test_the_membership_list_links_to_the_role_editor(self) -> None:
        expected = reverse(
            "admin:organizations_organization_change_member_roles",
            args=[self.organization.pk, self.membership.user_id],
        )

        page = self.client.get(reverse("admin:organizations_organizationuser_changelist")).content.decode()

        self.assertIn(expected, page)

    def test_the_membership_page_links_to_the_role_editor(self) -> None:
        expected = reverse(
            "admin:organizations_organization_change_member_roles",
            args=[self.organization.pk, self.membership.user_id],
        )

        page = self.client.get(
            reverse("admin:organizations_organizationuser_change", args=[self.membership.pk])
        ).content.decode()

        self.assertIn(expected, page)

    def test_the_roles_field_carries_the_editor_link_itself(self) -> None:
        """One field, so the link sits beside the roles rather than on its own row."""
        member = member_add(
            email="sameline@example.com",
            first_name="",
            last_name="",
            middle_name=None,
            organization=self.organization,
            permission_templates=(CASEWORKER,),
        )
        membership = OrganizationUser.objects.get(organization=self.organization, user=member)
        model_admin = cast(CustomOrganizationUserAdmin, admin.site.get_model_admin(OrganizationUser))

        rendered = model_admin.roles(membership)

        self.assertIn(CASEWORKER.name, rendered)
        self.assertIn(
            reverse(
                "admin:organizations_organization_change_member_roles",
                args=[self.organization.pk, member.pk],
            ),
            rendered,
        )
        self.assertNotIn("change_roles", model_admin.readonly_fields)


class OrganizationsGenericViewsNotRoutedTestCase(SimpleTestCase):
    """django-organizations' generic CRUD views must not be reachable.

    They rendered an unstyled parallel admin: any authenticated user could create or
    list organizations, any member could enumerate an organization's members, its
    owner could delete it, and a membership could be deleted without clearing the
    user's roles or created with no role at all — the state that made an
    organization unusable. Nothing in this project routes to them.

    Asserted against the URLconf rather than over the test client: a 404 would also
    pass if a view had merely started refusing, instead of the route being absent.
    """

    UNROUTED = [
        ("organization_list", {}),
        ("organization_add", {}),
        ("organization_detail", {"organization_pk": 1}),
        ("organization_edit", {"organization_pk": 1}),
        ("organization_delete", {"organization_pk": 1}),
        ("organization_user_list", {"organization_pk": 1}),
        ("organization_user_add", {"organization_pk": 1}),
        ("organization_user_detail", {"organization_pk": 1, "user_pk": 1}),
        ("organization_user_edit", {"organization_pk": 1, "user_pk": 1}),
        ("organization_user_delete", {"organization_pk": 1, "user_pk": 1}),
    ]

    def test_none_of_the_generic_organization_views_resolve(self) -> None:
        for name, kwargs in self.UNROUTED:
            with self.subTest(url_name=name):
                with self.assertRaises(NoReverseMatch):
                    reverse(name, kwargs=kwargs)

    def test_the_invitation_route_still_resolves(self) -> None:
        """It comes from invitation_backend().get_urls(), which stays mounted.

        Its view raises Http404 — invitations are accepted immediately rather than
        through an activation step — but the route must survive, because
        ``ExtendedOrganizationInvitation.get_absolute_url`` reverses it.
        """
        self.assertEqual(reverse("invitations_register", kwargs={"user_id": 1, "token": "abc"}), "/invitations/1-abc/")


class PermissionGroupDeleteWarningTestCase(TestCase):
    """Deleting a permission group deletes its auth.Group, and every member's role with it."""

    def setUp(self) -> None:
        self.superuser = User.objects.create_superuser(
            username="admin_pg_delete", email="admin_pg_delete@example.com", password="password"
        )
        self.client.force_login(self.superuser)
        self.organization = organization_recipe.make(preset_names=["shelter"], owner_roles=())
        for email in ("operator_one@example.com", "operator_two@example.com"):
            member_add(
                email=email,
                first_name="",
                last_name="",
                middle_name=None,
                organization=self.organization,
                permission_templates=(SHELTER_OPERATOR,),
            )
        self.permission_group = PermissionGroup.objects.get(
            organization=self.organization, template__name=SHELTER_OPERATOR.name
        )

    def test_the_delete_page_names_the_group_and_who_loses_it(self) -> None:
        url = reverse("admin:accounts_permissiongroup_delete", args=[self.permission_group.pk])

        response = self.client.get(url)

        self.assertContains(response, self.permission_group.name)
        self.assertContains(response, "revoked from 2 members")

    def test_the_bulk_delete_page_names_the_group_and_who_loses_it(self) -> None:
        response = self.client.post(
            reverse("admin:accounts_permissiongroup_changelist"),
            {"action": "delete_selected", "_selected_action": [str(self.permission_group.pk)]},
        )

        self.assertContains(response, self.permission_group.name)
        self.assertContains(response, "revoked from 2 members")

    def test_one_member_is_not_pluralised(self) -> None:
        Group.objects.get(pk=self.permission_group.pk).user_set.remove(
            User.objects.get(email="operator_two@example.com")
        )

        response = self.client.get(reverse("admin:accounts_permissiongroup_delete", args=[self.permission_group.pk]))

        self.assertContains(response, "revoked from 1 member<")


class PermissionGroupTemplateAdminTestCase(TestCase):
    """A template is one row shared by every organization holding the role.

    Two ways the admin implied otherwise: the organization page linked into the
    template admin from a row that reads as belonging to that organization, and
    the template admin let a role the code owns be edited or deleted, which
    ``sync_group_permissions`` undoes on the next reconcile.
    """

    def setUp(self) -> None:
        self.superuser = User.objects.create_superuser(
            username="template_admin_tests", email="template_admin_tests@example.com", password="password"
        )
        self.client.force_login(self.superuser)
        self.organization = organization_recipe.make(preset_names=["outreach"], owner_roles=())
        self.code_owned = PermissionGroupTemplate.objects.get(name=ORG_ADMIN.name)
        self.hand_defined = PermissionGroupTemplate.objects.create(name="Weekend Volunteers")

    def test_the_organization_page_does_not_link_into_the_template_admin(self) -> None:
        response = self.client.get(
            reverse("admin:organizations_organization_change", args=[self.organization.pk]),
        )

        for action in ("add", "change", "delete"):
            self.assertNotContains(response, f"{action}_id_permission_groups-0-template")
            self.assertNotContains(response, f"{action}_id_permission_groups-__prefix__-template")

    def test_the_organization_page_still_lets_the_template_be_viewed(self) -> None:
        """Read-only, not hidden -- what a role grants is worth being able to see."""
        response = self.client.get(
            reverse("admin:organizations_organization_change", args=[self.organization.pk]),
        )

        self.assertContains(response, "view_id_permission_groups-0-template")

    def test_a_role_the_code_owns_is_read_only(self) -> None:
        response = self.client.get(
            reverse("admin:accounts_permissiongrouptemplate_change", args=[self.code_owned.pk]),
        )

        self.assertNotContains(response, 'name="name"')
        self.assertNotContains(response, 'name="permissions"')

    def test_a_role_defined_in_the_admin_stays_editable(self) -> None:
        response = self.client.get(
            reverse("admin:accounts_permissiongrouptemplate_change", args=[self.hand_defined.pk]),
        )

        self.assertContains(response, 'name="name"')
        self.assertContains(response, 'name="permissions"')

    def test_a_role_the_code_owns_cannot_be_deleted(self) -> None:
        response = self.client.post(
            reverse("admin:accounts_permissiongrouptemplate_delete", args=[self.code_owned.pk]),
            {"post": "yes"},
        )

        self.assertEqual(response.status_code, 403)
        self.assertTrue(PermissionGroupTemplate.objects.filter(pk=self.code_owned.pk).exists())

    def test_a_role_defined_in_the_admin_can_be_deleted(self) -> None:
        response = self.client.post(
            reverse("admin:accounts_permissiongrouptemplate_delete", args=[self.hand_defined.pk]),
            {"post": "yes"},
        )

        self.assertEqual(response.status_code, 302)
        self.assertFalse(PermissionGroupTemplate.objects.filter(pk=self.hand_defined.pk).exists())

    def test_deleting_a_code_owned_role_breaks_the_next_reconcile(self) -> None:
        """Why the guard is a refusal rather than a warning.

        The delete itself succeeds quietly -- ``SET_NULL`` leaves each row with
        its label and members and no template, so reconciliation stops seeing it
        as derived.  ``post_migrate`` re-seeds the template, and the next
        reconcile collides with the orphan on ``auth_group.name``.  Reached here
        by deleting directly, which is what the admin guard now prevents.
        """
        row = PermissionGroup.objects.get(organization=self.organization, template=self.code_owned)

        self.code_owned.delete()

        row.refresh_from_db()
        self.assertIsNone(row.template_id)
        self.assertEqual(row.label, ORG_ADMIN.name)

        seed_permission_templates()
        with self.assertRaises(IntegrityError), transaction.atomic():
            reconcile_org_groups(self.organization)


class GrantAdminRoleRestrictionTestCase(TestCase):
    """The Grant admin surfaces must not offer global Roles (permissions.E002).

    GrantAdmin / GrantInline / DelegatedGrantInline route the ``role`` picker
    through ``_scoped_role_queryset`` — a global Role is held in user.groups
    (global tier), never in a Grant, so the forms refuse it up front.
    """

    def test_role_picker_offers_only_scoped_roles(self) -> None:
        from accounts.admin import DelegatedGrantInline, GrantAdmin, GrantInline
        from accounts.models import Grant, Role
        from accounts.services import sync_roles
        from django.contrib.admin.options import BaseModelAdmin
        from django.test import RequestFactory
        from shelters.groups import SHELTER_OPERATOR_ROLE

        sync_roles()
        shelter_role = Role.objects.get(name=SHELTER_OPERATOR_ROLE.name)
        self.assertTrue(Role.objects.filter(is_global=True).exists())  # guard against a vacuous pass
        role_field = Grant._meta.get_field("role")
        request = RequestFactory().get("/")

        surfaces: list[BaseModelAdmin] = [GrantAdmin(Grant, admin.site)]
        surfaces += [inline(Organization, admin.site) for inline in (GrantInline, DelegatedGrantInline)]

        for surface in surfaces:
            with self.subTest(admin=type(surface).__name__):
                field = surface.formfield_for_foreignkey(role_field, request)
                queryset = getattr(field, "queryset", None)
                assert queryset is not None
                self.assertIn(shelter_role, queryset)
                self.assertFalse(queryset.filter(is_global=True).exists())


class GrantAdminPermissionGuardsTestCase(TestCase):
    """Grant/Role admins gate their writes hard — grants are the authz graph."""

    def setUp(self) -> None:
        from accounts.admin import GrantAdmin, RoleAdmin
        from accounts.models import Grant, Role
        from accounts.services import sync_roles

        sync_roles()
        self.grant_admin = GrantAdmin(Grant, admin.site)
        self.role_admin = RoleAdmin(Role, admin.site)
        self.superuser = User.objects.create_superuser(
            username="grant_super", email="grant_super@example.com", password="password"
        )
        self.staff = User.objects.create_user(
            username="grant_staff", email="grant_staff@example.com", password="password", is_staff=True
        )
        from django.contrib.auth.models import Permission

        grant_perms = Permission.objects.filter(
            content_type__app_label="accounts", codename__in=["add_grant", "change_grant", "delete_grant", "view_grant"]
        )
        self.staff.user_permissions.add(*grant_perms)

    def _request(self, user: User) -> Any:
        from django.test import RequestFactory

        request = RequestFactory().get("/")
        request.user = user
        return request

    def test_grant_writes_require_superuser(self) -> None:
        staff = self._request(self.staff)
        superuser = self._request(self.superuser)

        self.assertFalse(self.grant_admin.has_add_permission(staff))
        self.assertFalse(self.grant_admin.has_change_permission(staff))
        self.assertFalse(self.grant_admin.has_delete_permission(staff))
        self.assertTrue(self.grant_admin.has_add_permission(superuser))
        self.assertTrue(self.grant_admin.has_change_permission(superuser))
        self.assertTrue(self.grant_admin.has_delete_permission(superuser))

    def test_role_admin_is_read_only_for_everyone(self) -> None:
        request = self._request(self.superuser)

        self.assertFalse(self.role_admin.has_add_permission(request))
        self.assertFalse(self.role_admin.has_change_permission(request))
        self.assertFalse(self.role_admin.has_delete_permission(request))


class GrantInlinePermissionGatingTestCase(TestCase):
    """Grant inlines on the Organization admin are superuser-only.

    Django admin never checks an inline child model's permissions — the grant
    inlines ride on ``change_organization`` — so ``CustomOrganizationAdmin``
    filters ``GrantInline``/``DelegatedGrantInline`` out for non-superusers.
    Without it, any staff who can edit an org could create, re-scope or delete
    ``Grant`` rows (the whole authorization graph), bypassing the superuser
    gate ``GrantAdmin`` enforces on the same rows.
    """

    def setUp(self) -> None:
        from accounts.services import sync_roles

        sync_roles()
        self.superuser = User.objects.create_superuser(
            username="inline_super", email="inline_super@example.com", password="password"
        )
        self.staff = User.objects.create_user(
            username="inline_staff", email="inline_staff@example.com", password="password", is_staff=True
        )
        org_perms = Permission.objects.filter(
            content_type__app_label="organizations",
            codename__in=["view_organization", "change_organization"],
        )
        self.staff.user_permissions.add(*org_perms)
        self.organization = organization_recipe.make(preset_names=["outreach"], owner_roles=())
        self.target_org = organization_recipe.make(preset_names=["outreach"], owner_roles=())
        self.url = reverse("admin:organizations_organization_change", args=[self.organization.pk])

    def _inline_prefixes(self) -> set[str]:
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        return {inline.formset.prefix for inline in response.context["inline_admin_formsets"]}

    def _change_payload(self, **extra: str) -> dict:
        rows = list(PermissionGroup.objects.filter(organization=self.organization).order_by("pk"))
        payload: dict = {
            "name": self.organization.name,
            "profile-TOTAL_FORMS": "1",
            "profile-INITIAL_FORMS": "1",
            "profile-MIN_NUM_FORMS": "1",
            "profile-MAX_NUM_FORMS": "1",
            "profile-0-id": str(self.organization.profile.pk),
            "profile-0-organization": str(self.organization.pk),
            "profile-0-org_types": [t.value for t in self.organization.profile.org_types],
            "permission_groups-TOTAL_FORMS": str(len(rows)),
            "permission_groups-INITIAL_FORMS": str(len(rows)),
            "permission_groups-MIN_NUM_FORMS": "0",
            "permission_groups-MAX_NUM_FORMS": "1000",
            "organization_users-TOTAL_FORMS": "0",
            "organization_users-INITIAL_FORMS": "0",
            "organization_users-MIN_NUM_FORMS": "0",
            "organization_users-MAX_NUM_FORMS": "1000",
            "grants-TOTAL_FORMS": "0",
            "grants-INITIAL_FORMS": "0",
            "grants-MIN_NUM_FORMS": "0",
            "grants-MAX_NUM_FORMS": "1000",
            "delegated_grants-TOTAL_FORMS": "0",
            "delegated_grants-INITIAL_FORMS": "0",
            "delegated_grants-MIN_NUM_FORMS": "0",
            "delegated_grants-MAX_NUM_FORMS": "1000",
        }
        pk_field = PermissionGroup._meta.pk.name
        for index, row in enumerate(rows):
            payload[f"permission_groups-{index}-{pk_field}"] = str(row.pk)
            payload[f"permission_groups-{index}-organization"] = str(self.organization.pk)
            payload[f"permission_groups-{index}-label"] = row.label
            payload[f"permission_groups-{index}-template"] = str(row.template_id or "")
        return payload | extra

    def test_grant_inlines_render_for_superusers_only(self) -> None:
        """Grant inlines appear on the org page for superusers only, not staff."""
        self.client.force_login(self.superuser)
        superuser_prefixes = self._inline_prefixes()
        self.assertIn("grants", superuser_prefixes)
        self.assertIn("delegated_grants", superuser_prefixes)

        self.client.force_login(self.staff)
        staff_prefixes = self._inline_prefixes()
        self.assertNotIn("grants", staff_prefixes)
        self.assertNotIn("delegated_grants", staff_prefixes)

    def test_a_staff_post_forging_grant_rows_creates_nothing(self) -> None:
        """Posted ``grants-*`` keys are inert when the inlines are filtered out."""
        from accounts.models import Grant, Role
        from shelters.groups import SHELTER_OPERATOR_ROLE

        role = Role.objects.get(name=SHELTER_OPERATOR_ROLE.name)
        grantee = baker.make(User)
        self.client.force_login(self.staff)

        response = self.client.post(
            self.url,
            self._change_payload(
                **{
                    "grants-TOTAL_FORMS": "1",
                    "grants-INITIAL_FORMS": "0",
                    "grants-0-principal_user": str(grantee.pk),
                    "grants-0-role": str(role.pk),
                    "grants-0-scope_object_type": "",
                    "grants-0-scope_object_id": "",
                    "delegated_grants-TOTAL_FORMS": "1",
                    "delegated_grants-INITIAL_FORMS": "0",
                    "delegated_grants-0-role": str(role.pk),
                    "delegated_grants-0-scope_org": str(self.target_org.pk),
                    "delegated_grants-0-scope_object_type": "",
                    "delegated_grants-0-scope_object_id": "",
                }
            ),
        )

        self.assertEqual(response.status_code, 302)
        self.assertFalse(Grant.objects.exists())

    def test_a_superuser_can_add_a_grant_from_the_org_page(self) -> None:
        """The gate must not over-block: superusers still add grants inline."""
        from accounts.models import Grant, Role
        from shelters.groups import SHELTER_OPERATOR_ROLE

        role = Role.objects.get(name=SHELTER_OPERATOR_ROLE.name)
        grantee = baker.make(User)
        self.client.force_login(self.superuser)

        response = self.client.post(
            self.url,
            self._change_payload(
                **{
                    "grants-TOTAL_FORMS": "1",
                    "grants-INITIAL_FORMS": "0",
                    "grants-0-principal_user": str(grantee.pk),
                    "grants-0-role": str(role.pk),
                    "grants-0-scope_object_type": "",
                    "grants-0-scope_object_id": "",
                }
            ),
        )

        self.assertEqual(response.status_code, 302)
        self.assertTrue(Grant.objects.filter(principal_user=grantee, role=role, scope_org=self.organization).exists())
