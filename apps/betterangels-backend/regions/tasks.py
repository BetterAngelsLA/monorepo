"""Regions app Celery tasks.

One task, and it exists to close a correctness gap rather than to move data.

``interactionsByRegion`` reads the **stored** ``LocationRegion`` assignment, not a spatial
join, because that is what makes the rollup an ordinary indexed read. The consequence is
that a location created since the last fill is absent from every bucket — silently, with
the report's total quietly no longer reconciling against the KPI row above it, while
``interactionMap`` (which reads live ``Note`` rows) shows the interaction happily.

Nothing in the app guarantees that fill happens: ``import_regions`` only fills the
dimension it just replaced, and ``manage.py backfill_location_regions`` fills nothing at
all unless an operator remembers to run it. This task is the missing guarantee, on the
same footing as ``reports.tasks.process_scheduled_reports``.
"""

from __future__ import annotations

import logging

from celery import Task, shared_task

from common.celery import single_instance

from .services import ensure_location_regions

logger = logging.getLogger(__name__)


@shared_task(bind=True)
@single_instance(
    lock_key="celery-lock:regions.tasks.fill_location_regions",
    # Comfortably longer than the interval below: the lock is a re-entrancy guard, not a
    # deadline, and a fill that overran a short TTL would be started a second time
    # underneath itself.
    lock_ttl=60 * 30,
)
def fill_location_regions(self: Task) -> str:
    """Resolve locations that have no region assignment yet.

    **Incremental, deliberately.** ``ensure_location_regions`` without ``force`` only
    considers locations with no ``LocationRegion`` row for the dimension, so steady-state
    cost tracks *new* locations rather than the size of the table. A ``force`` rebuild is
    the importer's job, after boundaries change — doing it here would recompute every
    assignment in the platform every hour for no gain.

    Returns a summary string rather than raising: a run that writes nothing is the normal
    case once the backlog is clear, and Celery beat does not want to be told about it.
    """
    written = ensure_location_regions()
    if written:
        logger.info("regions: filled %d location assignment(s)", written)
    return f"filled {written} location assignment(s)"
