"""Tests for migration 0005's orphaned-group recovery.

Deciding which organization an orphaned ``auth.Group`` belongs to is an
access-control decision made once, against production data, so the resolution is
tested directly rather than only via a migration re-run.  The migration keeps the
logic in a pure function so it can be imported without an ORM.
"""

import importlib

from accounts.models import PermissionGroup, PermissionGroupTemplate
from django.contrib.auth.models import Group
from django.test import TestCase
from notes.groups import CASEWORKER
from organizations.models import Organization

migration = importlib.import_module("accounts.migrations.0005_deterministic_permission_group_names")
resolve_orphans = migration.resolve_orphans
legacy_group_name = migration.legacy_group_name


class ResolveOrphansTestCase(TestCase):
    """Pure-function tests — no database."""

    def test_a_single_claimant_is_resolved(self) -> None:
        unique, ambiguous, unclaimed = resolve_orphans(
            organizations=[(1, "Acme")],
            template_names=["Caseworker"],
            orphan_names={"Acme_Caseworker"},
            taken=set(),
        )

        self.assertEqual(unique, {"Acme_Caseworker": (1, "Caseworker")})
        self.assertEqual(ambiguous, {})
        self.assertEqual(unclaimed, set())

    def test_two_same_named_organizations_are_never_guessed_between(self) -> None:
        """The case the old regex-and-name-dict implementation got silently wrong.

        Only one group carries the name, so attaching it to either organization
        would hand one org's members a role scoped to the other.
        """
        unique, ambiguous, unclaimed = resolve_orphans(
            organizations=[(1, "Acme"), (2, "Acme")],
            template_names=["Caseworker"],
            orphan_names={"Acme_Caseworker"},
            taken=set(),
        )

        self.assertEqual(unique, {})
        self.assertEqual(ambiguous, {"Acme_Caseworker": [(1, "Caseworker"), (2, "Caseworker")]})
        self.assertEqual(unclaimed, set())

    def test_a_pair_that_already_has_a_permission_group_does_not_claim(self) -> None:
        unique, ambiguous, unclaimed = resolve_orphans(
            organizations=[(1, "Acme"), (2, "Acme")],
            template_names=["Caseworker"],
            orphan_names={"Acme_Caseworker"},
            taken={(1, "Caseworker")},
        )

        self.assertEqual(unique, {"Acme_Caseworker": (2, "Caseworker")})
        self.assertEqual(ambiguous, {})

    def test_a_name_no_pair_accounts_for_is_unclaimed(self) -> None:
        _, _, unclaimed = resolve_orphans(
            organizations=[(1, "Acme")],
            template_names=["Caseworker"],
            orphan_names={"Bare Legacy Group"},
            taken=set(),
        )

        self.assertEqual(unclaimed, {"Bare Legacy Group"})

    def test_a_template_less_orphan_is_unclaimed(self) -> None:
        """Its legacy name embedded an arbitrary label, so the role is unknowable."""
        _, _, unclaimed = resolve_orphans(
            organizations=[(1, "Acme")],
            template_names=["Caseworker"],
            orphan_names={legacy_group_name("Acme", "some ad-hoc label")},
            taken=set(),
        )

        self.assertEqual(unclaimed, {"Acme_some ad-hoc label"})


class RestoreGroupNamesTestCase(TestCase):
    def test_reverse_survives_two_organizations_sharing_a_name(self) -> None:
        """Both reconstruct to the same legacy name, which Group.name forbids.

        The reverse must keep one deterministic name rather than raising
        IntegrityError.
        """
        template, _ = PermissionGroupTemplate.objects.get_or_create(name=CASEWORKER.name)
        first = Organization.objects.create(name="Acme")
        second = Organization.objects.create(name="Acme")
        first_group = PermissionGroup.objects.create(organization=first, template=template)
        second_group = PermissionGroup.objects.create(organization=second, template=template)

        from django.apps import apps

        migration.restore_group_names(apps, None)

        first_group.group.refresh_from_db()
        second_group.group.refresh_from_db()
        names = {first_group.group.name, second_group.group.name}
        self.assertIn("Acme_Caseworker", names)
        self.assertEqual(len(names), 2, "the two groups must not both take the legacy name")
        self.assertEqual(Group.objects.filter(name="Acme_Caseworker").count(), 1)
