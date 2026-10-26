"""The audit log's access paths are index-backed (ADR 0004 §10, §20).

The selector filters each event-table branch by its parent FK, pages on
``pgh_id``, and retention filters on ``pgh_created_at``. These tests pin the
indexes to that shape so a future model change cannot quietly turn a log page
into a sequential scan per event table.
"""

import importlib
from typing import Any

from django.db import connection
from django.db.models import ForeignKey
from django.test import TestCase
from pghistory.core import event_models

from audit.selectors import _EXCLUDED_EVENT_MODELS

_context_index = importlib.import_module("audit.migrations.0001_initial")
CONTEXT_INDEX_NAME = _context_index.INDEX_NAME
CONTEXT_TABLE = _context_index.TABLE

PARENT_LABELS = {
    "shelters.Shelter",
    "shelters.Bed",
    "shelters.Room",
    "shelters.Reservation",
}


def _index_fields(model: Any) -> set[tuple[str, ...]]:
    return {tuple(index.fields) for index in model._meta.indexes}


def _referenced_event_models() -> dict[str, Any]:
    """The event models the audit log actually unions, across every target type.

    Scoped to the selector's reachable set: a global lookup's event table (e.g.
    ``DemographicEvent``) is never a branch of a shelter/room/bed/reservation
    log, so it is not required to carry these indexes.
    """
    from shelters.models import Bed, Reservation, Room, Shelter

    labels: set[str] = set()
    for target in (Shelter, Bed, Room, Reservation):
        labels |= {model._meta.label for model in event_models(references_model=target)}
    # Excluded models are dropped from the compiled union (``across()``), so
    # their tables are never read by the log and need no read indexes.
    labels -= set(_EXCLUDED_EVENT_MODELS)
    return {model._meta.label: model for model in event_models() if model._meta.label in labels}


class AuditEventIndexTestCase(TestCase):
    def test_every_referenced_event_table_has_a_created_at_index(self) -> None:
        for label, model in _referenced_event_models().items():
            self.assertIn(("pgh_created_at",), _index_fields(model), label)

    def test_every_parent_fk_branch_pages_on_pgh_id(self) -> None:
        for label, model in _referenced_event_models().items():
            for field in model._meta.fields:
                if not isinstance(field, ForeignKey):
                    continue
                if field.remote_field.model._meta.label not in PARENT_LABELS:
                    continue
                self.assertIn(
                    (field.name, "pgh_id"),
                    _index_fields(model),
                    f"{label} filters branches on {field.name} but cannot page on pgh_id",
                )

    def test_pgh_obj_branches_page_on_pgh_id(self) -> None:
        for label, model in _referenced_event_models().items():
            if not hasattr(model, "pgh_obj_id"):
                continue
            self.assertIn(("pgh_obj", "pgh_id"), _index_fields(model), label)

    def test_context_created_at_index_exists(self) -> None:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT indexname FROM pg_indexes WHERE tablename = %s",
                [CONTEXT_TABLE],
            )
            names = {row[0] for row in cursor.fetchall()}

        self.assertIn(CONTEXT_INDEX_NAME, names)

    def test_parent_fk_index_is_usable_for_the_branch_query(self) -> None:
        """``EXPLAIN`` the branch access pattern with sequential scans disabled.

        The test tables are tiny, so the planner would prefer a sequential scan
        regardless. Disabling it proves the index can serve
        ``WHERE <fk> = ... ORDER BY pgh_id`` rather than just existing in
        ``Meta.indexes``.
        """
        from shelters.models import Bed, Shelter

        shelter = Shelter.objects.create(name="Index Plan Shelter")
        Bed.objects.create(shelter=shelter, name="Bed")

        with connection.cursor() as cursor:
            cursor.execute("SET LOCAL enable_seqscan = off")
            cursor.execute(
                "EXPLAIN (SELECT pgh_id FROM shelters_bedevent WHERE shelter_id = %s ORDER BY pgh_id)",
                [shelter.pk],
            )
            plan = "\n".join(row[0] for row in cursor.fetchall())

        self.assertIn("bed_evt_shelter_idx", plan)
