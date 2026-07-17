"""Management command to manually seed all required data.

Usage:  python manage.py seed_data

Runs all seed functions — idempotent, safe to call repeatedly.
Equivalent to what post_migrate signals do automatically.
"""

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Seed all required data (PermissionGroupTemplates, SPAs, services, etc.)"

    def handle(self, **options):
        from accounts.seed import seed_permission_templates
        from shelters.seed import seed_shelter_lookups
        from notes.seed import seed_organization_services

        seed_permission_templates()
        self.stdout.write("✓ PermissionGroupTemplates seeded")

        seed_shelter_lookups()
        self.stdout.write("✓ Shelter lookups + groups seeded")

        seed_organization_services()
        self.stdout.write("✓ Organization services seeded")

        self.stdout.write(self.style.SUCCESS("All seed data is up to date."))
