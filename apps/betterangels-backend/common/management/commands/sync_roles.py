"""Management command to provision Roles and backfill Grants.

Usage:  ``python manage.py sync_roles``

Idempotent — safe to call repeatedly.  Runs what the ``post_migrate`` hook does
for the grant system (ADR 0001 §4 phase 1): provision ``Role`` rows from the
code-owned ``RoleDef``s, then backfill ``Grant`` rows from legacy Shelter
Operator ``PermissionGroup`` memberships and move Global Shelter Operator members
onto the global Role.
"""

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Provision Roles and backfill Grants from legacy PermissionGroups (ADR 0001)"

    def handle(self, **options: object) -> None:
        from accounts.seed import backfill_global_role_members, backfill_shelter_grants, sync_roles

        sync_roles()
        self.stdout.write("✓ Roles provisioned")

        backfill_shelter_grants()
        self.stdout.write("✓ Shelter Operator grants backfilled")

        backfill_global_role_members()
        self.stdout.write("✓ Global Shelter Operator members moved to the global Role")

        self.stdout.write(self.style.SUCCESS("Roles and grants are up to date."))
