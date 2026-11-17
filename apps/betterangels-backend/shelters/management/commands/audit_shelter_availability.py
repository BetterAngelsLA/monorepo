"""Report shelters whose availability already exceeds their capacity.

The ``available ≤ total_beds`` rule is enforced on write, so it does not correct
rows that predate it (or that were written by something bypassing the service
and admin writers) — it makes them unsaveable. Run this before deploying a rule
of that shape, and fix what it reports.

Read-only by default; ``--fail`` turns it into a deploy gate.
"""

from typing import Any

from django.core.management.base import BaseCommand, CommandError
from django.db.models import F, QuerySet

from shelters.models import Shelter


class Command(BaseCommand):
    help = "List shelters whose available beds exceed their total beds."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument(
            "--fail",
            action="store_true",
            help="Exit non-zero when any shelter violates the rule (deploy gate).",
        )

    def _violations(self) -> "QuerySet[Shelter]":
        """Shelters whose counters sum above a known capacity, worst first.

        The join drops shelters with no availability row (``NULL`` never compares
        above the total) and ``total_beds__isnull`` drops the unknown-capacity
        ones, which the rule does not constrain.
        """
        return (
            Shelter.objects.filter(total_beds__isnull=False)
            .annotate(
                excess=(F("availability__non_restricted_beds") + F("availability__restricted_beds") - F("total_beds"))
            )
            .filter(excess__gt=0)
            .order_by("-excess")
        )

    def handle(self, *args: Any, **options: Any) -> None:
        rows = list(
            self._violations().values_list(
                "pk",
                "name",
                "total_beds",
                "availability__non_restricted_beds",
                "availability__restricted_beds",
                "excess",
            )
        )

        if not rows:
            self.stdout.write(self.style.SUCCESS("No shelter availability exceeds its capacity."))
            return

        for pk, name, total_beds, non_restricted, restricted, excess in rows:
            available = non_restricted + restricted
            self.stdout.write(
                f"shelter {pk}: {name} — available {available} "
                f"({non_restricted} unrestricted + {restricted} restricted) "
                f"exceeds total beds {total_beds} by {excess}"
            )

        summary = f"{len(rows)} shelter(s) exceed their total beds."
        if options["fail"]:
            raise CommandError(f"{summary} Fix them before deploying.")
        self.stdout.write(self.style.WARNING(summary))
