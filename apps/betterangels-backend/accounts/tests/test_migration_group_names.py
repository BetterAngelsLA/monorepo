"""Tests for the org-type backfill and group renaming migrations.

The backfill decides, per organization, whether it is configured as a tenant at
all.  That rule reads a data state the check constraint forbids once applied — a
profile with no org types — so the decision is tested as a pure function and its
database effects are verified by running the migration itself.
"""

import importlib

from accounts.models import OrganizationProfile, PermissionGroup
from django.test import TestCase
from organizations.models import Organization

from .baker_recipes import organization_recipe

backfill = importlib.import_module("accounts.migrations.0004_require_org_type_on_profile")
renaming = importlib.import_module("accounts.migrations.0005_deterministic_permission_group_names")


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
        # §5.3 provisioning: only the still-legacy CASEWORKER group exists
        # (ORG_ADMIN/ORG_SUPERUSER are role-backed).
        self.assertEqual(len(before), 1)

        reconcile_org_groups(organization)

        after = set(PermissionGroup.objects.filter(organization=organization).values_list("pk", flat=True))
        self.assertSetEqual(after, before, "unconfigured must not mean 'no roles allowed'")

    def test_templates_for_is_empty_and_creates_nothing(self) -> None:
        from common.org_types import REGISTRY

        organization = Organization.objects.create(name="No Profile")

        self.assertEqual(REGISTRY.templates_for(organization), [])
        self.assertFalse(OrganizationProfile.objects.filter(organization=organization).exists())
