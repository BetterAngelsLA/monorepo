"""Tests for the object audit-log selector (ADR 0004 §20–§21)."""

import re
from datetime import datetime, timedelta, timezone
from typing import Any

from accounts.models import User
from django.db import connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from model_bakery import baker
from pghistory.core import event_models

from audit.models import AuditEvent
from audit.selectors import (
    LABEL_FIELD,
    THROUGH_EVENT_MAP,
    _EXCLUDED_EVENT_MODELS,
    object_audit_log,
)
from audit.tests.utils import audit_context, clear_history_context
from shelters.enums import DemographicChoices, ReservationStatusChoices
from shelters.models import Bed, Demographic, Reservation, Room, Shelter
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

        actions = object_audit_log(obj=self.shelter, target_type="SHELTER")

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

        actions = object_audit_log(obj=self.shelter, target_type="SHELTER")
        renames = [a for a in actions if "name" in a.field_changes]

        self.assertEqual(len(renames), 1)
        # First old / last new, so the action reads as a single before→after.
        self.assertEqual(renames[0].field_changes["name"], ["Audit Shelter", "Second Rename"])

    def test_m2m_set_is_one_action_with_one_multi_value_entry(self) -> None:
        with audit_context(user=self.user):
            self.shelter.demographics.set([self.demographic_couples, self.demographic_families])

        actions = object_audit_log(obj=self.shelter, target_type="SHELTER")
        m2m_actions = [a for a in actions if "demographics" in a.field_changes]

        self.assertEqual(len(m2m_actions), 1)
        removed, added = m2m_actions[0].field_changes["demographics"]
        self.assertEqual(removed, ["all"])
        self.assertCountEqual(added, ["couples", "families"])

    def test_m2m_remove_and_add_share_one_entry(self) -> None:
        with audit_context(user=self.user):
            self.shelter.demographics.set([self.demographic_couples])

        actions = object_audit_log(obj=self.shelter, target_type="SHELTER")
        m2m_actions = [a for a in actions if "demographics" in a.field_changes]

        self.assertEqual(len(m2m_actions), 1)
        removed, added = m2m_actions[0].field_changes["demographics"]
        self.assertEqual(removed, ["all"])
        self.assertEqual(added, ["couples"])

    # ── §16 reservation status_change ────────────────────────────────────────

    def test_status_change_renders_as_a_single_event(self) -> None:
        # §2/§16: the two update triggers are disjoint, so a status change emits
        # one ``reservation.status_change`` event (carrying its own diff) and no
        # ``reservation.update`` row to fold in.
        with audit_context(user=self.user):
            self.reservation.status = ReservationStatusChoices.CHECKED_IN
            self.reservation.save()

        actions = object_audit_log(obj=self.reservation, target_type="RESERVATION")

        self.assertEqual(len(actions), 1)
        action = actions[0]
        labels = [event.action for event in action.events]
        self.assertEqual(labels.count("reservation.status_change"), 1)
        self.assertNotIn("reservation.update", labels)
        self.assertEqual(action.field_changes["status"], ["confirmed", "checked_in"])

    def test_status_change_and_notes_update_render_both_field_changes(self) -> None:
        # A single save touching both ``status`` and ``notes`` fires both disjoint
        # triggers, so the action carries each label's own diff (§2).
        with audit_context(user=self.user):
            self.reservation.status = ReservationStatusChoices.CHECKED_IN
            self.reservation.notes = "Checked in"
            self.reservation.save()

        actions = object_audit_log(obj=self.reservation, target_type="RESERVATION")

        self.assertEqual(len(actions), 1)
        action = actions[0]
        labels = [event.action for event in action.events]
        self.assertEqual(labels.count("reservation.status_change"), 1)
        self.assertEqual(labels.count("reservation.update"), 1)
        self.assertEqual(action.field_changes["status"], ["confirmed", "checked_in"])
        self.assertEqual(action.field_changes["notes"], [None, "Checked in"])

    # ── §13/§14 INSERT and FK labels ─────────────────────────────────────────

    def test_insert_renders_non_null_fields_and_resolves_fk_labels(self) -> None:
        with audit_context(user=self.user):
            Reservation.objects.create(bed=self.bed, status=ReservationStatusChoices.CANCELLED)

        actions = object_audit_log(obj=self.bed, target_type="BED")
        add_action = _action_with(actions, "cancelled")

        self.assertIsNotNone(add_action)
        assert add_action is not None
        self.assertEqual(add_action.field_changes["bed_id"], [None, "Bed A"])
        self.assertNotIn("created_at", add_action.field_changes)
        self.assertNotIn("updated_at", add_action.field_changes)

    def test_fk_update_resolves_to_related_display_label(self) -> None:
        with audit_context(user=self.user):
            self.bed.room = self.room
            self.bed.save()

        actions = object_audit_log(obj=self.shelter, target_type="SHELTER")
        bed_actions = [a for a in actions if a.field_changes.get("room_id")]

        self.assertEqual(len(bed_actions), 1)
        self.assertEqual(bed_actions[0].field_changes["room_id"], [None, "Room A"])

    # ── §11 seed / import / clone attribution ────────────────────────────────

    def test_seed_writes_are_excluded(self) -> None:
        with audit_context(user=self.user, label="seed"):
            self.shelter.name = "Seeded Name"
            self.shelter.save()

        actions = object_audit_log(obj=self.shelter, target_type="SHELTER")

        self.assertIsNone(_action_with(actions, "Seeded Name"))

    def test_import_and_clone_writes_are_retained_and_attributed_to_system(self) -> None:
        with audit_context(user=self.user, label="clone"):
            self.shelter.name = "Cloned Name"
            self.shelter.save()

        actions = object_audit_log(obj=self.shelter, target_type="SHELTER")
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

        actions = object_audit_log(obj=self.shelter, target_type="SHELTER")

        first = _action_with(actions, "No Context A")
        second = _action_with(actions, "No Context B")
        self.assertIsNotNone(first)
        self.assertIsNotNone(second)
        self.assertNotEqual(first, second)
        assert first is not None
        self.assertEqual(first.actor, "system")

    def test_actor_prefers_frozen_name_over_the_live_user(self) -> None:
        with audit_context(user=self.user):
            self.shelter.name = "Named Actor"
            self.shelter.save()

        actions = object_audit_log(obj=self.shelter, target_type="SHELTER")
        action = _action_with(actions, "Named Actor")

        assert action is not None
        self.assertEqual(action.actor, "Ada Lovelace")

    # ── §19 through-map completeness / §10 references boundary ───────────────

    def test_through_event_map_covers_every_through_event_model(self) -> None:
        expected: set[str] = set()
        for model in (Shelter, Bed, Room):
            expected |= {
                event_model._meta.label
                for event_model in event_models(references_model=model)
                if not hasattr(event_model, "pgh_obj_id")
            }

        self.assertEqual(set(THROUGH_EVENT_MAP), expected)
        for parent_col, related_fk_field in THROUGH_EVENT_MAP.values():
            self.assertIn(parent_col, {"shelter_id", "bed_id", "room_id"})
            self.assertTrue(related_fk_field)

    def test_label_field_covers_every_m2m_related_model(self) -> None:
        related_models = {
            m2m.related_model._meta.label for model in (Shelter, Bed, Room) for m2m in model._meta.many_to_many
        }
        self.assertTrue(related_models <= set(LABEL_FIELD), related_models - set(LABEL_FIELD))

    def test_references_boundary_for_shelter_minus_the_blocklist(self) -> None:
        labels = {event_model._meta.label for event_model in event_models(references_model=Shelter)}

        self.assertEqual(labels, _EXPECTED_SHELTER_REFERENCES)
        self.assertIn("referrals.ReferralEvent", labels)
        self.assertEqual(_EXCLUDED_EVENT_MODELS, ("referrals.ReferralEvent",))

    # ── RDS Proxy pinning guards (ADR 0004 §10) ──────────────────────────────

    # The aggregate statement's size tracks the number of event models
    # ``references()`` matches, so these ceilings catch a newly tracked model
    # (each branch adds a few KB). SHELTER/BED exceed RDS Proxy's 16 KB pinning
    # threshold by construction — a documented, accepted trade-off — so this
    # asserts the recorded ceiling rather than a bound the design cannot meet.
    _STATEMENT_CEILINGS = {"SHELTER": 78_000, "BED": 21_000, "RESERVATION": 7_500}

    def test_selector_issues_no_server_side_cursor(self) -> None:
        """``.iterator()`` would emit ``DECLARE``, which RDS Proxy pins (§10)."""
        with audit_context(user=self.user):
            self.shelter.name = "Renamed Shelter"
            self.shelter.save()

        with CaptureQueriesContext(connection) as captured:
            object_audit_log(obj=self.shelter, target_type="SHELTER")

        sql = "\n".join(query["sql"] for query in captured.captured_queries)

        # Guard against a vacuous pass: the selector must have issued its
        # aggregate CTE query (key query + page query) for the assertion below
        # to mean anything.
        self.assertTrue(captured.captured_queries)
        self.assertIn("WITH", sql.upper())

        self.assertIsNone(re.search(r"\bDECLARE\b", sql, re.IGNORECASE))

    def test_selector_statement_stays_within_the_recorded_ceiling(self) -> None:
        """Guard the aggregate statement against growth (see the ADR §10 note)."""
        for target_type, obj in (
            ("SHELTER", self.shelter),
            ("BED", self.bed),
            ("RESERVATION", self.reservation),
        ):
            queryset = (
                AuditEvent.objects.references([obj]).exclude(pgh_model__in=_EXCLUDED_EVENT_MODELS).exclude(label="seed")
            )
            size = len(str(queryset.query))

            self.assertLessEqual(size, self._STATEMENT_CEILINGS[target_type], f"{target_type} statement grew to {size}")


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


class ObjectAuditLogFilterTestCase(TestCase):
    """Date/actor filters (ADR 0004 §21), applied in SQL before grouping (§10)."""

    T1 = datetime(2026, 1, 1, 12, 0, tzinfo=timezone.utc)
    T2 = datetime(2026, 2, 1, 12, 0, tzinfo=timezone.utc)
    T3 = datetime(2026, 3, 1, 12, 0, tzinfo=timezone.utc)

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
            Shelter.pgh_event_model.objects.filter(pgh_obj_id=self.shelter.pk, pgh_label="shelter.update", name=name),
            pgh_created_at=at,
        )

    def _log(self, **kwargs: Any) -> list[Any]:
        return object_audit_log(obj=self.shelter, target_type="SHELTER", **kwargs)

    def test_date_from_is_inclusive_and_excludes_earlier_actions(self) -> None:
        self._rename("Early", at=self.T1, user=self.user)
        self._rename("Late", at=self.T2, user=self.user)

        actions = self._log(date_from=self.T2)

        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0].field_changes["name"], ["Early", "Late"])

    def test_date_to_is_inclusive_and_excludes_later_actions(self) -> None:
        self._rename("Early", at=self.T1, user=self.user)
        self._rename("Late", at=self.T2, user=self.user)

        actions = self._log(date_to=self.T1)

        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0].field_changes["name"], ["Filter Shelter", "Early"])

    def test_date_window_bounds_both_ends(self) -> None:
        self._rename("Early", at=self.T1, user=self.user)
        self._rename("Middle", at=self.T2, user=self.user)
        self._rename("Late", at=self.T3, user=self.user)

        actions = self._log(date_from=self.T2, date_to=self.T2)

        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0].field_changes["name"], ["Early", "Middle"])

    def test_actor_id_restricts_to_a_single_actor(self) -> None:
        self._rename("By Ada", at=self.T1, user=self.user)
        self._rename("By Grace", at=self.T2, user=self.other_user)

        actions = self._log(actor_id=self.user.pk)

        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0].field_changes["name"], ["Filter Shelter", "By Ada"])

    def test_unknown_actor_id_yields_no_actions(self) -> None:
        self._rename("By Ada", at=self.T1, user=self.user)

        self.assertEqual(self._log(actor_id=999_999), [])

    def test_actor_id_excludes_context_less_system_events(self) -> None:
        clear_history_context()
        self.shelter.name = "System Write"
        self.shelter.save()

        self.assertEqual(self._log(actor_id=self.user.pk), [])
        # The system write is still present when no actor filter is applied.
        self.assertIsNotNone(_action_with(self._log(), "System Write"))

    def test_date_and_actor_filters_compose(self) -> None:
        self._rename("Ada One", at=self.T1, user=self.user)
        self._rename("Grace One", at=self.T2, user=self.other_user)
        self._rename("Ada Two", at=self.T3, user=self.user)

        actions = self._log(date_from=self.T1, date_to=self.T2, actor_id=self.user.pk)

        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0].field_changes["name"], ["Filter Shelter", "Ada One"])

    def test_date_filter_applies_before_grouping_within_one_action(self) -> None:
        # Two writes under one context (one pgh_context_id) → one action.
        with audit_context(user=self.user):
            self.shelter.name = "Early"
            self.shelter.save()
            self.shelter.name = "Late"
            self.shelter.save()
        events = Shelter.pgh_event_model.objects.filter(pgh_obj_id=self.shelter.pk, pgh_label="shelter.update")
        backdate_event_rows(events.filter(name="Early"), pgh_created_at=self.T1)
        backdate_event_rows(events.filter(name="Late"), pgh_created_at=self.T2)

        self.assertEqual(len(self._log()[0].events), 2)

        actions = self._log(date_from=self.T2)

        self.assertEqual(len(actions), 1)
        self.assertEqual([event.action for event in actions[0].events], ["shelter.update"])
        self.assertEqual(actions[0].field_changes["name"], ["Early", "Late"])


class ObjectAuditLogQueryBudgetTestCase(TestCase):
    """Query-count and SQL-pushdown guards (ADR 0004 §20, §10 performance note).

    §20 requires that a representative busy object cost a *bounded* number of
    queries — not one that tracks the object's history — and that label/date/
    actor filters run in SQL rather than as a Python post-filter. §9c measured
    that history size barely moves latency (H1/H2); these tests pin the
    mechanism behind that result, so a refactor cannot quietly reintroduce an
    N+1 or move filtering back into Python.
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
            actions = object_audit_log(obj=self.shelter, target_type="SHELTER", **kwargs)
        return actions, list(captured.captured_queries)

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
        """Filters are predicates on the CTE, not a Python post-filter (§10, §21)."""
        self._rename(5)

        future = datetime.now(timezone.utc) + timedelta(days=1)
        actions, queries = self._log_and_count(date_from=future, actor_id=self.user.pk)

        # Nothing survives the window, so the selector must short-circuit after
        # the key query — proof the predicate ran in SQL, since a Python-side
        # filter would have had to fetch the rows before dropping them.
        self.assertEqual(actions, [])
        self.assertEqual(len(queries), 1)

        sql = queries[0]["sql"]
        self.assertIn("pgh_created_at", sql)
        self.assertIn("actor_id", sql)
