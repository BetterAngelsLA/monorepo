"""Tests for the object audit-log selector (ADR 0004 §20–§21)."""

import base64
import json
import re
from datetime import datetime, time, timedelta, timezone
from types import SimpleNamespace
from typing import Any
from unittest import mock

from django.apps import apps
from django.core.cache import cache
from django.db import connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from model_bakery import baker
from pghistory.core import event_models
from strawberry import ID

from accounts.models import User
from accounts.role_manager import OrgRoleManager
from accounts.tests.baker_recipes import organization_recipe
from audit.selectors import (
    _EXCLUDED_EVENT_MODELS,
    _LABEL_FIELD_OVERRIDES,
    MAX_ACTOR_LIMIT,
    MAX_LIMIT,
    _label_field,
    _LabelResolver,
    _m2m_meta,
    _scalar_changes,
    _through_event_meta,
    object_audit_actors,
    object_audit_log,
)  # noqa: F401 -- the cursor-aware API is exercised directly by the pagination tests
from audit.tests.utils import audit_context, audit_log, clear_history_context
from audit.types import AuditEventFilter
from clients.models import ClientProfile
from shelters.enums import (
    DayOfWeekChoices,
    DemographicChoices,
    ExitPolicyChoices,
    MedicalNeedChoices,
    ReferralRequirementChoices,
    ReservationStatusChoices,
    ScheduleTypeChoices,
)
from shelters.groups import SHELTER_OPERATOR
from shelters.models import (
    Bed,
    Demographic,
    ExitPolicy,
    MedicalNeed,
    ReferralRequirement,
    Reservation,
    ReservationClient,
    Room,
    Schedule,
    Shelter,
)
from shelters.services.shelter import shelter_update
from test_utils.pghistory import backdate_event_rows


def _action_with(actions: list[Any], value: Any) -> Any | None:
    """The first action whose *resulting* state contains *value* anywhere.

    Matches only the "new" side of a change so a value that is merely the
    before-state of a later write does not match.
    """
    for action in actions:
        for pair in action.field_changes.values():
            if not (isinstance(pair, list) and len(pair) == 2):
                continue
            new = pair[1]
            if new == value or (isinstance(new, list) and value in new):
                return action
    return None


def _summaries(action: Any) -> list[str]:
    """The summarized one-liners in an action, in event order (§32)."""
    return [event.summary for event in action.events if event.summary]


def _action_with_summary(actions: list[Any], text: str) -> Any | None:
    """The first action containing a summary line that mentions *text*."""
    for action in actions:
        if any(text in summary for summary in _summaries(action)):
            return action
    return None


class ObjectAuditLogSelectorTestCase(TestCase):
    def setUp(self) -> None:
        self.user = baker.make(User, first_name="Ada", last_name="Lovelace", email="ada@example.com")

        # Fixture writes are labelled "seed" so they never pollute the log (§11).
        with audit_context(label="seed"):
            self.shelter = Shelter.objects.create(name="Audit Shelter")
            self.demographic_all = Demographic.objects.create(name=DemographicChoices.ALL)
            self.demographic_couples = Demographic.objects.create(name=DemographicChoices.COUPLES)
            self.demographic_families = Demographic.objects.create(name=DemographicChoices.FAMILIES)
            self.shelter.demographics.set([self.demographic_all])
            self.bed = Bed.objects.create(shelter=self.shelter, name="Bed A")
            self.room = Room.objects.create(shelter=self.shelter, name="Room A")
            self.reservation = Reservation.objects.create(bed=self.bed, status=ReservationStatusChoices.CONFIRMED)

    # ── §12 grouping / no double-count ───────────────────────────────────────

    def test_single_save_yields_one_action_with_one_event(self) -> None:
        with audit_context(user=self.user):
            self.shelter.name = "Renamed Shelter"
            self.shelter.save()

        actions = audit_log(obj=self.shelter, target_type="SHELTER")

        self.assertEqual(len(actions), 1)
        self.assertEqual([event.action for event in actions[0].events], ["shelter.update"])
        self.assertEqual(actions[0].field_changes["name"], ["Audit Shelter", "Renamed Shelter"])
        self.assertEqual(actions[0].actor, "Ada Lovelace")

    def test_multiple_writes_in_one_context_are_one_action(self) -> None:
        with audit_context(user=self.user):
            self.shelter.name = "First Rename"
            self.shelter.save()
            self.shelter.name = "Second Rename"
            self.shelter.save()

        actions = audit_log(obj=self.shelter, target_type="SHELTER")
        renames = [a for a in actions if "name" in a.field_changes]

        self.assertEqual(len(renames), 1)
        # First old / last new, so the action reads as a single before→after.
        self.assertEqual(renames[0].field_changes["name"], ["Audit Shelter", "Second Rename"])

    def test_one_action_writing_two_models_does_not_conflate_shared_field_names(self) -> None:
        """A related bed is summarized, never merged into the shelter's fields (§13, §32).

        ``references()`` spans the target plus its related rows, so one action can
        write a Shelter and a Bed. Both have a ``name``; the shelter keeps its own
        before/after and the bed is acknowledged with one line, so no
        ``Bed <id> name`` pair can appear or collide.
        """
        with audit_context(user=self.user):
            self.shelter.name = "Renamed Shelter"
            self.shelter.save()
            self.bed.name = "Renamed Bed"
            self.bed.save()

        actions = audit_log(obj=self.shelter, target_type="SHELTER")

        self.assertEqual(len(actions), 1)
        changes = actions[0].field_changes
        self.assertEqual(changes["name"], ["Audit Shelter", "Renamed Shelter"])
        self.assertNotIn(f"Bed {self.bed.pk} name", changes)
        self.assertEqual(_summaries(actions[0]), [f"Updated Renamed Bed ({self.bed.pk})"])

    def test_one_action_touching_two_rows_of_a_model_keeps_them_separate(self) -> None:
        """Two rows of the *same* model render as two summary lines (§13, §32).

        A bulk write (e.g. the ``label="import"`` CSV import) saves many rows under
        one context. Keying the acknowledgment by field name alone would collapse
        them into one line naming only the last object.
        """
        with audit_context(label="seed"):
            other_bed = Bed.objects.create(shelter=self.shelter, name="Bed B")

        with audit_context(user=self.user):
            self.bed.name = "Renamed Bed A"
            self.bed.save()
            other_bed.name = "Renamed Bed B"
            other_bed.save()

        actions = audit_log(obj=self.shelter, target_type="SHELTER")

        self.assertEqual(len(actions), 1)
        self.assertEqual(
            _summaries(actions[0]),
            [f"Updated Renamed Bed A ({self.bed.pk})", f"Updated Renamed Bed B ({other_bed.pk})"],
        )
        # Neither bed's fields reach the shelter-level rollup.
        self.assertEqual(actions[0].field_changes, {})

    def test_m2m_set_is_one_action_with_one_multi_value_entry(self) -> None:
        with audit_context(user=self.user):
            self.shelter.demographics.set([self.demographic_couples, self.demographic_families])

        actions = audit_log(obj=self.shelter, target_type="SHELTER")
        m2m_actions = [a for a in actions if "demographics" in a.field_changes]

        self.assertEqual(len(m2m_actions), 1)
        removed, added = m2m_actions[0].field_changes["demographics"]
        self.assertEqual(removed, ["all"])
        self.assertCountEqual(added, ["couples", "families"])

    def test_m2m_remove_and_add_share_one_entry(self) -> None:
        with audit_context(user=self.user):
            self.shelter.demographics.set([self.demographic_couples])

        actions = audit_log(obj=self.shelter, target_type="SHELTER")
        m2m_actions = [a for a in actions if "demographics" in a.field_changes]

        self.assertEqual(len(m2m_actions), 1)
        removed, added = m2m_actions[0].field_changes["demographics"]
        self.assertEqual(removed, ["all"])
        self.assertEqual(added, ["couples"])

    def test_m2m_add_and_remove_cancelling_out_omits_empty_action_change(self) -> None:
        with audit_context(user=self.user):
            self.shelter.demographics.add(self.demographic_couples)
            self.shelter.demographics.remove(self.demographic_couples)

        actions = audit_log(obj=self.shelter, target_type="SHELTER")

        self.assertEqual(len(actions), 1)
        self.assertNotIn("demographics", actions[0].field_changes)

    # ── §16 reservation status_change ────────────────────────────────────────

    def test_status_change_renders_as_a_single_event(self) -> None:
        # §2/§16: the two update triggers are disjoint, so a status change emits
        # one ``reservation.status_change`` event (carrying its own diff) and no
        # ``reservation.update`` row to fold in.
        with audit_context(user=self.user):
            self.reservation.status = ReservationStatusChoices.CHECKED_IN
            self.reservation.save()

        actions = audit_log(obj=self.reservation, target_type="RESERVATION")

        self.assertEqual(len(actions), 1)
        action = actions[0]
        labels = [event.action for event in action.events]
        self.assertEqual(labels.count("reservation.status_change"), 1)
        self.assertNotIn("reservation.update", labels)
        self.assertEqual(action.field_changes["status"], ["Confirmed", "Checked In"])

    def test_status_change_and_notes_update_render_both_field_changes(self) -> None:
        # Two writes in one request (a status change + a notes edit) must merge
        # into one action carrying *both* diffs — not just one winner row (§20).
        with audit_context(user=self.user):
            self.reservation.status = ReservationStatusChoices.CHECKED_IN
            self.reservation.save()
            self.reservation.notes = "Bed bugs reported"
            self.reservation.save()

        actions = audit_log(obj=self.reservation, target_type="RESERVATION")

        self.assertEqual(len(actions), 1)
        labels = [event.action for event in actions[0].events]
        self.assertEqual(labels.count("reservation.status_change"), 1)
        self.assertEqual(labels.count("reservation.update"), 1)
        changes = actions[0].field_changes
        self.assertEqual(changes["status"], ["Confirmed", "Checked In"])
        self.assertEqual(changes["notes"], [None, "Bed bugs reported"])

    def test_single_save_changing_status_and_notes_renders_one_event(self) -> None:
        # §2: ``reservation.update`` is gated on status being unchanged, so a
        # single save that touches both emits one ``status_change`` event with
        # the whole diff -- not a second event with empty ``field_changes``.
        with audit_context(user=self.user):
            self.reservation.status = ReservationStatusChoices.CHECKED_IN
            self.reservation.notes = "Checked in with a note"
            self.reservation.save()

        actions = audit_log(obj=self.reservation, target_type="RESERVATION")

        self.assertEqual(len(actions), 1)
        events = actions[0].events
        self.assertEqual([event.action for event in events], ["reservation.status_change"])
        changes = events[0].field_changes
        assert changes is not None
        self.assertEqual(changes["status"], ["Confirmed", "Checked In"])
        self.assertEqual(changes["notes"], [None, "Checked in with a note"])

    # ── §13/§14 INSERT and FK labels ─────────────────────────────────────────

    def test_insert_renders_non_null_fields_and_resolves_fk_labels(self) -> None:
        with audit_context(user=self.user):
            reservation = Reservation.objects.create(bed=self.bed, status=ReservationStatusChoices.CANCELLED)

        actions = audit_log(obj=reservation, target_type="RESERVATION")
        add_action = _action_with(actions, "Cancelled")

        self.assertIsNotNone(add_action)
        assert add_action is not None
        # Keys render the field's verbose_name, FK values its display label (§13/§14).
        self.assertEqual(add_action.field_changes["bed"], [None, "Bed A"])
        self.assertEqual(add_action.field_changes["status"], [None, "Cancelled"])
        self.assertNotIn("created_at", add_action.field_changes)
        self.assertNotIn("updated_at", add_action.field_changes)

    def test_insert_omits_the_primary_key(self) -> None:
        """The pk is in ``pgh_data`` but can never change, so it is not a change (§13).

        The UPDATE branch renders ``pgh_diff``, which never contains it; without
        this the insert branch alone would show ``id: [None, 7]``.
        """
        with audit_context(user=self.user):
            reservation = Reservation.objects.create(bed=self.bed, status=ReservationStatusChoices.CANCELLED)

        add_action = _action_with(audit_log(obj=reservation, target_type="RESERVATION"), "Cancelled")
        self.assertIsNotNone(add_action)
        assert add_action is not None
        self.assertNotIn("id", add_action.field_changes)

    def test_remove_rendering_omits_the_primary_key(self) -> None:
        """The remove branch drops the pk as well (§13)."""
        row = SimpleNamespace(
            pgh_label="bed.remove",
            pgh_obj_model="shelters.Bed",
            pgh_data={"id": 7, "name": "Bed A", "created_at": None, "updated_at": None},
            pgh_diff=None,
        )

        changes = _scalar_changes(row, _LabelResolver())

        self.assertEqual(changes["name"], ["Bed A", None])
        self.assertNotIn("id", changes)

    def test_fk_update_resolves_to_related_display_label(self) -> None:
        """FK ids render the related object's label, anchored on the bed itself (§14).

        The bed's own log is the one that details its fields; the shelter log only
        summarizes the bed (§32).
        """
        with audit_context(user=self.user):
            self.bed.room = self.room
            self.bed.save()

        actions = audit_log(obj=self.bed, target_type="BED")

        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0].field_changes["room"], [None, "Room A"])

    # ── §11 seed / import / clone attribution ────────────────────────────────

    def test_seed_writes_are_excluded(self) -> None:
        with audit_context(user=self.user, label="seed"):
            self.shelter.name = "Seeded Name"
            self.shelter.save()

        actions = audit_log(obj=self.shelter, target_type="SHELTER")

        self.assertIsNone(_action_with(actions, "Seeded Name"))

    def test_import_and_clone_writes_are_retained_and_attributed_to_system(self) -> None:
        with audit_context(user=self.user, label="clone"):
            self.shelter.name = "Cloned Name"
            self.shelter.save()

        actions = audit_log(obj=self.shelter, target_type="SHELTER")
        action = _action_with(actions, "Cloned Name")

        self.assertIsNotNone(action)
        assert action is not None
        self.assertEqual(action.actor, "system (clone)")

    def test_context_less_writes_survive_the_seed_filter_as_singletons(self) -> None:
        clear_history_context()
        self.shelter.name = "No Context A"
        self.shelter.save()
        self.shelter.name = "No Context B"
        self.shelter.save()

        actions = audit_log(obj=self.shelter, target_type="SHELTER")

        first = _action_with(actions, "No Context A")
        second = _action_with(actions, "No Context B")
        self.assertIsNotNone(first)
        self.assertIsNotNone(second)
        self.assertNotEqual(first, second)
        assert first is not None
        self.assertEqual(first.actor, "system")

    def test_context_less_writes_in_different_tables_are_distinct_actions(self) -> None:
        """The context-less key must be unique across event tables (§12).

        The action key falls back to the event's pghistory slug, not ``pgh_id``:
        the latter is a per-table AutoField, so two context-less writes in
        different tables whose sequences both start at 1 would otherwise share a
        key and merge into one spurious action.
        """
        shelter_events = Shelter.pgh_event_model  # type: ignore[attr-defined]
        bed_events = Bed.pgh_event_model  # type: ignore[attr-defined]

        clear_history_context()
        self.shelter.name = "Shelter No Context"
        self.shelter.save()
        self.bed.name = "Bed No Context"
        self.bed.save()

        # The two tables' AutoFields are independent, so a collision is possible
        # but not guaranteed by test order; pin one, so the assertion actually
        # exercises the key's uniqueness rather than sequence coincidence.
        shared_pgh_id = 2_000_000_000
        for model, obj_pk, label in (
            (shelter_events, self.shelter.pk, "shelter.update"),
            (bed_events, self.bed.pk, "bed.update"),
        ):
            row = model._default_manager.filter(pgh_obj_id=obj_pk, pgh_label=label).latest("pgh_id")
            backdate_event_rows(model._default_manager.filter(pk=row.pk), pgh_id=shared_pgh_id)

        actions = audit_log(obj=self.shelter, target_type="SHELTER")

        # Both writes are in the shelter's log (references() spans its beds) but
        # they are two separate actions, not one merged "system" action.
        shelter_action = _action_with(actions, "Shelter No Context")
        bed_action = _action_with_summary(actions, "Bed No Context")
        self.assertIsNotNone(shelter_action)
        self.assertIsNotNone(bed_action)
        self.assertNotEqual(shelter_action, bed_action)

    def test_actor_prefers_frozen_name_over_the_live_user(self) -> None:
        with audit_context(user=self.user):
            self.shelter.name = "Named Actor"
            self.shelter.save()

        actions = audit_log(obj=self.shelter, target_type="SHELTER")
        action = _action_with(actions, "Named Actor")

        assert action is not None
        self.assertEqual(action.actor, "Ada Lovelace")

    def test_frozen_email_is_attributed_without_the_actor_id(self) -> None:
        """A frozen email is enough to attribute an event.

        ``user`` and ``user_email`` land in the same metadata snapshot, but the
        display must not depend on the id key being present: a producer that
        records only the email still knows who acted, and rendering "system"
        there would lose real attribution.
        """
        with audit_context(user_email="lone@example.com"):
            self.shelter.name = "Email Only"
            self.shelter.save()

        actions = audit_log(obj=self.shelter, target_type="SHELTER")
        action = _action_with(actions, "Email Only")

        assert action is not None
        self.assertEqual(action.actor, "lone@example.com")

    # ── §13 full-state snapshot (opt-in) / §10 SQL pagination ────────────────

    def test_snapshot_is_opt_in_and_renders_full_state(self) -> None:
        with audit_context(user=self.user):
            self.shelter.name = "Snapshot Shelter"
            self.shelter.save()

        without = audit_log(obj=self.shelter, target_type="SHELTER")
        self.assertIsNone(without[0].events[0].snapshot)

        with_snapshot = audit_log(obj=self.shelter, target_type="SHELTER", include_snapshot=True)
        snapshot = with_snapshot[0].events[0].snapshot
        self.assertIsNotNone(snapshot)
        assert snapshot is not None
        self.assertEqual(snapshot["name"], "Snapshot Shelter")
        self.assertNotIn("created_at", snapshot)
        self.assertNotIn("updated_at", snapshot)

    def test_fields_sharing_a_verbose_name_are_not_collapsed(self) -> None:
        """Fields that share a ``verbose_name`` must each keep their own key (§13).

        ``Shelter`` gives three tracked fields ``verbose_name="Additional Notes"``
        (``add_notes_sleeping_details``, ``add_notes_shelter_details``,
        ``other_services``). Keying the change/snapshot dicts by display name would
        collapse them, silently dropping all but the last — the one failure an
        audit log must not have. Those fields fall back to their raw names.
        """
        with audit_context(user=self.user):
            self.shelter.add_notes_sleeping_details = "Sleeping detail"
            self.shelter.add_notes_shelter_details = "Shelter detail"
            self.shelter.save()

        actions = audit_log(obj=self.shelter, target_type="SHELTER", include_snapshot=True)

        self.assertEqual(len(actions), 1)
        changes = actions[0].field_changes
        # Both edits survive, under their own (raw) keys — not one collapsed pair.
        self.assertEqual(changes["add_notes_sleeping_details"], [None, "Sleeping detail"])
        self.assertEqual(changes["add_notes_shelter_details"], [None, "Shelter detail"])
        self.assertNotIn("Additional Notes", changes)

        # The snapshot is the full object state, so it carries all three fields.
        snapshot = actions[0].events[0].snapshot
        self.assertIsNotNone(snapshot)
        assert snapshot is not None
        self.assertIn("add_notes_sleeping_details", snapshot)
        self.assertIn("add_notes_shelter_details", snapshot)
        self.assertIn("other_services", snapshot)

    def test_cursor_past_the_oldest_action_returns_no_actions(self) -> None:
        with audit_context(user=self.user):
            self.shelter.name = "Only Rename"
            self.shelter.save()

        first = object_audit_log(obj=self.shelter, target_type="SHELTER", limit=10)
        self.assertEqual(len(first.results), 1)
        self.assertFalse(first.has_next_page)
        self.assertIsNotNone(first.end_cursor)

        # Continuing after the last action is a legitimate, empty page.
        rest = object_audit_log(obj=self.shelter, target_type="SHELTER", after=first.end_cursor)
        self.assertEqual(rest.results, [])
        self.assertFalse(rest.has_next_page)

    def test_limit_and_cursor_are_validated(self) -> None:
        # An oversized/non-positive limit or a malformed cursor is caller input
        # and must raise rather than slicing unboundedly (§10 cap).
        for limit in (0, MAX_LIMIT + 1):
            with self.subTest(limit=limit):
                with self.assertRaises(ValueError):
                    object_audit_log(obj=self.shelter, target_type="SHELTER", limit=limit)

        for cursor in ("not-a-cursor", "", "eyJ2IjogOTk5fQ=="):
            with self.subTest(cursor=cursor):
                with self.assertRaises(ValueError):
                    object_audit_log(obj=self.shelter, target_type="SHELTER", after=cursor)

    def test_max_limit_is_the_inclusive_upper_bound(self) -> None:
        page = object_audit_log(obj=self.shelter, target_type="SHELTER", limit=MAX_LIMIT)
        self.assertIsInstance(page.results, list)

    def test_cursor_pagination_returns_the_requested_page(self) -> None:
        for name in ("Page One", "Page Two", "Page Three"):
            with audit_context(user=self.user):
                self.shelter.name = name
                self.shelter.save()

        first = object_audit_log(obj=self.shelter, target_type="SHELTER", limit=1)
        self.assertEqual([a.field_changes["name"] for a in first.results], [["Page Two", "Page Three"]])
        self.assertTrue(first.has_next_page)

        second = object_audit_log(obj=self.shelter, target_type="SHELTER", limit=1, after=first.end_cursor)
        self.assertEqual([a.field_changes["name"] for a in second.results], [["Page One", "Page Two"]])
        self.assertTrue(second.has_next_page)

        third = object_audit_log(obj=self.shelter, target_type="SHELTER", limit=1, after=second.end_cursor)
        self.assertEqual([a.field_changes["name"] for a in third.results], [["Audit Shelter", "Page One"]])
        self.assertFalse(third.has_next_page)

    def test_cursor_pagination_does_not_duplicate_when_a_write_lands_between_pages(self) -> None:
        """A cursor page must not repeat an action when a new event arrives."""
        for name in ("A", "B", "C", "D"):
            with audit_context(user=self.user):
                self.shelter.name = name
                self.shelter.save()

        page1 = object_audit_log(obj=self.shelter, target_type="SHELTER", limit=2)

        # A new action arrives between page requests. Offset pagination would
        # shift the window and repeat ``C``; the cursor is anchored to the last
        # action of page 1, so it continues strictly after it.
        with audit_context(user=self.user):
            self.shelter.name = "E"
            self.shelter.save()

        page2 = object_audit_log(obj=self.shelter, target_type="SHELTER", limit=2, after=page1.end_cursor)
        names1 = {action.field_changes["name"][1] for action in page1.results}
        names2 = {action.field_changes["name"][1] for action in page2.results}

        self.assertFalse(names1 & names2, f"duplicate across pages: {names1 & names2}")
        # Page 2 continues from where page 1 stopped (B, A), not from the top.
        self.assertEqual(names2, {"A", "B"})

    def test_pagination_is_deterministic_and_newest_first_when_timestamps_tie(self) -> None:
        """Paging must not skip or repeat an action, even with tied timestamps (§10).

        Every event in one test transaction shares ``NOW()``, so the action
        timestamps tie and only the tie-break orders them. A tie-break that is not
        a total, chronological order (e.g. per-table ``pgh_id``, or a lexicographic
        context id where ``"9"`` sorts after ``"10"``) can drop or duplicate an
        action across pages.
        """
        for name in ("Tie One", "Tie Two", "Tie Three"):
            with audit_context(user=self.user):
                self.shelter.name = name
                self.shelter.save()

        seen: list[Any] = []
        cursor: str | None = None
        # Bounded on purpose: a cursor that does not advance (e.g. one the
        # selector ignores) would otherwise loop forever instead of failing.
        for _ in range(10):
            page = object_audit_log(obj=self.shelter, target_type="SHELTER", limit=1, after=cursor)
            seen.extend(page.results)
            cursor = page.end_cursor
            if not page.has_next_page:
                break
        else:
            self.fail("pagination did not terminate; the cursor is not advancing")

        # Exactly one action per page, none repeated, none missing...
        self.assertEqual(len(seen), 3)
        self.assertEqual(len({action.order for action in seen}), 3)
        # ...and ordered newest-first, so the tie-break is chronological too.
        self.assertEqual([action.field_changes["name"][1] for action in seen], ["Tie Three", "Tie Two", "Tie One"])

    def test_pagination_groups_and_limits_in_sql(self) -> None:
        for name in ("Alpha", "Beta", "Gamma"):
            with audit_context(user=self.user):
                self.shelter.name = name
                self.shelter.save()

        with CaptureQueriesContext(connection) as ctx:
            object_audit_log(obj=self.shelter, target_type="SHELTER", limit=1)

        sql = " ".join(query["sql"] for query in ctx.captured_queries).upper()
        # The action keys are grouped and sliced in SQL, not by fetching the
        # object's whole history into Python first (§10). One extra key is read so
        # ``hasNextPage`` needs no count query.
        self.assertIn("GROUP BY", sql)
        self.assertIn("LIMIT 2", sql)

    def test_events_per_action_are_capped(self) -> None:
        """One context can wrap an unbounded write; rendering stops at the cap.

        ``truncated`` means the action's detail is incomplete: the rendered
        events *and* the action-level ``field_changes`` both stop at the cap, so
        the before/after pair can stop mid-sequence. That is the contract; it is
        not a per-event list that was shortened while the rollup stayed complete.
        """
        with audit_context(user=self.user):
            for name in ("Cap One", "Cap Two", "Cap Three", "Cap Four"):
                self.shelter.name = name
                self.shelter.save()

        with mock.patch("audit.selectors.MAX_EVENTS_PER_ACTION", 2):
            page = object_audit_log(obj=self.shelter, target_type="SHELTER", limit=1)

        action = page.results[0]
        self.assertEqual(len(action.events), 2)
        self.assertTrue(action.truncated)
        self.assertEqual(action.field_changes["name"], ["Audit Shelter", "Cap Two"])

    def test_page_rows_filter_on_the_raw_columns(self) -> None:
        """The page fetch must not filter on the computed ``action_key``.

        ``action_key`` is ``COALESCE(CAST(pgh_context_id AS text), pgh_slug)``,
        which no index can serve. The page's rows are selected by
        ``pgh_context_id IN (...)`` / ``pgh_slug IN (...)`` instead. Only the
        ``pgh_context_id`` arm is indexable -- ``pgh_slug`` is synthesized in the
        CTE -- so this asserts the shape of the predicate, not index usage.
        """
        for name in ("Raw One", "Raw Two"):
            with audit_context(user=self.user):
                self.shelter.name = name
                self.shelter.save()

        # A context-less write groups by ``pgh_slug`` (its singleton action key).
        clear_history_context()
        self.shelter.name = "Context Less"
        self.shelter.save()

        with CaptureQueriesContext(connection) as ctx:
            page = object_audit_log(obj=self.shelter, target_type="SHELTER", limit=50)

        self.assertTrue(page.results)
        page_sql = [
            query["sql"]
            for query in ctx.captured_queries
            if "GROUP BY" not in query["sql"].upper() and 'FROM "pghistory_events"' in query["sql"]
        ]
        self.assertTrue(page_sql)
        # Assert on the page predicate, not the whole statement: the SELECT list
        # still computes ``action_key``. Django renders the cast as ``::text``
        # (not ``CAST(... AS text)``), so a whole-statement string check for the
        # computed key cannot fail; the ``WHERE`` clause is what must be raw.
        for statement in page_sql:
            predicate = statement.rsplit("WHERE", 1)[-1]
            self.assertIn('"pgh_context_id" IN', predicate)
            self.assertIn('"pgh_slug" IN', predicate)
            self.assertNotIn("COALESCE", predicate)

    def test_busy_object_query_count_is_bounded_and_page_size_independent(self) -> None:
        # The aggregate CTE spans every event model referencing the target (§10).
        # A busy object must still be served with a bounded number of queries,
        # and asking for a bigger page must not cost more queries — the
        # query-count/latency guard §10/§20 commits to (not just the GROUP BY
        # string check above).
        #
        # Each action is an M2M change so both pages resolve the same related
        # model: event tables have independent ``pgh_id`` sequences, and in a
        # test transaction ``pgh_created_at`` is constant, so the cross-table
        # tie-break ordering is not meaningful for mixing models in one page.
        for index in range(25):
            with audit_context(user=self.user):
                target = self.demographic_couples if index % 2 == 0 else self.demographic_all
                self.shelter.demographics.set([target])

        with CaptureQueriesContext(connection) as one:
            audit_log(obj=self.shelter, target_type="SHELTER", limit=1)
        with CaptureQueriesContext(connection) as many:
            audit_log(obj=self.shelter, target_type="SHELTER", limit=50)

        self.assertEqual(len(one), len(many))
        self.assertLessEqual(len(many), 4)

        sql = " ".join(query["sql"] for query in many.captured_queries).lower()
        # Filtering (the seed exclusion) is pushed into SQL, not applied in Python.
        self.assertIn("seed", sql)
        self.assertIn("group by", sql)

    def test_page_event_budget_defers_actions_instead_of_cutting_them(self) -> None:
        """A page renders complete actions until the event budget is spent.

        With two-event actions and a budget of two, the first action consumes it
        entirely, so the page holds exactly one action. The remaining actions are
        deferred to the next request rather than being truncated or dropped, and
        ``truncated`` stays false because no action was cut by the page budget.
        """
        for name in ("Page One", "Page Two", "Page Three"):
            with audit_context(user=self.user):
                self.shelter.name = name
                self.shelter.save()
                self.shelter.website = f"https://{name.replace(' ', '').lower()}.org"
                self.shelter.save()

        with mock.patch("audit.selectors.MAX_EVENTS_PER_PAGE", 2):
            page = object_audit_log(obj=self.shelter, target_type="SHELTER", limit=50)

        self.assertEqual(len(page.results), 1)
        self.assertEqual(len(page.results[0].events), 2)
        self.assertTrue(page.has_next_page)
        self.assertFalse(page.results[0].truncated)

        # Walking the cursor must return every action exactly once.
        seen: list[str] = [event.action for action in page.results for event in action.events]
        cursor = page.end_cursor
        pages = 1
        while cursor is not None:
            with mock.patch("audit.selectors.MAX_EVENTS_PER_PAGE", 2):
                nxt = object_audit_log(obj=self.shelter, target_type="SHELTER", limit=50, after=cursor)
            pages += 1
            self.assertLessEqual(len(nxt.results), 1, "page budget not applied")
            for action in nxt.results:
                seen.extend(event.action for event in action.events)
                self.assertFalse(action.truncated)
            self.assertLess(pages, 10, "cursor did not advance")
            cursor = nxt.end_cursor

        # Two writes per action, three actions, each event served exactly once.
        self.assertEqual(len(seen), 6)
        self.assertFalse(nxt.has_next_page)

    def test_page_budget_sets_has_next_page_when_actions_remain(self) -> None:
        """The budget gate, not the ``limit + 1`` probe, can set ``hasNextPage``.

        The newest action is a single-event write, so it fills a budget of one
        exactly; the two-event action before it is deferred and ``hasNextPage``
        must still be true even though the SQL probe found nothing beyond
        ``limit``.
        """
        with audit_context(user=self.user):
            self.shelter.name = "Budget Solo"
            self.shelter.save()
            self.shelter.website = "https://first.example.org"
            self.shelter.save()
        with audit_context(user=self.user):
            self.shelter.phone = "555-0100"
            self.shelter.save()

        with mock.patch("audit.selectors.MAX_EVENTS_PER_PAGE", 1):
            page = object_audit_log(obj=self.shelter, target_type="SHELTER", limit=50)

        self.assertEqual(len(page.results), 1)
        self.assertEqual(len(page.results[0].events), 1)
        self.assertTrue(page.has_next_page)
        self.assertIsNotNone(page.end_cursor)

    def test_event_without_a_diff_base_renders_null_not_empty(self) -> None:
        """A purged predecessor renders ``None``; a no-op write renders ``{}``.

        ``None`` and ``{}`` are different facts: "the base is gone" versus "nothing
        renderable changed". Collapsing them makes a purged event look like a
        write that touched nothing.
        """
        with audit_context(user=self.user):
            self.shelter.name = "Base One"
            self.shelter.save()

        ShelterEvent = Shelter.pgh_event_model  # type: ignore[attr-defined]
        first = ShelterEvent.objects.filter(pgh_obj_id=self.shelter.pk).order_by("pgh_id").first()
        assert first is not None
        # Delete the base row directly: events allow DELETE (ADR 0004 §9b).
        first.delete()

        page = object_audit_log(obj=self.shelter, target_type="SHELTER", limit=10)
        self.assertTrue(page.results)
        event = page.results[0].events[0]
        self.assertEqual(event.kind, "UPDATE")
        self.assertIsNone(event.field_changes)

    def test_rejects_a_naive_timestamp_cursor(self) -> None:
        """A cursor without an offset would be coerced with the server timezone."""
        payload = json.dumps({"v": 1, "t": "2026-01-01T00:00:00", "i": 1, "k": "00000000-0000-0000-0000-000000000000"})
        cursor = base64.urlsafe_b64encode(payload.encode()).decode()

        with self.assertRaises(ValueError):
            object_audit_log(obj=self.shelter, target_type="SHELTER", after=cursor)

    # ── §19 multi-word M2M columns (the regression-prone names) ──────────────

    def test_multi_word_m2m_columns_render_via_the_through_map(self) -> None:
        # The multi-word FK columns are the most likely to silently regress:
        # Django strips underscores when auto-naming the through FK, so
        # medical_needs -> medicalneed_id, exit_policy -> exitpolicy_id,
        # referral_requirement -> referralrequirement_id (§19, §20).
        with audit_context(user=self.user):
            medical_need = MedicalNeed.objects.create(name=MedicalNeedChoices.ERC)
            exit_policy = ExitPolicy.objects.create(name=ExitPolicyChoices.MIA)
            referral_requirement = ReferralRequirement.objects.create(name=ReferralRequirementChoices.SELF_REFERRAL)
            self.bed.medical_needs.set([medical_need])
            self.shelter.exit_policy.set([exit_policy])
            self.shelter.referral_requirement.set([referral_requirement])

        bed_actions = audit_log(obj=self.bed, target_type="BED")
        self.assertEqual(len(bed_actions), 1)
        # Rendering the correct through FK column proves it was attributed
        # rather than dropped to the non-M2M path (§19).
        removed, added = bed_actions[0].field_changes["medical needs"]
        self.assertEqual(removed, [])
        self.assertEqual(added, ["erc"])

        shelter_actions = audit_log(obj=self.shelter, target_type="SHELTER")
        self.assertEqual(len(shelter_actions), 1)
        changes = shelter_actions[0].field_changes
        self.assertEqual(changes["exit policy"], [[], ["mia"]])
        self.assertEqual(changes["referral requirement"], [[], ["self_referral"]])

    # ── §19 through-map completeness / §10 references boundary ───────────────

    def test_through_metadata_is_derived_and_matches_the_pinned_map(self) -> None:
        # The derived map must cover every through event model in ``references()``
        # (a new M2M field cannot fall out of the M2M rendering path, §19)...
        expected: set[str] = set()
        for model in (Shelter, Bed, Room):
            expected |= {
                event_model._meta.label
                for event_model in event_models(references_model=model)
                if not hasattr(event_model, "pgh_obj_id")
            }

        derived = _through_event_meta()
        self.assertEqual(set(derived), expected)

        # ...and, because the map is now derived rather than hand-maintained, pin
        # its full contents literally (the stronger guard, mirroring the
        # ``_EXPECTED_*_REFERENCES`` boundary pins below): the introspection that
        # produces it must not silently change how a row is attributed/rendered.
        self.assertEqual(
            {label: (meta.parent_col, meta.related_fk_field) for label, meta in derived.items()},
            _EXPECTED_THROUGH_EVENT_META,
        )
        for meta in derived.values():
            self.assertIn(meta.parent_col, {"shelter_id", "bed_id", "room_id"})
            self.assertTrue(meta.related_fk_field)
            self.assertTrue(meta.display_name)
            self.assertTrue(meta.related_model_label)

        # A non-through event resolves to no M2M metadata; a multi-word through FK
        # resolves to its ``m2m.verbose_name``.
        self.assertIsNone(_m2m_meta("shelters.ShelterEvent"))
        medical_need_meta = _m2m_meta("shelters.TrackedBedMedicalNeedEvent")
        self.assertIsNotNone(medical_need_meta)
        assert medical_need_meta is not None
        self.assertEqual(medical_need_meta.display_name, "medical needs")

    def test_label_field_derives_defaults_and_pins_overrides(self) -> None:
        # The default ``display_name`` -> ``name`` chain reproduces every label
        # except three product-specific overrides (§14) — no hand-maintained list.
        self.assertEqual(
            _LABEL_FIELD_OVERRIDES,
            {
                "shelters.SPA": "short_name",  # ``name`` is an int-choices field
                "clients.ClientProfile": "full_name",
                "accounts.User": "email",
            },
        )
        self.assertEqual(_label_field(apps.get_model("shelters.Demographic")), "name")
        self.assertEqual(_label_field(apps.get_model("shelters.Service")), "display_name")
        self.assertEqual(_label_field(apps.get_model("shelters.SPA")), "short_name")

        # Every M2M related model resolves to some label field, never the raw id.
        related_models = {
            m2m.related_model._meta.label for model in (Shelter, Bed, Room) for m2m in model._meta.many_to_many
        }
        unresolved = {label for label in related_models if _label_field(apps.get_model(label)) is None}
        self.assertFalse(unresolved, unresolved)

    def test_references_boundary_for_shelter_minus_the_blocklist(self) -> None:
        labels = {event_model._meta.label for event_model in event_models(references_model=Shelter)}

        # The *match* set is unchanged: ContactInfo still references a Shelter
        # (and its rows are still written); the log excludes it below.
        self.assertEqual(labels, _EXPECTED_SHELTER_REFERENCES)
        self.assertIn("referrals.ReferralEvent", labels)
        self.assertIn("shelters.ContactInfoEvent", labels)
        self.assertEqual(_EXCLUDED_EVENT_MODELS, ("referrals.ReferralEvent", "shelters.ContactInfoEvent"))

    def test_excluded_branches_are_dropped_from_the_compiled_union(self) -> None:
        """``across()`` removes an excluded table from the SQL, not just its rows.

        A row-level ``.exclude(pgh_model__in=...)`` still compiles every UNION
        branch, so the excluded table is scanned and its rows thrown away. The
        compiled statement must not mention them at all.
        """
        with audit_context(user=self.user):
            self.shelter.name = "Branch Pruning"
            self.shelter.save()

        with CaptureQueriesContext(connection) as captured:
            audit_log(obj=self.shelter, target_type="SHELTER", limit=50)

        sql = " ".join(query["sql"] for query in captured.captured_queries).lower()
        self.assertNotIn("referrals_referralevent", sql)
        self.assertNotIn("shelters_contactinfoevent", sql)

    def test_references_boundary_for_bed(self) -> None:
        labels = {event_model._meta.label for event_model in event_models(references_model=Bed)}

        self.assertEqual(labels, _EXPECTED_BED_REFERENCES)
        # A bed reaches the reservations on it and its own TrackedBed* proxies.
        self.assertIn("shelters.ReservationEvent", labels)

    def test_room_and_bed_logs_exclude_reservations_but_keep_own_config_changes(self) -> None:
        # ``references()`` matches ``ReservationEvent`` via ``room_id``/``bed_id``,
        # but the *log* filters it out: a room/bed log is its own configuration,
        # not every stay that referenced it (§10). The room log also drops
        # ``BedEvent``, because beds have their own log (§32).
        with audit_context(user=self.user):
            Reservation.objects.create(bed=self.bed, room=self.room, status=ReservationStatusChoices.CANCELLED)
        with audit_context(user=self.user):
            self.room.name = "Renamed Room"
            self.room.save()

        room_actions = audit_log(obj=self.room, target_type="ROOM")
        self.assertEqual(len(room_actions), 1)
        self.assertEqual(room_actions[0].field_changes.get("name"), ["Room A", "Renamed Room"])
        self.assertEqual(_summaries(room_actions[0]), [])

        self.assertEqual(audit_log(obj=self.bed, target_type="BED"), [])

    def test_room_log_contains_no_bed_events(self) -> None:
        # ``references(Room)`` reaches a bed only through ``Bed.room``, so the
        # bed must actually belong to the room or this test passes with the
        # scoped exclusion deleted.
        with audit_context(label="seed"):
            self.bed.room = self.room
            self.bed.save()
        with audit_context(user=self.user):
            self.bed.name = "Bed Renamed Under Room"
            self.bed.save()

        self.assertEqual(audit_log(obj=self.room, target_type="ROOM"), [])

    def test_bed_log_keeps_full_field_changes(self) -> None:
        with audit_context(user=self.user):
            self.bed.name = "Detailed Bed"
            self.bed.save()

        actions = audit_log(obj=self.bed, target_type="BED")

        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0].field_changes, {"name": ["Bed A", "Detailed Bed"]})
        self.assertEqual(_summaries(actions[0]), [])

    def test_references_boundary_for_room(self) -> None:
        labels = {event_model._meta.label for event_model in event_models(references_model=Room)}

        self.assertEqual(labels, _EXPECTED_ROOM_REFERENCES)
        # ``references()`` matches these, but the Room *log* drops both
        # ReservationEvent and BedEvent (see the exclusion test above).
        self.assertIn("shelters.BedEvent", labels)
        self.assertIn("shelters.ReservationEvent", labels)

    # ── statement-shape and cursor guards (ADR 0004 §10) ─────────────────────

    # The aggregate statement's size tracks the number of event models
    # ``references()`` matches, so these ceilings catch a newly tracked model
    # (each branch adds a few KB). They are a growth guard over the measured SQL,
    # not a hard bound the design must meet: pagination bounds rows fetched, not
    # the statement text, because the aggregate CTE still names every matched
    # table. Target-scoped exclusions are passed to ``across()`` as well, so they
    # prune UNION branches and shrink the statement rather than filtering rows
    # after the scan; the ceilings below are measured with those exclusions in
    # place.
    #
    # Recorded from the interpolated SQL the selector actually issues (the max
    # over its grouped key query and page query, measured by the test below),
    # rounded up with ~5% headroom.
    _STATEMENT_CEILINGS = {"SHELTER": 76_500, "BED": 20_600, "ROOM": 20_800, "RESERVATION": 7_150}

    def test_selector_issues_no_server_side_cursor(self) -> None:
        """``.iterator()`` would add a ``DECLARE``/``FETCH`` round trip (§10)."""
        with audit_context(user=self.user):
            self.shelter.name = "Renamed Shelter"
            self.shelter.save()

        with CaptureQueriesContext(connection) as captured:
            audit_log(obj=self.shelter, target_type="SHELTER")

        sql = "\n".join(query["sql"] for query in captured.captured_queries)

        # Guard against a vacuous pass: the selector must have issued its
        # aggregate CTE query (key query + page query).
        self.assertTrue(captured.captured_queries)
        self.assertIn("WITH", sql.upper())

        self.assertIsNone(re.search(r"\bDECLARE\b", sql, re.IGNORECASE))

    def test_selector_statement_stays_within_the_recorded_ceiling(self) -> None:
        """Guard the aggregate statement against growth (see the ADR §10 note).

        Measured on the statements the selector actually issues — its grouped key
        query plus the page query — not the bare ``references()`` queryset. The
        annotate/``values``/``order_by`` slice is what ships, and its per-model
        branch count is what grows. Sizes are the interpolated SQL captured at
        run time (the same basis the ceilings were recorded from).
        """
        # A non-seed write, so the selector takes its full path (grouped key query
        # plus the page query) instead of returning early on a seed-only history.
        with audit_context(user=self.user):
            self.shelter.name = "Ceiling Shelter"
            self.shelter.save()
            self.bed.name = "Ceiling Bed"
            self.bed.save()
            self.room.name = "Ceiling Room"
            self.room.save()
            self.reservation.notes = "Ceiling reservation"
            self.reservation.save()

        for target_type, obj in (
            ("SHELTER", self.shelter),
            ("BED", self.bed),
            ("ROOM", self.room),
            ("RESERVATION", self.reservation),
        ):
            with CaptureQueriesContext(connection) as captured:
                audit_log(obj=obj, target_type=target_type, limit=1)

            size = max((len(query["sql"]) for query in captured.captured_queries), default=0)

            self.assertLessEqual(size, self._STATEMENT_CEILINGS[target_type], f"{target_type} statement grew to {size}")


class AuditDisplayScopeTestCase(TestCase):
    """Display scopes: summarized Bed/Room writes and hidden reservations (§32)."""

    def setUp(self) -> None:
        self.user = baker.make(User, first_name="Ada", last_name="Lovelace", email="ada@example.com")
        with audit_context(label="seed"):
            self.shelter = Shelter.objects.create(name="Scope Shelter")
            self.room = Room.objects.create(shelter=self.shelter, name="Room A")

    def _log(self, **kwargs: Any) -> list[Any]:
        return audit_log(obj=self.shelter, target_type="SHELTER", **kwargs)

    def test_shelter_log_summarizes_bed_and_room_writes(self) -> None:
        with audit_context(user=self.user):
            bed = Bed.objects.create(shelter=self.shelter, name="Bed A")
            self.room.name = "Room B"
            self.room.save()

        actions = self._log()

        self.assertEqual(len(actions), 1)
        self.assertCountEqual(
            _summaries(actions[0]),
            [f"Created Bed A ({bed.pk})", f"Updated Room B ({self.room.pk})"],
        )
        # Nothing else about either object reaches the shelter-level rollup.
        self.assertEqual(actions[0].field_changes, {})
        self.assertEqual([event.field_changes for event in actions[0].events], [{}, {}])

    def test_related_only_insert_does_not_claim_the_shelter_was_created(self) -> None:
        """The action verb follows the anchor, not a related row's label."""
        with audit_context(user=self.user):
            Bed.objects.create(shelter=self.shelter, name="Bed A")

        actions = self._log()

        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0].summary, f"{self.user.full_name} modified shelter {self.shelter.pk}")
        self.assertNotIn("created shelter", actions[0].summary)

    def test_shelter_summary_does_not_leak_bed_detail_or_snapshot(self) -> None:
        with audit_context(label="seed"):
            bed = Bed.objects.create(shelter=self.shelter, name="Bed A")

        with audit_context(user=self.user):
            bed.name = "Bed B"
            bed.room = self.room
            bed.save()

        actions = self._log(include_snapshot=True)
        action = _action_with_summary(actions, "Bed B")

        self.assertIsNotNone(action)
        assert action is not None
        self.assertEqual(_summaries(action), [f"Updated Bed B ({bed.pk})"])
        self.assertEqual(action.field_changes, {})
        self.assertEqual(action.events[0].field_changes, {})
        self.assertIsNone(action.events[0].snapshot)

    def test_repeated_bed_saves_collapse_to_one_summary_line(self) -> None:
        with audit_context(label="seed"):
            bed = Bed.objects.create(shelter=self.shelter, name="Bed A")

        with audit_context(user=self.user):
            bed.name = "Bed B"
            bed.save()
            bed.status_notes = "Second write"
            bed.save()

        actions = self._log()

        self.assertEqual(len(actions), 1)
        self.assertEqual(_summaries(actions[0]), [f"Updated Bed B ({bed.pk})"])

    def test_deleted_bed_is_summarized_with_its_last_name(self) -> None:
        with audit_context(label="seed"):
            bed = Bed.objects.create(shelter=self.shelter, name="Bed A")
            bed_id = bed.pk

        with audit_context(user=self.user):
            bed.delete()

        actions = self._log()

        self.assertEqual(len(actions), 1)
        self.assertEqual(_summaries(actions[0]), [f"Deleted Bed A ({bed_id})"])

    def test_summary_falls_back_when_a_bed_has_no_name(self) -> None:
        # ``Bed.name`` is nullable, so the line must not render "None".
        with audit_context(user=self.user):
            bed = Bed.objects.create(shelter=self.shelter)

        actions = self._log()

        self.assertEqual(_summaries(actions[0]), [f"Created Bed #{bed.pk} ({bed.pk})"])

    def test_shelter_log_cannot_reach_reservation_rows(self) -> None:
        """A Shelter log omits reservations structurally, not by an exclusion.

        ``Reservation`` reaches a shelter only through ``bed``/``room``, so
        ``references(Shelter)`` never matches these event models and
        ``_SCOPED_EXCLUSIONS`` needs no ``SHELTER`` entry. This asserts the
        *reach*, which is what actually keeps them out -- the older version of
        this test asserted a bare empty log, which passes even if an exclusion
        is doing nothing.
        """
        with audit_context(label="seed"):
            bed = Bed.objects.create(shelter=self.shelter, name="Bed A")
            reservation = Reservation.objects.create(bed=bed, status=ReservationStatusChoices.CONFIRMED)
            profile = baker.make(ClientProfile, first_name="Grace", last_name="Hopper")

        with audit_context(user=self.user):
            reservation.notes = "Hidden detail"
            reservation.save()
            reservation_client = ReservationClient.objects.create(reservation=reservation, client_profile=profile)

        # Positive control: both rows exist, so the empty log below is not a
        # write that never happened.
        self.assertTrue(
            Reservation.pgh_event_model.objects.filter(  # type: ignore[attr-defined]
                pgh_obj_id=reservation.pk
            ).exists()
        )
        self.assertTrue(
            ReservationClient.pgh_event_model.objects.filter(  # type: ignore[attr-defined]
                pgh_obj_id=reservation_client.pk
            ).exists()
        )

        shelter_references = {model._meta.label for model in event_models(references_model=Shelter)}
        self.assertNotIn("shelters.ReservationEvent", shelter_references)
        self.assertNotIn("shelters.ReservationClientEvent", shelter_references)

        self.assertEqual(audit_log(obj=self.shelter, target_type="SHELTER"), [])

    def test_internal_reservation_path_still_renders_its_own_log(self) -> None:
        """Tracking is unchanged; only the public surface is withdrawn (§32)."""
        with audit_context(label="seed"):
            bed = Bed.objects.create(shelter=self.shelter, name="Bed A")
            reservation = Reservation.objects.create(bed=bed, status=ReservationStatusChoices.CONFIRMED)
            profile = baker.make(ClientProfile, first_name="Grace", last_name="Hopper")

        with audit_context(user=self.user):
            reservation_client = ReservationClient.objects.create(
                reservation=reservation, client_profile=profile, is_primary=True
            )

        actions = audit_log(obj=reservation, target_type="RESERVATION")

        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0].events[0].action, "reservation_client.add")
        key = f"Reservation client {reservation_client.pk} client profile"
        self.assertEqual(actions[0].field_changes[key], [None, "Grace Hopper"])


# §19 through-table rendering metadata, pinned literally. The map is *derived*
# at run time from pghistory introspection, so this literal is what catches a
# derivation regression (a changed parent column or related FK field), mirroring
# the ``references()`` boundary pins below. Values are ``(parent_col,
# related_fk_field)``.
_EXPECTED_THROUGH_EVENT_META = {
    "shelters.TrackedAccessibilityEvent": ("shelter_id", "accessibility"),
    "shelters.TrackedBedAccessibilityEvent": ("bed_id", "accessibility"),
    "shelters.TrackedBedDemographicEvent": ("bed_id", "demographic"),
    "shelters.TrackedBedFunderEvent": ("bed_id", "funder"),
    "shelters.TrackedBedMedicalNeedEvent": ("bed_id", "medicalneed"),
    "shelters.TrackedBedPetEvent": ("bed_id", "pet"),
    "shelters.TrackedCityEvent": ("shelter_id", "city"),
    "shelters.TrackedDemographicEvent": ("shelter_id", "demographic"),
    "shelters.TrackedEntryRequirementEvent": ("shelter_id", "entryrequirement"),
    "shelters.TrackedExitPolicyEvent": ("shelter_id", "exitpolicy"),
    "shelters.TrackedFunderEvent": ("shelter_id", "funder"),
    "shelters.TrackedParkingEvent": ("shelter_id", "parking"),
    "shelters.TrackedPetEvent": ("shelter_id", "pet"),
    "shelters.TrackedReferralRequirementEvent": ("shelter_id", "referralrequirement"),
    "shelters.TrackedRoomAccessibilityEvent": ("room_id", "accessibility"),
    "shelters.TrackedRoomDemographicEvent": ("room_id", "demographic"),
    "shelters.TrackedRoomFunderEvent": ("room_id", "funder"),
    "shelters.TrackedRoomPetEvent": ("room_id", "pet"),
    "shelters.TrackedRoomStyleEvent": ("shelter_id", "roomstyle"),
    "shelters.TrackedSPAEvent": ("shelter_id", "spa"),
    "shelters.TrackedServiceEvent": ("shelter_id", "service"),
    "shelters.TrackedShelterProgramEvent": ("shelter_id", "shelterprogram"),
    "shelters.TrackedShelterTypeEvent": ("shelter_id", "sheltertype"),
    "shelters.TrackedSpecialSituationRestrictionEvent": ("shelter_id", "specialsituationrestriction"),
    "shelters.TrackedStorageEvent": ("shelter_id", "storage"),
    "shelters.TrackedVaccinationRequirementEvent": ("shelter_id", "vaccinationrequirement"),
}

_EXPECTED_SHELTER_REFERENCES = {
    "shelters.ShelterEvent",
    "shelters.BedEvent",
    "shelters.RoomEvent",
    "shelters.ContactInfoEvent",
    "shelters.ShelterAvailabilityEvent",
    "shelters.ShelterPhotoEvent",
    "shelters.VideoEvent",
    "shelters.MediaLinkEvent",
    "shelters.ScheduleEvent",
    "shelters.TrackedDemographicEvent",
    "shelters.TrackedSpecialSituationRestrictionEvent",
    "shelters.TrackedShelterTypeEvent",
    "shelters.TrackedRoomStyleEvent",
    "shelters.TrackedAccessibilityEvent",
    "shelters.TrackedStorageEvent",
    "shelters.TrackedPetEvent",
    "shelters.TrackedParkingEvent",
    "shelters.TrackedEntryRequirementEvent",
    "shelters.TrackedVaccinationRequirementEvent",
    "shelters.TrackedCityEvent",
    "shelters.TrackedSPAEvent",
    "shelters.TrackedShelterProgramEvent",
    "shelters.TrackedFunderEvent",
    "shelters.TrackedExitPolicyEvent",
    "shelters.TrackedReferralRequirementEvent",
    "shelters.TrackedServiceEvent",
    "referrals.ReferralEvent",
}

# Bed/Room ``references()`` match sets, pinned literally (like the Shelter set)
# so adding a model with a bed_id/room_id FK must be acknowledged, not silently
# absorbed. These are the *match* sets — the Room/Bed log additionally drops
# ``ReservationEvent`` (§10).
_EXPECTED_BED_REFERENCES = {
    "shelters.BedEvent",
    "shelters.ReservationEvent",
    "shelters.TrackedBedAccessibilityEvent",
    "shelters.TrackedBedDemographicEvent",
    "shelters.TrackedBedFunderEvent",
    "shelters.TrackedBedMedicalNeedEvent",
    "shelters.TrackedBedPetEvent",
}

_EXPECTED_ROOM_REFERENCES = {
    "shelters.BedEvent",
    "shelters.ReservationEvent",
    "shelters.RoomEvent",
    "shelters.TrackedRoomAccessibilityEvent",
    "shelters.TrackedRoomDemographicEvent",
    "shelters.TrackedRoomFunderEvent",
    "shelters.TrackedRoomPetEvent",
}


class ObjectAuditLogFilterTestCase(TestCase):
    """Date/actor filters (ADR 0004 §21), applied in SQL before grouping (§10)."""

    T1 = datetime(2026, 1, 1, 12, 0, tzinfo=timezone.utc)
    T2 = datetime(2026, 2, 1, 12, 0, tzinfo=timezone.utc)
    T3 = datetime(2026, 3, 1, 12, 0, tzinfo=timezone.utc)
    T4 = datetime(2026, 4, 1, 12, 0, tzinfo=timezone.utc)

    def setUp(self) -> None:
        self.user = baker.make(User, first_name="Ada", last_name="Lovelace", email="ada@example.com")
        self.other_user = baker.make(User, first_name="Grace", last_name="Hopper", email="grace@example.com")
        with audit_context(label="seed"):
            self.shelter = Shelter.objects.create(name="Filter Shelter")

    def _rename(self, name: str, *, at: datetime, user: User | None = None) -> None:
        """Rename the shelter, then pin the event's timestamp for determinism."""
        with audit_context(user=user):
            self.shelter.name = name
            self.shelter.save()
        backdate_event_rows(
            Shelter.pgh_event_model.objects.filter(  # type: ignore[attr-defined]
                pgh_obj_id=self.shelter.pk, pgh_label="shelter.update", name=name
            ),
            pgh_created_at=at,
        )

    def _log(self, **kwargs: Any) -> list[Any]:
        return audit_log(obj=self.shelter, target_type="SHELTER", **kwargs)

    def test_date_from_is_inclusive_and_excludes_earlier_actions(self) -> None:
        self._rename("Early", at=self.T1, user=self.user)
        self._rename("Late", at=self.T2, user=self.user)

        actions = self._log(filters=AuditEventFilter(date_from=self.T2))

        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0].field_changes["name"], ["Early", "Late"])

    def test_date_to_is_inclusive_and_excludes_later_actions(self) -> None:
        self._rename("Early", at=self.T1, user=self.user)
        self._rename("Late", at=self.T2, user=self.user)

        actions = self._log(filters=AuditEventFilter(date_to=self.T1))

        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0].field_changes["name"], ["Filter Shelter", "Early"])

    def test_date_window_bounds_both_ends(self) -> None:
        self._rename("Early", at=self.T1, user=self.user)
        self._rename("Middle", at=self.T2, user=self.user)
        self._rename("Late", at=self.T3, user=self.user)

        actions = self._log(filters=AuditEventFilter(date_from=self.T2, date_to=self.T2))

        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0].field_changes["name"], ["Early", "Middle"])

    def test_actor_id_restricts_to_a_single_actor(self) -> None:
        self._rename("By Ada", at=self.T1, user=self.user)
        self._rename("By Grace", at=self.T2, user=self.other_user)

        actions = self._log(filters=AuditEventFilter(actor_id=ID(str(self.user.pk))))

        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0].field_changes["name"], ["Filter Shelter", "By Ada"])

    def test_unknown_actor_id_yields_no_actions(self) -> None:
        self._rename("By Ada", at=self.T1, user=self.user)

        self.assertEqual(self._log(filters=AuditEventFilter(actor_id=ID("999999"))), [])

    def test_actor_id_excludes_context_less_system_events(self) -> None:
        clear_history_context()
        self.shelter.name = "System Write"
        self.shelter.save()

        self.assertEqual(self._log(filters=AuditEventFilter(actor_id=ID(str(self.user.pk)))), [])
        # The system write is still present when no actor filter is applied.
        self.assertIsNotNone(_action_with(self._log(), "System Write"))

    def test_date_and_actor_filters_compose(self) -> None:
        self._rename("Ada One", at=self.T1, user=self.user)
        self._rename("Grace One", at=self.T2, user=self.other_user)
        self._rename("Ada Two", at=self.T3, user=self.user)

        actions = self._log(
            filters=AuditEventFilter(date_from=self.T1, date_to=self.T2, actor_id=ID(str(self.user.pk)))
        )

        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0].field_changes["name"], ["Filter Shelter", "Ada One"])

    def test_date_filter_applies_before_grouping_within_one_action(self) -> None:
        # Two writes under one context (one pgh_context_id) → one action.
        with audit_context(user=self.user):
            self.shelter.name = "Early"
            self.shelter.save()
            self.shelter.name = "Late"
            self.shelter.save()
        events = Shelter.pgh_event_model.objects.filter(  # type: ignore[attr-defined]
            pgh_obj_id=self.shelter.pk, pgh_label="shelter.update"
        )
        backdate_event_rows(events.filter(name="Early"), pgh_created_at=self.T1)
        backdate_event_rows(events.filter(name="Late"), pgh_created_at=self.T2)

        self.assertEqual(len(self._log()[0].events), 2)

        actions = self._log(filters=AuditEventFilter(date_from=self.T2))

        self.assertEqual(len(actions), 1)
        self.assertEqual([event.action for event in actions[0].events], ["shelter.update"])
        # The T1 event is gone from ``events``, but the surviving T2 event's diff
        # was computed against it: an action's before/after may start before the
        # window even though the action itself is in it.
        self.assertEqual(actions[0].field_changes["name"], ["Early", "Late"])

    def test_filters_apply_to_cursor_pages(self) -> None:
        """The cursor walks the filtered aggregate, so a filtered-out action is
        never served and a surviving action is not repeated across pages."""
        self._rename("One", at=self.T1, user=self.user)
        self._rename("By Grace", at=self.T2, user=self.other_user)
        self._rename("Three", at=self.T3, user=self.user)
        self._rename("Four", at=self.T4, user=self.user)

        # The date window excludes T1; the actor filter excludes the T2 action.
        event_filter = AuditEventFilter(date_from=self.T2, actor_id=ID(str(self.user.pk)))

        first = object_audit_log(obj=self.shelter, target_type="SHELTER", limit=1, filters=event_filter)
        self.assertEqual([action.field_changes["name"][1] for action in first.results], ["Four"])
        self.assertTrue(first.has_next_page)
        self.assertIsNotNone(first.end_cursor)

        second = object_audit_log(
            obj=self.shelter, target_type="SHELTER", limit=1, after=first.end_cursor, filters=event_filter
        )
        self.assertEqual([action.field_changes["name"][1] for action in second.results], ["Three"])
        self.assertFalse(second.has_next_page)

        past_end = object_audit_log(
            obj=self.shelter, target_type="SHELTER", limit=1, after=second.end_cursor, filters=event_filter
        )
        self.assertEqual(past_end.results, [])
        self.assertIsNone(past_end.end_cursor)


def _outer_select(sql: str) -> str:
    """The statement after pghistory's aggregate CTE.

    Every union branch in the CTE projects ``pgh_created_at`` and each proxy
    field (``actor_id``), so a substring check against the whole statement
    cannot tell a pushed-down predicate from a projected column. The selector's
    filters compile into the outer SELECT that reads the CTE.
    """
    index = sql.rfind(")\nSELECT")
    assert index > 0, "expected a pghistory CTE followed by the outer SELECT"
    return sql[index:]


class ObjectAuditLogQueryBudgetTestCase(TestCase):
    """Query-count and SQL-pushdown guards (ADR 0004 §20, §10 performance note).

    §20 requires that a representative busy object cost a *bounded* number of
    queries — not one that tracks the object's history — and that label/date/
    actor filters run in SQL rather than as a Python post-filter. §9c measured
    that history size barely moves latency (H1/H2); these tests pin the
    mechanism behind that result, so a refactor cannot quietly reintroduce an
    N+1 or move filtering back into Python.

    Plan *shape* — which index the planner picks, and H4's seq-scan cliff on the
    unanchored aggregate — is deliberately not asserted here: test fixtures are
    far too small for the optimizer's choices to mean anything, so that is
    measured by ``bench_audit_read`` against loaded tables (§9c) rather than
    pinned in the unit suite.
    """

    def setUp(self) -> None:
        self.user = baker.make(User, first_name="Ada", last_name="Lovelace", email="ada@example.com")
        with audit_context(label="seed"):
            self.shelter = Shelter.objects.create(name="Busy Shelter")

    def _rename(self, count: int) -> None:
        """Append *count* shelter updates, each its own context → its own action."""
        for i in range(count):
            with audit_context(user=self.user):
                self.shelter.name = f"Rename {i}"
                self.shelter.save()

    def _log_and_count(self, **kwargs: Any) -> tuple[list[Any], list[dict[str, Any]]]:
        with CaptureQueriesContext(connection) as captured:
            page = object_audit_log(obj=self.shelter, target_type="SHELTER", **kwargs)
        return page.results, list(captured.captured_queries)

    # ── §20 query-count guard ────────────────────────────────────────────────

    def test_query_count_does_not_scale_with_object_history(self) -> None:
        self._rename(10)
        small_actions, small = self._log_and_count()

        self._rename(90)  # 100 events on the same object in total
        large_actions, large = self._log_and_count()

        self.assertTrue(small_actions and large_actions)
        # Paging happens in SQL (the key query carries LIMIT), so the round-trip
        # count is identical at 10 and at 100 events — it does not track history.
        self.assertEqual(len(small), len(large))
        self.assertLessEqual(len(large), 6)

    def test_key_query_pages_in_sql(self) -> None:
        """Pagination must be a LIMIT on the key query, not a slice in Python."""
        self._rename(30)

        _, queries = self._log_and_count(limit=5)

        self.assertTrue(queries)
        self.assertRegex(queries[0]["sql"], r"\bLIMIT\b")

    # ── §10 filter pushdown ──────────────────────────────────────────────────

    def test_filters_are_pushed_to_sql_and_short_circuit(self) -> None:
        """Filters are predicates on the outer SELECT, not a Python post-filter (§10, §21)."""
        self._rename(5)

        future = datetime.now(timezone.utc) + timedelta(days=1)
        actions, queries = self._log_and_count(
            filters=AuditEventFilter(date_from=future, actor_id=ID(str(self.user.pk)))
        )

        # Nothing survives the window, so the selector must short-circuit after
        # the key query — proof the predicate ran in SQL, since a Python-side
        # filter would have had to fetch the rows before dropping them.
        self.assertEqual(actions, [])
        self.assertEqual(len(queries), 1)

        # Assert on the outer SELECT: the CTE itself always projects both
        # columns, so a substring check on the whole statement is vacuous.
        outer = _outer_select(queries[0]["sql"])
        self.assertRegex(outer, r'pgh_created_at"?\s*>=')
        self.assertRegex(outer, r'actor_id"?\s*=')


class ObjectAuditActorsQueryBudgetTestCase(TestCase):
    """The actor list is a single aggregate query with the seed filter in SQL (§20)."""

    def setUp(self) -> None:
        self.user = baker.make(User, first_name="Ada", last_name="Lovelace", email="ada@example.com")
        with audit_context(label="seed"):
            self.shelter = Shelter.objects.create(name="S")
        for name in ("First", "Second"):
            with audit_context(user=self.user):
                self.shelter.name = name
                self.shelter.save()

    def test_actors_is_one_aggregate_query_with_the_seed_filter_in_sql(self) -> None:
        with CaptureQueriesContext(connection) as captured:
            actors = object_audit_actors(obj=self.shelter, target_type="SHELTER")

        self.assertEqual([actor.label for actor in actors], ["Ada Lovelace"])
        self.assertEqual(len(captured.captured_queries), 1)

        outer = _outer_select(captured.captured_queries[0]["sql"])
        # Counting and the label tie-break happen in SQL, not by fetching rows.
        self.assertIn("COUNT(*)", outer)
        self.assertIn("MAX(", outer)
        self.assertIn("GROUP BY", outer)
        # The seed exclusion is a predicate in the outer WHERE (§10/§11). Scope the
        # check to the WHERE so the projected ``label`` column cannot satisfy it,
        # and compare columns rather than the literal so parameterization changes
        # cannot break the assertion.
        where = outer[outer.index("WHERE") :]
        self.assertIn('"label"', where)


class ObjectAuditLogScheduleNettingTestCase(TestCase):
    """Full-replacement schedule saves are netted to one UPDATE per slot (§13).

    ``shelter_update`` replaces the schedule set wholesale (delete all, then
    bulk-create), so a single time edit emits a ``.remove`` and an ``.add`` of
    the same slot. The selector pairs them back up instead of rendering a
    deletion and a creation the user never made.
    """

    def setUp(self) -> None:
        self.user = baker.make(User, first_name="Ada", last_name="Lovelace", email="ada@example.com")
        with audit_context(label="seed"):
            self.shelter = Shelter.objects.create(name="Scheduled Shelter")
            Schedule.objects.create(
                shelter=self.shelter,
                day=DayOfWeekChoices.MONDAY,
                start_time=time(9, 0),
                end_time=time(17, 0),
            )

    def _replace_schedules(self, *, start: time, end: time) -> None:
        """The same delete-then-create shape ``shelter_update`` uses."""
        with audit_context(user=self.user):
            self.shelter.schedules.all().delete()
            Schedule.objects.create(
                shelter=self.shelter,
                day=DayOfWeekChoices.MONDAY,
                start_time=start,
                end_time=end,
            )

    def test_time_edit_is_one_update_event_not_a_remove_plus_add(self) -> None:
        self._replace_schedules(start=time(10, 0), end=time(18, 0))

        actions = audit_log(obj=self.shelter, target_type="SHELTER")

        self.assertEqual(len(actions), 1)
        self.assertEqual([event.action for event in actions[0].events], ["shelter.schedule.update"])
        self.assertEqual([event.kind for event in actions[0].events], ["UPDATE"])

        changes = actions[0].events[0].field_changes or {}
        self.assertEqual(changes["start time"], ["09:00:00", "10:00:00"])
        self.assertEqual(changes["end time"], ["17:00:00", "18:00:00"])
        # ``day``/``schedule type`` travel in ``context``; they are not changes.
        self.assertFalse(
            any(key.endswith(" day") or key.endswith(" schedule type") for key in actions[0].field_changes)
        )

    def test_netting_does_not_pair_across_objects(self) -> None:
        """One context saving two shelters must net each object's rows separately."""
        with audit_context(label="seed"):
            other = Shelter.objects.create(name="Other Scheduled Shelter")
            Schedule.objects.create(
                shelter=other,
                day=DayOfWeekChoices.MONDAY,
                start_time=time(9, 0),
                end_time=time(17, 0),
            )

        with audit_context(user=self.user):
            self.shelter.schedules.all().delete()
            other.schedules.all().delete()
            Schedule.objects.create(
                shelter=self.shelter,
                day=DayOfWeekChoices.MONDAY,
                start_time=time(10, 0),
                end_time=time(18, 0),
            )
            Schedule.objects.create(
                shelter=other,
                day=DayOfWeekChoices.MONDAY,
                start_time=time(10, 0),
                end_time=time(18, 0),
            )

        for obj in (self.shelter, other):
            actions = audit_log(obj=obj, target_type="SHELTER")
            schedule_events = [
                event for action in actions for event in action.events if event.action.startswith("shelter.schedule")
            ]

            self.assertEqual([event.action for event in schedule_events], ["shelter.schedule.update"])
            self.assertTrue(all(event.target_id == str(obj.pk) for event in schedule_events))

    def test_netted_change_keys_match_the_add_remove_keys(self) -> None:
        """Netted updates render §13 display keys, like every other schedule event.

        A single save can net one slot and add another; both must key
        ``field_changes`` identically (``start time``, not ``start_time``) or the
        action-level rollup carries two shapes for one field.
        """
        with audit_context(user=self.user):
            self.shelter.schedules.all().delete()
            Schedule.objects.create(
                shelter=self.shelter,
                day=DayOfWeekChoices.MONDAY,
                start_time=time(10, 0),
                end_time=time(18, 0),
            )
            Schedule.objects.create(
                shelter=self.shelter,
                day=DayOfWeekChoices.TUESDAY,
                start_time=time(9, 0),
                end_time=time(17, 0),
            )

        actions = audit_log(obj=self.shelter, target_type="SHELTER")
        events = {event.action: event for event in actions[0].events}

        netted = events["shelter.schedule.update"].field_changes or {}
        added = events["shelter.schedule.add"].field_changes or {}
        self.assertEqual(set(netted), {"start time", "end time"})
        self.assertIn("start time", added)
        self.assertNotIn("start_time", netted)
        self.assertNotIn("start_time", added)

        rollup_keys = set(actions[0].field_changes)
        self.assertTrue(any(key.endswith(" start time") for key in rollup_keys))
        self.assertFalse(any(key.endswith("start_time") for key in rollup_keys))
        # Database-generated schedule columns are derived from start/end; they
        # must not appear as changes (or in the rollup) on add/remove either.
        self.assertFalse(any("cycle" in key.lower() or "duration" in key.lower() for key in added))
        self.assertFalse(any("cycle" in key.lower() or "duration" in key.lower() for key in rollup_keys))
        # The rollup holds only real changes: no ``[x, x]`` no-op pair survives.
        for pair in actions[0].field_changes.values():
            self.assertNotEqual(pair[0], pair[1])

    def test_generated_schedule_columns_are_not_rendered(self) -> None:
        """GeneratedField values are derived, so they are not changes or snapshots."""
        with audit_context(user=self.user):
            self.shelter.schedules.all().delete()
            Schedule.objects.create(
                shelter=self.shelter,
                day=DayOfWeekChoices.TUESDAY,
                start_time=time(10, 0),
                end_time=time(18, 0),
            )

        actions = audit_log(obj=self.shelter, target_type="SHELTER", include_snapshot=True)
        added = next(event for event in actions[0].events if event.action == "shelter.schedule.add")

        self.assertFalse(
            any("cycle" in key.lower() or "duration" in key.lower() for key in (added.field_changes or {}))
        )
        self.assertFalse(any("cycle" in key.lower() or "duration" in key.lower() for key in (added.snapshot or {})))

    def test_netted_event_carries_the_slot_context(self) -> None:
        """The slot's unchanged identity travels in ``context``, not as a change."""
        self._replace_schedules(start=time(10, 0), end=time(18, 0))

        actions = audit_log(obj=self.shelter, target_type="SHELTER")
        event = actions[0].events[0]

        self.assertEqual(event.context, {"day": "Monday", "schedule type": "Operating Hours"})
        self.assertEqual(set(event.field_changes or {}), {"start time", "end time"})
        self.assertFalse([pair for pair in actions[0].field_changes.values() if pair[0] == pair[1]])

    def test_netted_and_genuine_events_carry_snapshots(self) -> None:
        """``include_snapshot`` still populates schedule events after netting."""
        with audit_context(user=self.user):
            self.shelter.schedules.all().delete()
            Schedule.objects.create(
                shelter=self.shelter,
                day=DayOfWeekChoices.MONDAY,
                start_time=time(10, 0),
                end_time=time(18, 0),
            )
            Schedule.objects.create(
                shelter=self.shelter,
                day=DayOfWeekChoices.TUESDAY,
                start_time=time(9, 0),
                end_time=time(17, 0),
            )

        actions = audit_log(obj=self.shelter, target_type="SHELTER", include_snapshot=True)
        events = {event.action: event for event in actions[0].events}

        netted = events["shelter.schedule.update"].snapshot or {}
        added = events["shelter.schedule.add"].snapshot or {}

        self.assertTrue(netted, "the netted UPDATE must carry a snapshot")
        self.assertTrue(added, "the genuine INSERT must carry a snapshot")
        # A netted UPDATE snapshots the post-change state; the old row is gone.
        self.assertEqual(netted["start time"], "10:00:00")
        self.assertEqual(added["day"], "Tuesday")

    def test_netted_snapshot_resolves_fk_labels(self) -> None:
        """A netted event's snapshot renders FK ids as labels, like any other event."""
        with audit_context(label="seed"):
            demographic = Demographic.objects.create(name=DemographicChoices.COUPLES)
            self.shelter.schedules.all().delete()
            Schedule.objects.create(
                shelter=self.shelter,
                day=DayOfWeekChoices.MONDAY,
                start_time=time(9, 0),
                end_time=time(17, 0),
                demographic=demographic,
            )
        with audit_context(user=self.user):
            self.shelter.schedules.all().delete()
            Schedule.objects.create(
                shelter=self.shelter,
                day=DayOfWeekChoices.MONDAY,
                start_time=time(10, 0),
                end_time=time(18, 0),
                demographic=demographic,
            )

        actions = audit_log(obj=self.shelter, target_type="SHELTER", include_snapshot=True)
        snapshot = actions[0].events[0].snapshot or {}

        self.assertEqual(snapshot["shelter"], "Scheduled Shelter")
        self.assertEqual(snapshot["demographic"], "couples")

    def test_unchanged_slot_is_not_reported_as_a_change(self) -> None:
        self._replace_schedules(start=time(9, 0), end=time(17, 0))

        actions = audit_log(obj=self.shelter, target_type="SHELTER")

        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0].events, [])
        self.assertEqual(actions[0].field_changes, {})

    def test_multiple_residual_slots_render_as_delete_and_insert(self) -> None:
        """No stable provenance across a replacement: only a 1:1 residual nets."""
        with audit_context(label="seed"):
            self.shelter.schedules.all().delete()
            for start, end in ((time(9, 0), time(12, 0)), (time(10, 0), time(11, 0))):
                Schedule.objects.create(
                    shelter=self.shelter,
                    day=DayOfWeekChoices.MONDAY,
                    start_time=start,
                    end_time=end,
                )
        # Two windows edited in one save; a positional zip used to pair them
        # across (09:00→09:30, 10:00→10:30) and invent that story.
        with audit_context(user=self.user):
            self.shelter.schedules.all().delete()
            for start, end in ((time(10, 30), time(12, 0)), (time(9, 30), time(11, 0))):
                Schedule.objects.create(
                    shelter=self.shelter,
                    day=DayOfWeekChoices.MONDAY,
                    start_time=start,
                    end_time=end,
                )

        actions = audit_log(obj=self.shelter, target_type="SHELTER")

        self.assertEqual(len(actions), 1)
        self.assertEqual(
            sorted(event.kind for event in actions[0].events),
            ["DELETE", "DELETE", "INSERT", "INSERT"],
        )
        self.assertTrue(all(event.context is None for event in actions[0].events))

    def test_hidden_fields_are_redacted_from_genuine_events(self) -> None:
        """A withheld raw attname never reaches a schedule add/remove field map (§18)."""
        with audit_context(user=self.user):
            Schedule.objects.create(
                shelter=self.shelter,
                day=DayOfWeekChoices.TUESDAY,
                start_time=time(9, 0),
                end_time=time(17, 0),
            )

        actions = audit_log(
            obj=self.shelter,
            target_type="SHELTER",
            hidden_fields={"shelters.Schedule": ("day",)},
        )
        event = next(event for event in actions[0].events if event.action == "shelter.schedule.add")

        changes = event.field_changes or {}
        self.assertNotIn("day", changes)
        self.assertIn("start time", changes)

    def test_hidden_fields_are_redacted_from_netted_changes_and_context(self) -> None:
        """The synthesized diff and context honour the same withheld set (§18)."""
        self._replace_schedules(start=time(10, 0), end=time(18, 0))

        actions = audit_log(
            obj=self.shelter,
            target_type="SHELTER",
            hidden_fields={"shelters.Schedule": ("start_time", "day")},
        )
        event = actions[0].events[0]

        self.assertEqual(set(event.field_changes or {}), {"end time"})
        self.assertEqual(event.context, {"schedule type": "Operating Hours"})

    def test_deleted_slots_keep_delete_events(self) -> None:
        """Removes with no matching add are genuine deletions, not a netted update."""
        with audit_context(user=self.user):
            self.shelter.schedules.all().delete()

        actions = audit_log(obj=self.shelter, target_type="SHELTER")

        self.assertEqual(len(actions), 1)
        self.assertEqual([event.action for event in actions[0].events], ["shelter.schedule.remove"])
        self.assertEqual([event.kind for event in actions[0].events], ["DELETE"])
        self.assertIsNone(actions[0].events[0].context)
        self.assertEqual((actions[0].events[0].field_changes or {})["day"], ["Monday", None])

    def test_every_day_slot_keeps_the_day_key_out_of_the_netted_change(self) -> None:
        """``day=None`` means every day: absent from the change, null in context."""
        with audit_context(label="seed"):
            self.shelter.schedules.all().delete()
            Schedule.objects.create(
                shelter=self.shelter,
                day=None,
                start_time=time(9, 0),
                end_time=time(17, 0),
            )
        with audit_context(user=self.user):
            self.shelter.schedules.all().delete()
            Schedule.objects.create(
                shelter=self.shelter,
                day=None,
                start_time=time(10, 0),
                end_time=time(18, 0),
            )

        actions = audit_log(obj=self.shelter, target_type="SHELTER")

        self.assertEqual(len(actions), 1)
        event = actions[0].events[0]
        changes = event.field_changes or {}
        self.assertNotIn("day", changes)
        self.assertEqual(changes["start time"], ["09:00:00", "10:00:00"])
        self.assertEqual(changes["end time"], ["17:00:00", "18:00:00"])
        # The UI renders "Every day" from the null; the copy stays in the UI.
        self.assertIsNone((event.context or {})["day"])

    def test_schedule_netting_respects_the_event_cap(self) -> None:
        """Netting shares the action's event budget instead of emitting past it."""
        with audit_context(label="seed"):
            self.shelter.schedules.all().delete()
            for start in (time(9, 0), time(10, 0), time(11, 0)):
                Schedule.objects.create(
                    shelter=self.shelter,
                    day=DayOfWeekChoices.MONDAY,
                    start_time=start,
                    end_time=time(17, 0),
                )
        with audit_context(user=self.user):
            self.shelter.schedules.all().delete()
            for start in (time(9, 30), time(10, 30), time(11, 30)):
                Schedule.objects.create(
                    shelter=self.shelter,
                    day=DayOfWeekChoices.MONDAY,
                    start_time=start,
                    end_time=time(17, 0),
                )

        with mock.patch("audit.selectors.MAX_EVENTS_PER_ACTION", 2):
            actions = audit_log(obj=self.shelter, target_type="SHELTER")

        self.assertEqual(len(actions), 1)
        self.assertTrue(actions[0].truncated)
        self.assertEqual(len(actions[0].events), 2)


class ObjectAuditLogScheduleServiceTestCase(TestCase):
    """The real ``shelter_update`` path fans days out one row per day (§13)."""

    def setUp(self) -> None:
        self.org = organization_recipe.make(preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,))
        self.user = baker.make(User, first_name="Ada", last_name="Lovelace", email="ada@example.com")
        self.org.users.add(self.user)
        OrgRoleManager(self.org).add_roles(self.user, SHELTER_OPERATOR)

        with audit_context(label="seed"):
            self.shelter = Shelter.objects.create(name="Scheduled Shelter", organization=self.org)
            for day in (DayOfWeekChoices.MONDAY, DayOfWeekChoices.TUESDAY):
                Schedule.objects.create(
                    shelter=self.shelter,
                    day=day,
                    start_time=time(9, 0),
                    end_time=time(17, 0),
                )

    def test_multi_day_save_nets_one_update_per_day(self) -> None:
        with audit_context(user=self.user):
            shelter_update(
                user=self.user,
                data={
                    "id": self.shelter.pk,
                    "schedules": [
                        {
                            "schedule_type": ScheduleTypeChoices.OPERATING,
                            "days": [DayOfWeekChoices.MONDAY, DayOfWeekChoices.TUESDAY],
                            "start_time": time(10, 0),
                            "end_time": time(18, 0),
                        }
                    ],
                },
            )

        actions = audit_log(obj=self.shelter, target_type="SHELTER")

        self.assertEqual(len(actions), 1)  # the whole service call is one action
        schedule_events = [event for event in actions[0].events if event.action.startswith("shelter.schedule")]
        self.assertEqual([event.action for event in schedule_events], ["shelter.schedule.update"] * 2)
        self.assertEqual(
            sorted((event.context or {})["day"] for event in schedule_events),
            ["Monday", "Tuesday"],
        )
        for event in schedule_events:
            changes = event.field_changes or {}
            self.assertEqual(changes["start time"], ["09:00:00", "10:00:00"])
            self.assertEqual(changes["end time"], ["17:00:00", "18:00:00"])


class ObjectAuditActorsSelectorTestCase(TestCase):
    """``object_audit_actors`` is scoped to the object's own history, not org members."""

    def setUp(self) -> None:
        cache.clear()
        self.user = baker.make(User, first_name="Ada", last_name="Lovelace", email="ada@example.com")
        self.other_user = baker.make(User, first_name="Grace", last_name="Hopper", email="grace@example.com")
        self.bed_user = baker.make(User, first_name="Carol", last_name="Shaw", email="carol@example.com")

        with audit_context(label="seed"):
            self.shelter = Shelter.objects.create(name="Actors Shelter")
            self.bed = Bed.objects.create(shelter=self.shelter, name="Bed A")

        for name in ("First", "Second"):
            with audit_context(user=self.user):
                self.shelter.name = name
                self.shelter.save()
        with audit_context(user=self.other_user):
            self.shelter.name = "Third"
            self.shelter.save()
        with audit_context(label="import"):
            self.shelter.name = "Imported"
            self.shelter.save()

    def test_lists_distinct_actors_with_one_system_entry(self) -> None:
        actors = object_audit_actors(obj=self.shelter, target_type="SHELTER")
        by_label = {actor.label: actor for actor in actors}

        self.assertEqual(set(by_label), {"Ada Lovelace", "Grace Hopper", "System"})
        self.assertEqual(by_label["Ada Lovelace"].id, str(self.user.pk))
        self.assertFalse(by_label["Ada Lovelace"].is_system)
        self.assertIsNone(by_label["System"].id)
        self.assertTrue(by_label["System"].is_system)

    def test_search_filters_user_labels_and_system(self) -> None:
        self.assertEqual(
            [actor.label for actor in object_audit_actors(obj=self.shelter, target_type="SHELTER", search="ada")],
            ["Ada Lovelace"],
        )
        self.assertEqual(
            [actor.label for actor in object_audit_actors(obj=self.shelter, target_type="SHELTER", search="sys")],
            ["System"],
        )
        self.assertEqual(object_audit_actors(obj=self.shelter, target_type="SHELTER", search="zz"), [])
        # The search has the same two-character floor as the UI.
        self.assertEqual(object_audit_actors(obj=self.shelter, target_type="SHELTER", search="a"), [])

    def test_system_only_filter_returns_only_system_events(self) -> None:
        actions = audit_log(
            obj=self.shelter,
            target_type="SHELTER",
            filters=AuditEventFilter(system_only=True),
        )

        self.assertEqual([action.actor for action in actions], ["system (import)"])
        self.assertEqual(actions[0].field_changes["name"], ["Third", "Imported"])

    def test_system_only_and_actor_id_compose(self) -> None:
        with audit_context(user=self.user, label="import"):
            self.shelter.name = "Imported by Ada"
            self.shelter.save()
        with audit_context(user=self.other_user, label="import"):
            self.shelter.name = "Imported by Grace"
            self.shelter.save()

        actions = audit_log(
            obj=self.shelter,
            target_type="SHELTER",
            filters=AuditEventFilter(actor_id=ID(str(self.user.pk)), system_only=True),
        )

        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0].field_changes["name"], ["Imported", "Imported by Ada"])

    def test_hidden_summary_actor_is_omitted(self) -> None:
        with audit_context(user=self.bed_user):
            self.bed.name = "Bed B"
            self.bed.save()

        labels = {actor.label for actor in object_audit_actors(obj=self.shelter, target_type="SHELTER")}
        self.assertIn("Carol Shaw", labels)

        hidden = {
            actor.label
            for actor in object_audit_actors(
                obj=self.shelter,
                target_type="SHELTER",
                hidden_summary_models={Bed._meta.label},
            )
        }
        self.assertNotIn("Carol Shaw", hidden)

    def test_limit_and_validation(self) -> None:
        actors = object_audit_actors(obj=self.shelter, target_type="SHELTER", limit=1)

        # Ada wrote twice, Grace and System once each.
        self.assertEqual([actor.label for actor in actors], ["Ada Lovelace"])
        with self.assertRaises(ValueError):
            object_audit_actors(obj=self.shelter, target_type="SHELTER", limit=0)
        with self.assertRaises(ValueError):
            object_audit_actors(obj=self.shelter, target_type="SHELTER", limit=MAX_ACTOR_LIMIT + 1)

    def test_search_can_reach_an_actor_outside_the_limit(self) -> None:
        # Ada has the most events, so a naive top-N-then-filter would miss Grace.
        self.assertEqual(
            [
                actor.label
                for actor in object_audit_actors(
                    obj=self.shelter,
                    target_type="SHELTER",
                    search="grace",
                    limit=1,
                )
            ],
            ["Grace Hopper"],
        )

    def test_actor_list_is_cached_per_object(self) -> None:
        cache.clear()
        with CaptureQueriesContext(connection) as first:
            object_audit_actors(obj=self.shelter, target_type="SHELTER")
        with CaptureQueriesContext(connection) as second:
            object_audit_actors(obj=self.shelter, target_type="SHELTER")

        self.assertGreater(len(first), 0)
        self.assertEqual(len(second), 0)

    def test_most_frequent_frozen_name_wins(self) -> None:
        """A rename mid-history must not surface the rarest label for that id."""
        renamed = baker.make(User, first_name="Rosa", last_name="Parks", email="rosa@example.com")
        for name in ("Rosa Parks", "Rosa Parks"):
            with audit_context(user=renamed):
                self.shelter.name = name
                self.shelter.save()
        renamed.last_name = "P."
        renamed.save()
        with audit_context(user=renamed):
            self.shelter.name = "Renamed"
            self.shelter.save()

        by_id = {actor.id: actor for actor in object_audit_actors(obj=self.shelter, target_type="SHELTER")}

        self.assertEqual(by_id[str(renamed.pk)].label, "Rosa Parks")

    def test_equally_frequent_names_break_the_tie_by_recency(self) -> None:
        """One event under each name picks the most recently written one."""
        # The older name is the one that would win an alphabetical tie-break, so
        # this asserts recency rather than merely asserting determinism.
        renamed = baker.make(User, first_name="Rosa", last_name="P.", email="rosa@example.com")

        with audit_context(user=renamed):
            self.shelter.name = "Older"
            self.shelter.save()
        renamed.last_name = "Parks"
        renamed.save()
        with audit_context(user=renamed):
            self.shelter.name = "Newer"
            self.shelter.save()

        # Every event in one test transaction shares NOW(), so pin the two rows
        # apart: the tie-break is a real chronological comparison, not a name sort.
        events = Shelter.pgh_event_model.objects.filter(  # type: ignore[attr-defined]
            pgh_obj_id=self.shelter.pk, pgh_label="shelter.update"
        )
        backdate_event_rows(
            events.filter(name="Older"), pgh_created_at=datetime(2026, 1, 1, 12, 0, tzinfo=timezone.utc)
        )
        backdate_event_rows(
            events.filter(name="Newer"), pgh_created_at=datetime(2026, 1, 2, 12, 0, tzinfo=timezone.utc)
        )

        by_id = {actor.id: actor for actor in object_audit_actors(obj=self.shelter, target_type="SHELTER")}

        self.assertEqual(by_id[str(renamed.pk)].label, "Rosa Parks")

    def test_schedule_saves_rank_by_written_rows_not_rendered_events(self) -> None:
        """Ordering counts raw rows: a full-replacement save writes two per slot (§13)."""
        scheduler = baker.make(User, first_name="Sched", last_name="Uler", email="sched@example.com")
        editor = baker.make(User, first_name="Edit", last_name="Or", email="edit@example.com")

        with audit_context(label="seed"):
            self.shelter.schedules.all().delete()
            for hour in (9, 10, 11):
                Schedule.objects.create(
                    shelter=self.shelter,
                    day=DayOfWeekChoices.MONDAY,
                    start_time=time(hour, 0),
                    end_time=time(hour, 30),
                )

        # One save that changes a single slot renders one netted event but writes
        # six rows: three removes plus three adds.
        with audit_context(user=scheduler):
            self.shelter.schedules.all().delete()
            for hour in (9, 10, 11):
                start = time(9, 15) if hour == 9 else time(hour, 0)
                Schedule.objects.create(
                    shelter=self.shelter,
                    day=DayOfWeekChoices.MONDAY,
                    start_time=start,
                    end_time=time(hour, 30),
                )
        for index in range(4):
            with audit_context(user=editor):
                self.shelter.name = f"edit-{index}"
                self.shelter.save()

        rendered = [
            len(action.events)
            for action in audit_log(obj=self.shelter, target_type="SHELTER")
            if action.actor == "Sched Uler"
        ]
        labels = [actor.label for actor in object_audit_actors(obj=self.shelter, target_type="SHELTER")]

        self.assertEqual(rendered, [1])  # netting collapsed six writes into one event
        # Counted as rendered events the editor (4) would outrank the scheduler
        # (1); counted as written rows the scheduler (6) ranks first. The count is
        # written rows, so this pins the documented metric.
        self.assertLess(labels.index("Sched Uler"), labels.index("Edit Or"))

    def test_room_and_bed_targets_scope_the_actor_list(self) -> None:
        """The list is anchored on the target, not on its shelter or its parent room."""
        with audit_context(label="seed"):
            room = Room.objects.create(shelter=self.shelter, name="Room A")
            bed = Bed.objects.create(shelter=self.shelter, room=room, name="Bed A")
        with audit_context(user=self.user):
            bed.name = "Bed B"
            bed.save()
        with audit_context(user=self.other_user):
            room.name = "Room B"
            room.save()

        self.assertEqual(
            [actor.label for actor in object_audit_actors(obj=bed, target_type="BED")],
            ["Ada Lovelace"],
        )
        # The bed lives in the room, so its event references the room: the ROOM
        # log's BedEvent exclusion (§32) must keep the bed's editor out of the list.
        self.assertEqual(
            [actor.label for actor in object_audit_actors(obj=room, target_type="ROOM")],
            ["Grace Hopper"],
        )

    def test_idless_named_actor_is_not_selectable(self) -> None:
        with audit_context(user_name="Ghost", user_email="ghost@example.com"):
            self.shelter.name = "Ghosted"
            self.shelter.save()

        labels = {actor.label for actor in object_audit_actors(obj=self.shelter, target_type="SHELTER")}

        self.assertNotIn("Ghost", labels)
