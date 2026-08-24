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
from accounts.services import reconcile_org_groups
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

    def _change_payload(
        self, organization: Organization, permission_group: PermissionGroup, *, template_id: int
    ) -> dict:
        """POST body for the org change form, repointing one inline row's template."""
        rows = list(PermissionGroup.objects.filter(organization=organization).order_by("pk"))
        payload = {
            "name": organization.name,
            "is_active": "on",
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
        for index, row in enumerate(rows):
            payload[f"permission_groups-{index}-id"] = str(row.pk)
            payload[f"permission_groups-{index}-organization"] = str(organization.pk)
            payload[f"permission_groups-{index}-name"] = row.name
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
        group_id = caseworker.group_id
        member = baker.make(User)
        member.groups.add(caseworker.group)
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

    def test_organization_user_cannot_be_added_directly(self) -> None:
        response = self.client.get(reverse("admin:organizations_organizationuser_add"))

        self.assertEqual(response.status_code, 403)

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
