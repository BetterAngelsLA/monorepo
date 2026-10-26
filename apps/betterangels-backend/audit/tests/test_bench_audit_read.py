"""Safety and cleanup contract for the ``bench_audit_read`` harness (ADR 0004 §9c)."""

import os
from io import StringIO
from typing import Any
from unittest import mock

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase, override_settings
from model_bakery import baker

from audit.management.commands.bench_audit_read import (
    _SAMPLE_NAME,
    _SYNTHETIC_LABEL_PREFIX,
    SYNTHETIC_BASE_ID,
    Command,
)
from shelters.models import Shelter, ShelterAvailability

ShelterEvent = Shelter.pgh_event_model  # type: ignore[attr-defined]
ShelterAvailabilityEvent = ShelterAvailability.pgh_event_model  # type: ignore[attr-defined]


@override_settings(DEBUG=True)
class BenchAuditReadSafetyTestCase(TestCase):
    """The harness writes real rows, so it must fail closed and clean up.

    ``baker`` creates a real ``Shelter`` to derive the event template, and its
    ``post_save`` signal creates a tracked ``ShelterAvailability``. The guard,
    collision check, stale-sample cleanup, and the ``finally`` cleanup are all
    part of the safety contract.
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
        self.assertFalse(Shelter.objects.filter(name=_SAMPLE_NAME).exists())
        self.assertFalse(ShelterAvailability.objects.exists())
        self.assertFalse(ShelterEvent.objects.filter(pgh_obj_id__gte=SYNTHETIC_BASE_ID).exists())
        self.assertFalse(ShelterEvent.objects.filter(pgh_label__startswith=_SYNTHETIC_LABEL_PREFIX).exists())
        # The sample's cascade-deleted availability keeps its own event table.
        self.assertFalse(ShelterAvailabilityEvent.objects.exists())

    @override_settings(DEBUG=False)
    def test_refuses_without_debug_or_env_allowance(self) -> None:
        with mock.patch.dict(os.environ, {"BENCH_AUDIT_ALLOWED": "false"}):
            with self.assertRaisesMessage(CommandError, "refusing to run"):
                self._run()

    @override_settings(DEBUG=False)
    def test_env_allowance_bypasses_the_environment_guard(self) -> None:
        with mock.patch.dict(os.environ, {"BENCH_AUDIT_ALLOWED": "true"}):
            self._run()

        self._assert_clean()

    def test_refuses_when_a_real_shelter_uses_the_synthetic_range(self) -> None:
        real = baker.make(Shelter, pk=SYNTHETIC_BASE_ID + 7, name="Real Shelter")

        with self.assertRaisesMessage(CommandError, "synthetic id range"):
            self._run()

        self.assertTrue(Shelter.objects.filter(pk=real.pk).exists())

    def test_stale_bench_sample_is_removed(self) -> None:
        stale = baker.make(Shelter, name=_SAMPLE_NAME)
        self.assertIsNone(stale.organization)

        self._run()

        self.assertFalse(Shelter.objects.filter(pk=stale.pk).exists())
        self._assert_clean()

    def test_cleanup_removes_leftovers_without_inserting(self) -> None:
        # Suppress cleanup to simulate a run killed after insertion.
        with mock.patch.object(Command, "_delete_synthetic", return_value=0):
            self._run()
        self.assertTrue(ShelterEvent.objects.filter(pgh_label__startswith=_SYNTHETIC_LABEL_PREFIX).exists())

        self._run(cleanup=True)

        self._assert_clean()

    def test_cleanup_removes_legacy_kept_rows(self) -> None:
        ShelterEvent.objects.create(
            id=SYNTHETIC_BASE_ID,
            pgh_obj_id=SYNTHETIC_BASE_ID,
            pgh_label="shelter.update",
            name="Synthetic legacy",
        )

        self._run(cleanup=True)

        self._assert_clean()

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
