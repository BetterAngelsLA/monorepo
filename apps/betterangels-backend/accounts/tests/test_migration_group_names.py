"""Tests for the org-type backfill and group renaming migrations.

The backfill decides, per organization, whether it is configured as a tenant at
all.  That rule reads a data state the check constraint forbids once applied — a
profile with no org types — so the decision is tested as a pure function and its
database effects are verified by running the migration itself.
"""

import importlib

from accounts.models import OrganizationProfile, PermissionGroup, PermissionGroupTemplate
from django.apps import apps
from django.contrib.auth.models import Group
from django.test import TestCase
from notes.groups import CASEWORKER
from organizations.models import Organization

from .baker_recipes import organization_recipe

backfill = importlib.import_module("accounts.migrations.0004_require_org_type_on_profile")
renaming = importlib.import_module("accounts.migrations.0005_deterministic_permission_group_names")


def _grant_template(organization: Organization, template_name: str) -> PermissionGroup:
    template, _ = PermissionGroupTemplate.objects.get_or_create(name=template_name)
    return PermissionGroup.objects.create(organization=organization, template=template)


class DecideOrgTypesTestCase(TestCase):
    """Pure-function tests — no database."""

    def test_an_existing_type_is_kept(self) -> None:
        self.assertEqual(backfill.decide_org_types(["shelter"], {"outreach"}, True), ["shelter"])

    def test_a_caseworker_group_infers_outreach(self) -> None:
        self.assertEqual(backfill.decide_org_types([], {"outreach"}, False), ["outreach"])

    def test_a_shelter_operator_group_infers_shelter(self) -> None:
        self.assertEqual(backfill.decide_org_types([], {"shelter"}, False), ["shelter"])

    def test_both_signals_infer_both(self) -> None:
        self.assertEqual(backfill.decide_org_types([], {"shelter", "outreach"}, False), ["outreach", "shelter"])

    def test_members_but_no_signal_falls_back(self) -> None:
        """The only branch that guesses, which is why the migration prints it."""
        self.assertEqual(backfill.decide_org_types([], set(), True), ["outreach"])

    def test_no_members_and_no_signal_keeps_no_profile(self) -> None:
        """Do not invent a type for an organization nobody uses."""
        self.assertIsNone(backfill.decide_org_types([], set(), False))


class RestoreGroupNamesTestCase(TestCase):
    def test_reverse_survives_two_organizations_sharing_a_name(self) -> None:
        """Both reconstruct to the same legacy name, which Group.name forbids.

        The reverse must keep one deterministic name rather than raising
        IntegrityError.
        """
        first = Organization.objects.create(name="Acme")
        second = Organization.objects.create(name="Acme")
        first_group = _grant_template(first, CASEWORKER.name)
        second_group = _grant_template(second, CASEWORKER.name)

        renaming.restore_group_names(apps, None)

        first_group.group.refresh_from_db()
        second_group.group.refresh_from_db()
        names = {first_group.group.name, second_group.group.name}
        self.assertIn("Acme_Caseworker", names)
        self.assertEqual(len(names), 2, "the two groups must not both take the legacy name")
        self.assertEqual(Group.objects.filter(name="Acme_Caseworker").count(), 1)


class UnconfiguredOrganizationTestCase(TestCase):
    """An organization with no profile is a supported state, not a broken one.

    82 production organizations legitimately hold none: they exist as records but
    have never been configured as tenants.
    """

    def test_reconcile_skips_it_rather_than_stripping_its_roles(self) -> None:
        from accounts.services import reconcile_org_groups

        organization = organization_recipe.make(owner_roles=())
        OrganizationProfile.objects.filter(organization=organization).delete()
        before = set(PermissionGroup.objects.filter(organization=organization).values_list("pk", flat=True))
        self.assertEqual(len(before), 3)

        reconcile_org_groups(organization)

        after = set(PermissionGroup.objects.filter(organization=organization).values_list("pk", flat=True))
        self.assertSetEqual(after, before, "unconfigured must not mean 'no roles allowed'")

    def test_templates_for_is_empty_and_creates_nothing(self) -> None:
        from common.org_types import REGISTRY

        organization = Organization.objects.create(name="No Profile")

        self.assertEqual(REGISTRY.templates_for(organization), [])
        self.assertFalse(OrganizationProfile.objects.filter(organization=organization).exists())
