"""Report shelters whose availability already exceeds their capacity.

The ``available ≤ total_beds`` rule is enforced on write, so it does not correct
rows that predate it (or that were written by something bypassing the service
and admin writers) — it makes them unsaveable. Run this before deploying a rule
of that shape, and fix what it reports.

Read-only by default; ``--fail`` turns it into a deploy gate.
"""

from typing import Any

from django.core.management.base import BaseCommand, CommandError

from shelters.models import Shelter


class Command(BaseCommand):
    help = "List shelters whose available beds exceed their total beds."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument(
            "--fail",
            action="store_true",
            help="Exit non-zero when any shelter violates the rule (deploy gate).",
        )

    def _violations(self) -> list[tuple[Shelter, int, int]]:
        """(shelter, available, total) for every over-capacity shelter, worst first.

        ``select_related`` keeps this one query, and ``total_beds__isnull`` drops
        the unknown-capacity rows the rule does not constrain. The comparison runs
        here rather than in SQL: a cross-relation annotation cannot be filtered on
        without an alias mypy's Django plugin cannot resolve, and a pre-flight
        report does not need the database to do arithmetic.
        """
        stranded: list[tuple[Shelter, int, int]] = []

        for shelter in Shelter.objects.filter(total_beds__isnull=False).select_related("availability"):
            # ``getattr`` because the reverse OneToOne raises when the row is
            # missing (``RelatedObjectDoesNotExist`` is an ``AttributeError``).
            availability = getattr(shelter, "availability", None)
            if availability is None or shelter.total_beds is None:
                continue

            available = availability.non_restricted_beds + availability.restricted_beds
            if available > shelter.total_beds:
                stranded.append((shelter, available, shelter.total_beds))

        return sorted(stranded, key=lambda row: row[1] - row[2], reverse=True)

    def handle(self, *args: Any, **options: Any) -> None:
        violations = self._violations()

        if not violations:
            self.stdout.write(self.style.SUCCESS("No shelter availability exceeds its capacity."))
            return

        for shelter, available, total_beds in violations:
            availability = shelter.availability
            self.stdout.write(
                f"shelter {shelter.pk}: {shelter.name} — available {available} "
                f"({availability.non_restricted_beds} unrestricted + "
                f"{availability.restricted_beds} restricted) "
                f"exceeds total beds {total_beds} by {available - total_beds}"
            )

        summary = f"{len(violations)} shelter(s) exceed their total beds."
        if options["fail"]:
            raise CommandError(f"{summary} Fix them before deploying.")
        self.stdout.write(self.style.WARNING(summary))
