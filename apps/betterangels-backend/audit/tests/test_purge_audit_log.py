"""Tests for the `purge_audit_log` retention command (ADR 0004 §31)."""

import datetime
import re
from io import StringIO
from pathlib import Path

import pghistory
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase
from django.utils import timezone
from model_bakery import baker
from pghistory.core import event_models
from pghistory.models import Context

from audit.management.commands.purge_audit_log import RETAINED_LABELS
from audit.selectors import object_audit_log
from audit.tests.utils import audit_context
from clients.admin import ClientProfileResource
from clients.enums import LivingSituationEnum
from clients.models import ClientProfile
from shelters.enums import ReservationStatusChoices
from shelters.models import Bed, Reservation, Shelter
from shelters.selectors import reports as reports_selector
from shelters.selectors.reports import daily_occupancy, report_bed_status_counts
from test_utils.pghistory import UPDATE_GUARD, backdate_event_rows

BedEvent = Bed.pgh_event_model  # type: ignore[attr-defined]
ShelterEvent = Shelter.pgh_event_model  # type: ignore[attr-defined]

_OLD = datetime.datetime(2020, 1, 1, tzinfo=datetime.timezone.utc)
_CUTOFF = "2021-01-01"


def _backdate_guarded_events_for_context(context: Context, when: datetime.datetime) -> None:
    """Age every guarded event row that references ``context`` past the cutoff.

    A single tracked write can fan out into several event tables (baker's FK
    auto-creation means one ``Shelter`` writes a ``ShelterAvailability`` too), so
    aging only the row we think we wrote would leave the context referenced and
    the test vacuous.
    """
    for model in event_models():
        names = {trigger.name for trigger in getattr(model._meta, "triggers", [])}
        if UPDATE_GUARD not in names:
            continue
        backdate_event_rows(model._default_manager.filter(pgh_context_id=context.pk), pgh_created_at=when)


def _event_rows_for_context(context: Context, *, retained: bool) -> set[tuple[str, int]]:
    """Every event row referencing ``context``, split by retention status."""
    rows: set[tuple[str, int]] = set()
    for model in event_models():
        if not hasattr(model, "pgh_label"):
            continue
        queryset = model._default_manager.filter(pgh_context_id=context.pk)
        queryset = (
            queryset.filter(pgh_label__in=RETAINED_LABELS)
            if retained
            else queryset.exclude(pgh_label__in=RETAINED_LABELS)
        )
        rows |= {(model._meta.label, pk) for pk in queryset.values_list("pk", flat=True)}
    return rows


class PurgeAuditLogTestCase(TestCase):
    def test_retained_labels_cover_every_label_the_reports_read(self) -> None:
        """``RETAINED_LABELS`` must cover what ``reports.py`` reads (ADR 0004 §31).

        The other retention tests import the same constant the command uses, so
        they cannot catch a *new* report label that was never added to it. Derive
        the set from the report source instead: a label read there but not
        retained would be purged, silently zeroing a report.
        """
        source = Path(reports_selector.__file__).read_text()

        labels = set(re.findall(r'pgh_label="([^"]+)"', source))
        for group in re.findall(r"pgh_label__in=\[([^\]]*)\]", source, re.DOTALL):
            labels.update(re.findall(r'"([^"]+)"', group))

        # Guard against a vacuous pass: the patterns must actually match.
        self.assertTrue(labels)
        self.assertEqual(labels - RETAINED_LABELS, set(), "reports.py reads labels that are not retained")

    def test_refuses_to_purge_inside_the_retention_window(self) -> None:
        """A mistyped date must not truncate live audit history (ADR 0004 §31)."""
        recent = timezone.now().date().isoformat()

        with self.assertRaises(CommandError) as ctx:
            call_command("purge_audit_log", before=recent)

        self.assertIn("retention window", str(ctx.exception))

    def test_force_overrides_the_retention_window(self) -> None:
        recent = timezone.now().date().isoformat()

        # Should not raise; nothing is old enough to delete.
        call_command("purge_audit_log", before=recent, force=True)

    def test_rejects_malformed_before_date(self) -> None:
        with self.assertRaises(CommandError) as ctx:
            call_command("purge_audit_log", before="not-a-date")

        self.assertIn("YYYY-MM-DD", str(ctx.exception))

    def test_rejects_non_positive_batch_size(self) -> None:
        for batch_size in (0, -1):
            with self.subTest(batch_size=batch_size):
                with self.assertRaises(CommandError) as ctx:
                    call_command("purge_audit_log", before=_CUTOFF, batch_size=batch_size)

                self.assertIn("--batch-size", str(ctx.exception))

    # ── deletion scope ───────────────────────────────────────────────────────

    def test_default_scope_leaves_other_apps_alone(self) -> None:
        """``purge_audit_log`` is the audit feature's tool, not a platform-wide purge.

        Client/note/task/referral/account history belongs to those features
        (the client export and ``NoteReverter`` read the same rows), so it is
        only touched when its app is named explicitly.
        """
        profile = baker.make(ClientProfile, first_name="Scope", last_name="Client")
        ClientProfileEvent = ClientProfile.pgh_event_model  # type: ignore[attr-defined]
        client_ids = list(ClientProfileEvent.objects.filter(pgh_obj_id=profile.pk).values_list("pk", flat=True))
        self.assertTrue(client_ids)
        # Only shelter event tables carry the update guard; client rows are
        # aged with a plain UPDATE.
        ClientProfileEvent.objects.filter(pk__in=client_ids).update(pgh_created_at=_OLD)

        call_command("purge_audit_log", before=_CUTOFF)

        self.assertEqual(
            set(ClientProfileEvent.objects.filter(pgh_obj_id=profile.pk).values_list("pk", flat=True)),
            set(client_ids),
        )

    def test_apps_flag_opts_another_app_in(self) -> None:
        profile = baker.make(ClientProfile, first_name="Scoped", last_name="Client")
        ClientProfileEvent = ClientProfile.pgh_event_model  # type: ignore[attr-defined]
        client_ids = list(ClientProfileEvent.objects.filter(pgh_obj_id=profile.pk).values_list("pk", flat=True))
        self.assertTrue(client_ids)
        ClientProfileEvent.objects.filter(pk__in=client_ids).update(pgh_created_at=_OLD)

        call_command("purge_audit_log", before=_CUTOFF, apps=["clients"])

        self.assertFalse(ClientProfileEvent.objects.filter(pk__in=client_ids).exists())

    def test_rejects_an_unknown_app_label(self) -> None:
        with self.assertRaises(CommandError) as ctx:
            call_command("purge_audit_log", before=_CUTOFF, apps=["not-an-app"])

        self.assertIn("Unknown --apps label", str(ctx.exception))

    def test_deletes_event_rows_older_than_the_cutoff(self) -> None:
        # Uses shelter.* (not bed.*): the bed labels are report-critical and so
        # are deliberately retained (see the retained-label tests below).
        shelter = Shelter.objects.create(name="Purge Shelter")
        shelter.name = "Renamed Shelter"
        shelter.save()

        events = ShelterEvent.objects.filter(pgh_obj_id=shelter.pk).order_by("pk")
        ids = list(events.values_list("pk", flat=True))
        self.assertEqual(len(ids), 2)
        # Age both rows: with no surviving event the object needs no boundary row.
        backdate_event_rows(ShelterEvent.objects.filter(pk__in=ids), pgh_created_at=_OLD)

        call_command("purge_audit_log", before=_CUTOFF)

        self.assertFalse(ShelterEvent.objects.filter(pgh_obj_id=shelter.pk).exists())

    def test_retains_the_boundary_row_when_a_newer_event_survives(self) -> None:
        """The newest pre-cutoff row per object is kept: it is the next row's diff base."""
        shelter = Shelter.objects.create(name="Boundary Shelter")
        for name in ("Second Shelter", "Final Shelter"):
            shelter.name = name
            shelter.save()

        events = list(ShelterEvent.objects.filter(pgh_obj_id=shelter.pk).order_by("pk"))
        self.assertEqual(len(events), 3)
        backdate_event_rows(ShelterEvent.objects.filter(pk__in=[events[0].pk, events[1].pk]), pgh_created_at=_OLD)

        call_command("purge_audit_log", before=_CUTOFF)

        # The INSERT goes; the pre-cutoff update stays as the boundary row, so
        # the surviving update still diffs against it.
        self.assertFalse(ShelterEvent.objects.filter(pk=events[0].pk).exists())
        self.assertTrue(ShelterEvent.objects.filter(pk=events[1].pk).exists())
        self.assertTrue(ShelterEvent.objects.filter(pk=events[2].pk).exists())

        # ...and the survivor's diff is intact end to end, not rebased.
        actions = object_audit_log(obj=shelter, target_type="SHELTER").results
        self.assertEqual(actions[0].field_changes["name"], ["Second Shelter", "Final Shelter"])

    def test_retains_the_boundary_row_behind_a_retained_row_with_a_lower_pgh_id(self) -> None:
        """A retained row below the boundary must not invalidate it.

        ``reservation.add`` is in ``RETAINED_LABELS``, so it survives with the
        *lowest* ``pgh_id`` of the object. A boundary test that looked at the
        lowest surviving row would see the insert and conclude the boundary was
        unnecessary, deleting it and silently rebasing the next update. Both
        update rows here change ``notes`` only: ``reservation.status_change`` is
        also retained, so touching ``status`` would leave nothing deletable and
        make the test vacuous.
        """
        shelter = baker.make(Shelter, name="Boundary Shelter")
        bed = Bed.objects.create(shelter=shelter, name="Boundary Bed")
        with audit_context():
            reservation = Reservation.objects.create(bed=bed, notes="A")
        with audit_context():
            reservation.notes = "B"
            reservation.save()
        with audit_context():
            reservation.notes = "C"
            reservation.save()

        ReservationEvent = Reservation.pgh_event_model  # type: ignore[attr-defined]
        rows = list(ReservationEvent.objects.filter(pgh_obj_id=reservation.pk).order_by("pgh_id"))
        self.assertEqual(
            [row.pgh_label for row in rows], ["reservation.add", "reservation.update", "reservation.update"]
        )
        add_row, boundary_row, survivor_row = rows
        backdate_event_rows(ReservationEvent.objects.filter(pk=add_row.pk), pgh_created_at=_OLD)
        backdate_event_rows(ReservationEvent.objects.filter(pk=boundary_row.pk), pgh_created_at=_OLD)

        call_command("purge_audit_log", before=_CUTOFF)

        survivors = ReservationEvent.objects.filter(pgh_obj_id=reservation.pk)
        # Exactly the boundary row and the post-cutoff survivor remain among the
        # deletable-labelled rows. Under the old "lowest surviving row" test the
        # retained add would have made the boundary look unnecessary and it would
        # be deleted, so this set would be missing ``boundary_row``.
        self.assertEqual(
            set(survivors.exclude(pgh_label__in=RETAINED_LABELS).values_list("pk", flat=True)),
            {boundary_row.pk, survivor_row.pk},
        )
        self.assertTrue(survivors.filter(pgh_label__in=RETAINED_LABELS, pk=add_row.pk).exists())

        # Both diffs are intact end to end: the surviving insert is the boundary
        # row's base, so its own diff is ["A", "B"], not null.
        actions = object_audit_log(obj=reservation, target_type="RESERVATION").results
        self.assertEqual(actions[0].field_changes["notes"], ["B", "C"])
        self.assertEqual(actions[1].field_changes["notes"], ["A", "B"])

    def test_purge_does_not_rebase_a_retained_status_change_diff(self) -> None:
        """A retained row's diff must not change when its deletable base is purged.

        The single-boundary rule kept the newest *deletable* row, but a retained
        row's deletable predecessor could still be deleted. Here
        ``reservation.update`` (B) is removed, so a rebased
        ``reservation.status_change`` would diff against ``reservation.add`` and
        falsely claim the notes changed from A to B. The retention interval keeps
        B, so the retained diff is byte-identical before and after the purge.
        """
        shelter = baker.make(Shelter, name="Retained Diff Shelter")
        bed = Bed.objects.create(shelter=shelter, name="Retained Diff Bed")
        with audit_context():
            reservation = Reservation.objects.create(bed=bed, notes="A", status=ReservationStatusChoices.CONFIRMED)
        with audit_context():
            reservation.notes = "B"
            reservation.save()
        with audit_context():
            reservation.status = ReservationStatusChoices.CHECKED_IN
            reservation.save()
        with audit_context():
            reservation.notes = "C"
            reservation.save()
        with audit_context():
            reservation.notes = "D"
            reservation.save()

        def status_change_diff() -> dict:
            actions = object_audit_log(obj=reservation, target_type="RESERVATION").results
            for action in actions:
                for event in action.events:
                    if event.action == "reservation.status_change":
                        self.assertIsNotNone(event.field_changes)
                        return event.field_changes or {}
            raise AssertionError("reservation.status_change event missing")

        before = status_change_diff()
        self.assertEqual(before, {"status": ["Confirmed", "Checked In"]})

        ReservationEvent = Reservation.pgh_event_model  # type: ignore[attr-defined]
        rows = list(ReservationEvent.objects.filter(pgh_obj_id=reservation.pk).order_by("pgh_id"))
        backdate_event_rows(
            ReservationEvent.objects.filter(pk__in=[row.pk for row in rows[:-1]]),
            pgh_created_at=_OLD,
        )
        call_command("purge_audit_log", before=_CUTOFF)

        after = status_change_diff()
        self.assertEqual(after, before, "retained status_change diff was rebased by the purge")

    def test_retention_interval_keeps_unneeded_rows_on_an_active_reservation(self) -> None:
        """Characterizes the accepted over-retention of the contiguous interval.

        ``reservation.add`` is retained and oldest, so the interval spans from it
        to the newest survivor; every interior row is kept, including B and C,
        which are not the immediate predecessor of any survivor. If the interval
        is narrowed to immediate predecessors, B/C become deletable and this test
        must change.
        """
        shelter = baker.make(Shelter, name="Over-retention Shelter")
        bed = Bed.objects.create(shelter=shelter, name="Over-retention Bed")
        with audit_context():
            reservation = Reservation.objects.create(
                bed=bed, notes="A", status=ReservationStatusChoices.CONFIRMED
            )
        with audit_context():
            reservation.notes = "B"
            reservation.save()
        with audit_context():
            reservation.notes = "B2"
            reservation.save()
        with audit_context():
            reservation.status = ReservationStatusChoices.CHECKED_IN
            reservation.save()
        with audit_context():
            reservation.notes = "C"
            reservation.save()
        with audit_context():
            reservation.notes = "C2"
            reservation.save()
        with audit_context():
            reservation.notes = "D"
            reservation.save()

        ReservationEvent = Reservation.pgh_event_model  # type: ignore[attr-defined]
        rows = list(ReservationEvent.objects.filter(pgh_obj_id=reservation.pk).order_by("pgh_id"))
        by_label_notes = {(row.pgh_label, row.notes): row.pk for row in rows}
        backdate_event_rows(
            ReservationEvent.objects.filter(pk__in=[row.pk for row in rows[:-1]]),
            pgh_created_at=_OLD,
        )
        call_command("purge_audit_log", before=_CUTOFF)

        survivors = set(ReservationEvent.objects.filter(pgh_obj_id=reservation.pk).values_list("pk", flat=True))
        self.assertIn(by_label_notes[("reservation.update", "B2")], survivors)
        self.assertIn(by_label_notes[("reservation.update", "C2")], survivors)
        self.assertIn(
            by_label_notes[("reservation.update", "B")],
            survivors,
            "the contiguous interval keeps a non-predecessor interior row",
        )
        self.assertIn(
            by_label_notes[("reservation.update", "C")],
            survivors,
            "the contiguous interval keeps a non-predecessor interior row",
        )

    def test_boundary_row_is_not_retained_without_a_newer_event(self) -> None:
        """A fully-aged object deletes cleanly; the boundary rule adds no row."""
        shelter = Shelter.objects.create(name="Fully Aged")
        shelter.name = "Fully Aged Renamed"
        shelter.save()
        ids = list(ShelterEvent.objects.filter(pgh_obj_id=shelter.pk).values_list("pk", flat=True))
        backdate_event_rows(ShelterEvent.objects.filter(pk__in=ids), pgh_created_at=_OLD)

        out = StringIO()
        call_command("purge_audit_log", before=_CUTOFF, dry_run=True, stdout=out)

        # Both rows are counted for deletion (no boundary row is withheld).
        self.assertIn("would delete 2 event rows", out.getvalue())
        call_command("purge_audit_log", before=_CUTOFF)
        self.assertFalse(ShelterEvent.objects.filter(pgh_obj_id=shelter.pk).exists())

    def test_dry_run_does_not_count_the_boundary_row(self) -> None:
        """The boundary row is deliberately retained, so a dry run must not report it."""
        shelter = Shelter.objects.create(name="Boundary Dry Run")
        shelter.name = "Boundary Dry Run Renamed"
        shelter.save()
        first = ShelterEvent.objects.filter(pgh_obj_id=shelter.pk).order_by("pk").first()
        assert first is not None
        backdate_event_rows(ShelterEvent.objects.filter(pk=first.pk), pgh_created_at=_OLD)

        out = StringIO()
        call_command("purge_audit_log", before=_CUTOFF, dry_run=True, stdout=out)

        self.assertIn("would delete 0 event rows", out.getvalue())
        self.assertTrue(ShelterEvent.objects.filter(pk=first.pk).exists())

    def test_retains_report_critical_labels_and_deletes_the_rest(self) -> None:
        """The blast radius is pinned: report-critical labels survive, the rest go."""
        with pghistory.context(label="scope"):
            shelter = Shelter.objects.create(name="Scope Shelter")
            Bed.objects.create(shelter=shelter, name="Scope Bed")
        context = Context.objects.get(metadata__label="scope")
        _backdate_guarded_events_for_context(context, _OLD)

        retained_before = _event_rows_for_context(context, retained=True)
        deleted_before = _event_rows_for_context(context, retained=False)
        # Guard against a vacuous pass: the fixture must produce both kinds.
        # Scoped to this context: a bare label lookup raises
        # ``MultipleObjectsReturned`` as soon as the class grows a second bed.
        bed_add_pk = BedEvent.objects.get(pgh_context_id=context.pk, pgh_label="bed.add").pk
        self.assertEqual(retained_before, {("shelters.BedEvent", bed_add_pk)})
        self.assertTrue(deleted_before)

        call_command("purge_audit_log", before=_CUTOFF)

        # Every retention-protected row is still there...
        self.assertEqual(_event_rows_for_context(context, retained=True), retained_before)
        # ...and everything else in the same, aged action is gone.
        self.assertEqual(_event_rows_for_context(context, retained=False), set())

    def test_removes_orphan_contexts_and_keeps_referenced_ones(self) -> None:
        with pghistory.context(label="old"):
            baker.make(Shelter, name="Old Shelter")
        old_context = Context.objects.get(metadata__label="old")

        with pghistory.context(label="recent"):
            baker.make(Shelter, name="Recent Shelter")
        recent_context = Context.objects.get(metadata__label="recent")

        # Age the old context and every guarded event row that references it.
        Context.objects.filter(pk=old_context.pk).update(created_at=_OLD)
        _backdate_guarded_events_for_context(old_context, _OLD)

        call_command("purge_audit_log", before=_CUTOFF)

        self.assertFalse(Context.objects.filter(pk=old_context.pk).exists())
        # The recent context is still referenced by a surviving event row.
        self.assertTrue(Context.objects.filter(pk=recent_context.pk).exists())

    # ── batching ─────────────────────────────────────────────────────────────

    def test_drains_more_rows_than_one_batch(self) -> None:
        """Batching must drain the whole set, not stop after ``--batch-size`` rows."""
        shelters = [Shelter.objects.create(name=f"Batch Shelter {i}") for i in range(5)]
        ids = list(ShelterEvent.objects.filter(pgh_obj_id__in=[s.pk for s in shelters]).values_list("pk", flat=True))
        self.assertGreater(len(ids), 2)
        backdate_event_rows(ShelterEvent.objects.filter(pk__in=ids), pgh_created_at=_OLD)

        # A batch smaller than the row count, so draining needs several passes.
        call_command("purge_audit_log", before=_CUTOFF, batch_size=2)

        self.assertFalse(ShelterEvent.objects.filter(pk__in=ids).exists())

    # ── dry-run accounting ───────────────────────────────────────────────────

    def test_dry_run_reports_without_deleting(self) -> None:
        shelter = Shelter.objects.create(name="Dry Run Shelter")
        shelter.name = "Renamed Dry Run Shelter"
        shelter.save()
        ids = list(ShelterEvent.objects.filter(pgh_obj_id=shelter.pk).values_list("pk", flat=True))
        backdate_event_rows(ShelterEvent.objects.filter(pk__in=ids), pgh_created_at=_OLD)

        before_count = ShelterEvent.objects.count()
        out = StringIO()

        call_command("purge_audit_log", before=_CUTOFF, dry_run=True, stdout=out)

        self.assertEqual(ShelterEvent.objects.count(), before_count)
        self.assertTrue(ShelterEvent.objects.filter(pgh_obj_id=shelter.pk).exists())
        self.assertIn("would delete 2 event rows", out.getvalue())

    def test_dry_run_total_is_not_truncated_at_one_batch(self) -> None:
        """A dry run must count the whole set, not just the first batch."""
        shelters = [Shelter.objects.create(name=f"Accurate {i}") for i in range(4)]
        ids = list(ShelterEvent.objects.filter(pgh_obj_id__in=[s.pk for s in shelters]).values_list("pk", flat=True))
        self.assertGreater(len(ids), 2)
        backdate_event_rows(ShelterEvent.objects.filter(pk__in=ids), pgh_created_at=_OLD)

        out = StringIO()
        call_command("purge_audit_log", before=_CUTOFF, dry_run=True, batch_size=1, stdout=out)

        # With ``batch_size=1`` the old per-batch accounting reported "1"; the
        # dry run must equal what the real run then deletes.
        self.assertIn(f"would delete {len(ids)} event rows", out.getvalue())
        self.assertTrue(ShelterEvent.objects.filter(pk__in=ids).exists())

        call_command("purge_audit_log", before=_CUTOFF, batch_size=1)

        self.assertFalse(ShelterEvent.objects.filter(pk__in=ids).exists())

    def test_dry_run_orphan_context_count_is_not_truncated(self) -> None:
        """A dry run counts every orphan context, not just the first batch."""
        contexts = []
        for index in range(4):
            with pghistory.context(label=f"orphan-{index}"):
                Shelter.objects.create(name=f"Orphan {index}")
            contexts.append(Context.objects.get(metadata__label=f"orphan-{index}"))

        # Make them true orphans: a context is only orphaned once no event row
        # references it, which in a real run happens *after* the events go.
        for context in contexts:
            for model in event_models():
                if hasattr(model, "pgh_context_id"):
                    model._default_manager.filter(pgh_context_id=context.pk).delete()
        Context.objects.filter(pk__in=[c.pk for c in contexts]).update(created_at=_OLD)

        out = StringIO()
        call_command("purge_audit_log", before=_CUTOFF, dry_run=True, batch_size=1, stdout=out)

        # With ``batch_size=1`` the old per-batch accounting reported "1".
        self.assertIn("4 orphan contexts", out.getvalue())
        self.assertEqual(Context.objects.filter(pk__in=[c.pk for c in contexts]).count(), 4)

    def test_dry_run_context_count_reflects_state_before_events_are_deleted(self) -> None:
        """Aged contexts whose events are still present are not orphans *yet*.

        The dry run reports what matches at run time; a real run can orphan
        further contexts once it deletes the events that reference them (§31).
        """
        with pghistory.context(label="not-yet-orphan"):
            Shelter.objects.create(name="Not Yet Orphan")
        context = Context.objects.get(metadata__label="not-yet-orphan")
        Context.objects.filter(pk=context.pk).update(created_at=_OLD)
        _backdate_guarded_events_for_context(context, _OLD)

        out = StringIO()
        call_command("purge_audit_log", before=_CUTOFF, dry_run=True, stdout=out)
        self.assertIn("0 orphan contexts", out.getvalue())

        call_command("purge_audit_log", before=_CUTOFF)
        self.assertFalse(Context.objects.filter(pk=context.pk).exists())

    # ── interaction with downstream readers (reports, export) ───────────────

    def test_purge_leaves_report_output_unchanged(self) -> None:
        """The retained labels are the reports' source of truth; the purge is safe.

        Purging the ``bed.*`` rows would zero the occupancy and bed-count
        reports, because ``shelters/selectors/reports.py`` rebuilds state from
        them with no lower bound (ADR 0004 §31).
        """
        with pghistory.context(label="report-fixture"):
            shelter = Shelter.objects.create(name="Report Shelter")
            bed = Bed.objects.create(shelter=shelter, name="Report Bed")
        context = Context.objects.get(metadata__label="report-fixture")
        _backdate_guarded_events_for_context(context, _OLD)

        start = timezone.now() - datetime.timedelta(days=30)
        end = timezone.now()
        counts_before = report_bed_status_counts(shelter=shelter, start=start, end=end)
        occupancy_before = daily_occupancy(shelter=shelter, start=start, end=end)
        # Guard against a vacuous pass: the reports must be non-trivial.
        self.assertTrue(counts_before)
        self.assertTrue(occupancy_before)
        self.assertEqual(occupancy_before[0].total_beds, 1)

        call_command("purge_audit_log", before=_CUTOFF)

        self.assertEqual(report_bed_status_counts(shelter=shelter, start=start, end=end), counts_before)
        self.assertEqual(daily_occupancy(shelter=shelter, start=start, end=end), occupancy_before)
        # ``bed.add`` is the reports' source of truth, so it must survive the purge.
        self.assertTrue(BedEvent.objects.filter(pgh_obj_id=bed.pk, pgh_label="bed.add").exists())

    def test_purge_leaves_the_client_export_unchanged(self) -> None:
        """Client history belongs to the client feature, so the default purge spares it.

        The export derives "initial living situation" from the oldest
        ``ClientProfileEvent`` row, so deleting the history would silently
        report the current value as the initial one.
        """
        profile = baker.make(ClientProfile, living_situation=LivingSituationEnum.TENT)
        profile.living_situation = LivingSituationEnum.HOUSING
        profile.save()

        resource = ClientProfileResource()
        self.assertEqual(resource.dehydrate_living_situation_initial(profile), "Tent")

        ClientProfileEvent = ClientProfile.pgh_event_model  # type: ignore[attr-defined]
        ClientProfileEvent.objects.filter(pgh_obj_id=profile.pk).update(pgh_created_at=_OLD)

        call_command("purge_audit_log", before=_CUTOFF)

        self.assertTrue(ClientProfileEvent.objects.filter(pgh_obj_id=profile.pk).exists())
        self.assertEqual(resource.dehydrate_living_situation_initial(profile), "Tent")
