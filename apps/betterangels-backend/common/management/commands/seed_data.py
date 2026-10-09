"""Management command to manually seed all required data.

Usage:  python manage.py seed_data

Runs all seed functions — idempotent, safe to call repeatedly.
Equivalent to what post_migrate signals do automatically, plus (on
``IS_LOCAL_DEV`` only) the demo caseworker accounts from
``accounts.seed.seed_demo_caseworkers``.
"""

from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Seed all required data (PermissionGroupTemplates, SPAs, services, etc.)"

    def handle(self, **options: object) -> None:
        from accounts.seed import seed_demo_caseworkers, seed_permission_templates
        from notes.seed import seed_organization_services
        from shelters.seed import seed_shelter_lookups

        seed_permission_templates()
        self.stdout.write("✓ PermissionGroupTemplates seeded")

        seed_shelter_lookups()
        self.stdout.write("✓ Shelter lookups + services + groups seeded")

        seed_organization_services()
        self.stdout.write("✓ Organization services seeded")

        if settings.IS_LOCAL_DEV:
            # Local-dev exploration accounts; never seeded outside local dev.
            seed_demo_caseworkers()
            self.stdout.write("✓ Demo caseworker accounts seeded")

        self.stdout.write(self.style.SUCCESS("All seed data is up to date."))
