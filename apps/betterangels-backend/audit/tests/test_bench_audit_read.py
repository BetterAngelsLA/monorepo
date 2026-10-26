"""Cleanup contract for the ``bench_audit_read`` harness (ADR 0004 §9c)."""

from io import StringIO
from typing import Any
from unittest import mock

from django.core.management import call_command
from django.test import TestCase

from audit.management.commands.bench_audit_read import SYNTHETIC_BASE_ID
from shelters.models import Shelter, ShelterAvailability

ShelterEvent = Shelter.pgh_event_model  # type: ignore[attr-defined]
ShelterAvailabilityEvent = ShelterAvailability.pgh_event_model  # type: ignore[attr-defined]


class BenchAuditReadCleanupTestCase(TestCase):
    """The harness is fixture-scaffolding only: it must not leave rows behind.

    ``baker`` creates a real ``Shelter`` to derive the event template, and its
    ``post_save`` signal creates a tracked ``ShelterAvailability``. Both the
    sample and the synthetic rows are removed on the way out, including when the
    measurement raises.
    """

    def _run(self, **options: Any) -> None:
        call_command(
            "bench_audit_read",
            objects=1,
            events_per_object=2,
            runs=1,
            limit=2,
            stdout=StringIO(),
            **options,
        )

    def _assert_clean(self) -> None:
        self.assertFalse(Shelter.objects.filter(name="bench-sample").exists())
        self.assertFalse(ShelterAvailability.objects.exists())
        self.assertFalse(ShelterEvent.objects.filter(pgh_obj_id__gte=SYNTHETIC_BASE_ID).exists())
        # The sample's cascade-deleted availability keeps its own event table.
        self.assertFalse(ShelterAvailabilityEvent.objects.exists())

    def test_run_removes_the_sample_and_synthetic_rows(self) -> None:
        self._run()

        self._assert_clean()

    def test_failure_still_cleans_up(self) -> None:
        with mock.patch(
            "audit.management.commands.bench_audit_read.Command._time_selector",
            side_effect=RuntimeError("boom"),
        ):
            with self.assertRaisesMessage(RuntimeError, "boom"):
                self._run()

        self._assert_clean()
