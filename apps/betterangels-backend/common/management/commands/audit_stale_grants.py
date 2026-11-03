"""``manage.py audit_stale_grants`` — Grants the org's config no longer grants.

``reconcile_org_groups`` revokes the Grants mirrored from a stale
``PermissionGroup`` — but only rows it can still see.  A Grant whose row was
already deleted (an earlier reconcile since the fix, or one of the documented
m2m-manager bypasses) has no membership to find it through, and a mirrored
Grant is indistinguishable from a direct one (they are the same
``unique_user_grant`` row), so it cannot be deleted safely by a migration.

This command reports those rows for a human to review.  It is read-only and
always exits 0.  ``pending-reconcile`` means the row still exists and the next
reconcile will revoke it; ``orphaned`` means reconcile cannot see it and only a
manual Grant delete will.

Usage::

    python manage.py audit_stale_grants
    python manage.py audit_stale_grants --org 7
    python manage.py audit_stale_grants --org acme --json
"""

from __future__ import annotations

import json
from typing import Any

from django.core.management.base import BaseCommand, CommandParser

from accounts.models import Grant, OrganizationProfile, PermissionGroup
from accounts.services import dual_write_template_names, expected_template_names


class Command(BaseCommand):
    help = (
        "Report org-scoped Grants whose role the organization's current types do not grant "
        "(read-only).  Distinguishes orphans reconcile cannot see from rows it will retire."
    )

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("--org", help="Organization id or slug to scope the audit")
        parser.add_argument("--json", action="store_true", help="Emit JSON instead of a table")

    def handle(self, *args: Any, **options: Any) -> None:
        profiles = OrganizationProfile.objects.select_related("organization").order_by("organization__name")
        if org := options.get("org"):
            profiles = (
                profiles.filter(organization_id=int(org)) if org.isdigit() else profiles.filter(organization__slug=org)
            )

        # Role names any organization type could grant by membership.  Grant-only
        # (legacy-inert) roles are direct grants, not stale mirrors; hand-managed
        # (unscoped) ones are deliberately outside config.
        derived = dual_write_template_names()
        findings: list[dict[str, Any]] = []

        for profile in profiles:
            stale_roles = derived - expected_template_names(profile.org_types)
            if not stale_roles:
                continue

            organization = profile.organization
            held = set(
                PermissionGroup.objects.filter(organization=organization).values_list("user__id", "template__name")
            )
            grants = (
                Grant.objects.filter(
                    scope_org=organization,
                    role__name__in=stale_roles,
                    principal_user__isnull=False,
                )
                .select_related("principal_user", "role")
                .order_by("principal_user__email", "role__name")
            )
            for grant in grants:
                user = grant.principal_user
                if user is None:  # filtered above; narrows the type for mypy
                    continue
                findings.append(
                    {
                        "grant_id": grant.pk,
                        "organization_id": organization.pk,
                        "organization": organization.name,
                        "user_id": user.pk,
                        "user": user.email or user.username,
                        "role": grant.role.name,
                        "status": ("pending-reconcile" if (user.pk, grant.role.name) in held else "orphaned"),
                    }
                )

        if options.get("json"):
            self.stdout.write(json.dumps(findings, indent=2))
            return

        if not findings:
            self.stdout.write("No stale grants found.")
            return

        self.stdout.write("Stale grants — role no longer granted by the organization's current types:\n")
        for finding in findings:
            self.stdout.write(
                f"  org {finding['organization_id']} ({finding['organization']})  "
                f"user {finding['user_id']} {finding['user']}  "
                f"{finding['role']}  grant {finding['grant_id']}  {finding['status']}"
            )

        orphaned = sum(1 for finding in findings if finding["status"] == "orphaned")
        organizations = len({finding["organization_id"] for finding in findings})
        self.stdout.write(
            f"\n{len(findings)} stale grant(s) in {organizations} organization(s): "
            f"{orphaned} orphaned (reconcile cannot see these), "
            f"{len(findings) - orphaned} pending-reconcile."
        )
