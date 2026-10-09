"""Ensure demo caseworker accounts with working authorization in the local DB.

Usage::

    python manage.py seed_demo_caseworkers
    python manage.py seed_demo_caseworkers --org test_org --password password

Creates/refreshes the ``caseworkerN@example.com`` accounts defined in
:data:`accounts.seed.DEMO_CASEWORKERS` — realistic names, one shared password,
and all three gates the app enforces (consent + profile, role groups,
authorization grants).  Idempotent: re-running never duplicates an account and
never overwrites data that is not one of these accounts.
"""

from typing import Any

from accounts.seed import DEMO_CASEWORKER_PASSWORD, resolve_demo_org, seed_demo_caseworkers
from django.core.exceptions import ObjectDoesNotExist
from django.core.management.base import BaseCommand, CommandError, CommandParser


class Command(BaseCommand):
    help = "Create/refresh demo caseworker accounts (idempotent; local dev)."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "--org",
            default=None,
            help="Organization name or id the accounts belong to (default: the local-dev test_org).",
        )
        parser.add_argument(
            "--password",
            default=DEMO_CASEWORKER_PASSWORD,
            help=f"Shared password for the accounts (default: {DEMO_CASEWORKER_PASSWORD!r}).",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        try:
            organization = resolve_demo_org(options["org"])
        except ObjectDoesNotExist as exc:
            raise CommandError(f"No such organization: {options['org']!r}") from exc

        results = seed_demo_caseworkers(organization, password=options["password"])

        created_count = sum(1 for _user, created in results if created)
        for user, created in results:
            state = "created" if created else "exists"
            self.stdout.write(f"  {state:>7}  #{user.pk!s:<4} {user.email} ({user.first_name} {user.last_name})")

        self.stdout.write(
            self.style.SUCCESS(
                f"Ensured {len(results)} demo caseworker accounts at {organization.name!r} "
                f"({created_count} created, {len(results) - created_count} already present); "
                f"shared password={options['password']!r}"
            )
        )
