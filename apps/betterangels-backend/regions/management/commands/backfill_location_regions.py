# SPDX-License-Identifier: MIT
"""Resolve locations to regions, for locations created since the last import.

``import_regions`` already does this for the dimension it just replaced
(``ensure_location_regions(kind=..., force=True)``). This command is for the gap in
between: a location created after the import has no row in ``regions_locationregion``,
so it is absent from every bucket of a region rollup until something fills it.

    python manage.py backfill_location_regions              # every dimension, gaps only
    python manage.py backfill_location_regions --kind spa   # one dimension
    python manage.py backfill_location_regions --force      # recompute, after a move

Runs against the DB directly and touches every unresolved location, so do not call it
from a request. It is the write that ``regions.selectors.region_counts`` used to perform
inline on every report read (a selector doing a global INSERT — see that function's
docstring); it belongs on a schedule, next to the importer, instead.

Idempotent: without ``--force`` it only processes locations that have no assignment for
the dimension at all, and a NULL ``region_id`` (resolved, in no region) counts as an
answer rather than a gap, so it is not retried. The INSERT carries
``ON CONFLICT ... DO NOTHING``, so overlapping runs are a no-op rather than an error.
"""

from __future__ import annotations

from typing import Any

from django.core.management.base import BaseCommand

from regions.models import Region, RegionKind
from regions.services import ensure_location_regions


class Command(BaseCommand):
    help = "Resolve locations to regions for locations created since the last import."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument(
            "--kind",
            action="append",
            choices=[kind.value for kind in RegionKind],
            help="Dimension to fill. Repeatable; default is every loaded dimension.",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help=(
                "Clear the stored answers for the scope first and recompute them. Use after "
                "boundaries change; without it only locations with no assignment are resolved."
            ),
        )

    def handle(self, *args: Any, **options: Any) -> None:
        kinds: list[str] = options["kind"] or []
        force: bool = options["force"]

        # Checked up front rather than inside the loop: `ensure_location_regions` skips a
        # dimension with no regions loaded, which is right for a bulk fill but would make
        # an explicit `--kind` typo look like a successful no-op.
        for kind in kinds:
            if not Region.objects.filter(kind=kind).exists():
                self.stderr.write(
                    self.style.WARNING(f"{kind}: no regions loaded — run import_regions --kind {kind} first")
                )

        if kinds:
            written = sum(ensure_location_regions(kind=kind, force=force) for kind in kinds)
        else:
            written = ensure_location_regions(force=force)

        verb = "recomputed" if force else "filled"
        self.stdout.write(self.style.SUCCESS(f"{verb} {written} location assignment(s)"))
