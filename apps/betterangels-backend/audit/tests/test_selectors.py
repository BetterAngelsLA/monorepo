"""Tests for the object audit-log selector (ADR 0004 §20)."""

import re
from typing import Any

from django.db import connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from model_bakery import baker
from pghistory.core import event_models

from accounts.models import User
from audit.models import AuditWriteEvent
from audit.selectors import (
    _EXCLUDED_EVENT_MODELS,
    _SCOPED_EXCLUSIONS,
    LABEL_FIELD,
    MAX_LIMIT,
    THROUGH_EVENT_MAP,
    object_audit_log,
)
from audit.tests.utils import audit_context, clear_history_context
from shelters.enums import (
    DemographicChoices,
    ExitPolicyChoices,
    MedicalNeedChoices,
    ReferralRequirementChoices,
    ReservationStatusChoices,
)
from shelters.models import (
    Bed,
    Demographic,
    ExitPolicy,
    MedicalNeed,
    ReferralRequirement,
    Reservation,
    Room,
    Shelter,
)


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

    def test_one_action_writing_two_models_does_not_conflate_shared_field_names(self) -> None:
        """Two tracked models rendering the same display name keep separate pairs (§13).

        ``references()`` spans the target plus its related rows, so one action can
        write a Shelter and a Bed. Both render ``"name"``; merging them by display
        name alone would produce a false ``Audit Shelter -> Renamed Bed`` pair.
        """
        with audit_context(user=self.user):
            self.shelter.name = "Renamed Shelter"
            self.shelter.save()
            self.bed.name = "Renamed Bed"
            self.bed.save()

        actions = object_audit_log(obj=self.shelter, target_type="SHELTER")

        self.assertEqual(len(actions), 1)
        changes = actions[0].field_changes
        # Only a genuine collision is qualified; each pair is its own model's.
        self.assertNotIn("name", changes)
        self.assertEqual(changes["Shelter name"], ["Audit Shelter", "Renamed Shelter"])
        self.assertEqual(changes["Bed name"], ["Bed A", "Renamed Bed"])

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
        self.assertEqual(action.field_changes["status"], ["Confirmed", "Checked In"])

    def test_status_change_and_notes_update_render_both_field_changes(self) -> None:
        # Two writes in one request (a status change + a notes edit) must merge
        # into one action carrying *both* diffs — not just one winner row (§20).
        with audit_context(user=self.user):
            self.reservation.status = ReservationStatusChoices.CHECKED_IN
            self.reservation.save()
            self.reservation.notes = "Bed bugs reported"
            self.reservation.save()

        actions = object_audit_log(obj=self.reservation, target_type="RESERVATION")

        self.assertEqual(len(actions), 1)
        labels = [event.action for event in actions[0].events]
        self.assertEqual(labels.count("reservation.status_change"), 1)
        self.assertEqual(labels.count("reservation.update"), 1)
        changes = actions[0].field_changes
        self.assertEqual(changes["status"], ["Confirmed", "Checked In"])
        self.assertEqual(changes["notes"], [None, "Bed bugs reported"])

    # ── §13/§14 INSERT and FK labels ─────────────────────────────────────────

    def test_insert_renders_non_null_fields_and_resolves_fk_labels(self) -> None:
        with audit_context(user=self.user):
            reservation = Reservation.objects.create(bed=self.bed, status=ReservationStatusChoices.CANCELLED)

        actions = object_audit_log(obj=reservation, target_type="RESERVATION")
        add_action = _action_with(actions, "Cancelled")

        self.assertIsNotNone(add_action)
        assert add_action is not None
        # Keys render the field's verbose_name, FK values its display label (§13/§14).
        self.assertEqual(add_action.field_changes["bed"], [None, "Bed A"])
        self.assertEqual(add_action.field_changes["status"], [None, "Cancelled"])
        self.assertNotIn("created_at", add_action.field_changes)
        self.assertNotIn("updated_at", add_action.field_changes)

    def test_fk_update_resolves_to_related_display_label(self) -> None:
        with audit_context(user=self.user):
            self.bed.room = self.room
            self.bed.save()

        actions = object_audit_log(obj=self.shelter, target_type="SHELTER")
        bed_actions = [a for a in actions if a.field_changes.get("room")]

        self.assertEqual(len(bed_actions), 1)
        self.assertEqual(bed_actions[0].field_changes["room"], [None, "Room A"])

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

    # ── §13 full-state snapshot (opt-in) / §10 SQL pagination ────────────────

    def test_snapshot_is_opt_in_and_renders_full_state(self) -> None:
        with audit_context(user=self.user):
            self.shelter.name = "Snapshot Shelter"
            self.shelter.save()

        without = object_audit_log(obj=self.shelter, target_type="SHELTER")
        self.assertIsNone(without[0].events[0].snapshot)

        with_snapshot = object_audit_log(obj=self.shelter, target_type="SHELTER", include_snapshot=True)
        snapshot = with_snapshot[0].events[0].snapshot
        self.assertIsNotNone(snapshot)
        assert snapshot is not None
        self.assertEqual(snapshot["name"], "Snapshot Shelter")
        self.assertNotIn("created_at", snapshot)
        self.assertNotIn("updated_at", snapshot)

    def test_offset_beyond_range_returns_no_actions(self) -> None:
        with audit_context(user=self.user):
            self.shelter.name = "Only Rename"
            self.shelter.save()

        actions = object_audit_log(obj=self.shelter, target_type="SHELTER", limit=10, offset=100)

        self.assertEqual(actions, [])

    def test_limit_and_offset_are_validated(self) -> None:
        # An oversized/non-positive limit or a negative offset is caller input
        # and must raise rather than slicing unboundedly (§10 cap).
        for limit, offset in ((0, 0), (MAX_LIMIT + 1, 0), (50, -1)):
            with self.subTest(limit=limit, offset=offset):
                with self.assertRaises(ValueError):
                    object_audit_log(obj=self.shelter, target_type="SHELTER", limit=limit, offset=offset)

    def test_max_limit_is_the_inclusive_upper_bound(self) -> None:
        actions = object_audit_log(obj=self.shelter, target_type="SHELTER", limit=MAX_LIMIT)
        self.assertIsInstance(actions, list)

    def test_sql_pagination_returns_the_requested_page(self) -> None:
        for name in ("Page One", "Page Two", "Page Three"):
            with audit_context(user=self.user):
                self.shelter.name = name
                self.shelter.save()

        page = object_audit_log(obj=self.shelter, target_type="SHELTER", limit=1, offset=1)

        self.assertEqual(len(page), 1)
        self.assertEqual(page[0].field_changes["name"], ["Page One", "Page Two"])

    def test_pagination_groups_and_limits_in_sql(self) -> None:
        for name in ("Alpha", "Beta", "Gamma"):
            with audit_context(user=self.user):
                self.shelter.name = name
                self.shelter.save()

        with CaptureQueriesContext(connection) as ctx:
            object_audit_log(obj=self.shelter, target_type="SHELTER", limit=1, offset=0)

        sql = " ".join(query["sql"] for query in ctx.captured_queries).upper()
        # The action keys are grouped and sliced in SQL, not by fetching the
        # object's whole history into Python first (§10).
        self.assertIn("GROUP BY", sql)
        self.assertIn("LIMIT 1", sql)

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
            object_audit_log(obj=self.shelter, target_type="SHELTER", limit=1)
        with CaptureQueriesContext(connection) as many:
            object_audit_log(obj=self.shelter, target_type="SHELTER", limit=50)

        self.assertEqual(len(one), len(many))
        self.assertLessEqual(len(many), 4)

        sql = " ".join(query["sql"] for query in many.captured_queries).lower()
        # Filtering (the seed exclusion) is pushed into SQL, not applied in Python.
        self.assertIn("seed", sql)
        self.assertIn("group by", sql)

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

        bed_actions = object_audit_log(obj=self.bed, target_type="BED")
        self.assertEqual(len(bed_actions), 1)
        # Rendering the correct through FK column proves it was attributed
        # rather than dropped to the non-M2M path (§19).
        removed, added = bed_actions[0].field_changes["medical needs"]
        self.assertEqual(removed, [])
        self.assertEqual(added, ["erc"])

        shelter_actions = object_audit_log(obj=self.shelter, target_type="SHELTER")
        self.assertEqual(len(shelter_actions), 1)
        changes = shelter_actions[0].field_changes
        self.assertEqual(changes["exit policy"], [[], ["mia"]])
        self.assertEqual(changes["referral requirement"], [[], ["self_referral"]])

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

    def test_references_boundary_for_bed(self) -> None:
        labels = {event_model._meta.label for event_model in event_models(references_model=Bed)}

        self.assertEqual(labels, _EXPECTED_BED_REFERENCES)
        # A bed reaches the reservations on it and its own TrackedBed* proxies.
        self.assertIn("shelters.ReservationEvent", labels)

    def test_room_and_bed_logs_exclude_reservations_but_keep_config_changes(self) -> None:
        # ``references()`` matches ``ReservationEvent`` via ``room_id``/``bed_id``,
        # but the *log* filters it out: a room/bed log is its own configuration,
        # not every stay that referenced it (§10).
        with audit_context(user=self.user):
            Reservation.objects.create(bed=self.bed, room=self.room, status=ReservationStatusChoices.CANCELLED)
        with audit_context(user=self.user):
            self.room.name = "Renamed Room"
            self.room.save()

        room_actions = object_audit_log(obj=self.room, target_type="ROOM")
        self.assertEqual(len(room_actions), 1)
        self.assertEqual(room_actions[0].field_changes.get("name"), ["Room A", "Renamed Room"])

        self.assertEqual(object_audit_log(obj=self.bed, target_type="BED"), [])

    def test_references_boundary_for_room(self) -> None:
        labels = {event_model._meta.label for event_model in event_models(references_model=Room)}

        self.assertEqual(labels, _EXPECTED_ROOM_REFERENCES)
        # ``references()`` matches these, but the Room *log* drops ReservationEvent
        # (see the exclusion test above); BedEvent stays (beds in the room).
        self.assertIn("shelters.BedEvent", labels)
        self.assertIn("shelters.ReservationEvent", labels)

    # ── RDS Proxy pinning guards (ADR 0004 §10) ──────────────────────────────

    # The aggregate statement's size tracks the number of event models
    # ``references()`` matches, so these ceilings catch a newly tracked model
    # (each branch adds a few KB). SHELTER/BED/ROOM exceed RDS Proxy's 16 KB
    # pinning threshold by construction — a documented, accepted trade-off — so
    # this asserts the recorded ceiling rather than a bound the design cannot
    # meet. The target-scoped exclusions filter rows, not UNION branches, so
    # they barely change the statement size.
    _STATEMENT_CEILINGS = {"SHELTER": 78_000, "BED": 21_000, "ROOM": 21_000, "RESERVATION": 7_500}

    def test_selector_issues_no_server_side_cursor(self) -> None:
        """``.iterator()`` would emit ``DECLARE``, which RDS Proxy pins (§10)."""
        with audit_context(user=self.user):
            self.shelter.name = "Renamed Shelter"
            self.shelter.save()

        with CaptureQueriesContext(connection) as captured:
            object_audit_log(obj=self.shelter, target_type="SHELTER")

        sql = "\n".join(query["sql"] for query in captured.captured_queries)

        # Guard against a vacuous pass: the selector must have issued its
        # aggregate CTE query (key query + page query).
        self.assertTrue(captured.captured_queries)
        self.assertIn("WITH", sql.upper())

        self.assertIsNone(re.search(r"\bDECLARE\b", sql, re.IGNORECASE))

    def test_selector_statement_stays_within_the_recorded_ceiling(self) -> None:
        """Guard the aggregate statement against growth (see the ADR §10 note)."""
        for target_type, obj in (
            ("SHELTER", self.shelter),
            ("BED", self.bed),
            ("ROOM", self.room),
            ("RESERVATION", self.reservation),
        ):
            excluded = (*_EXCLUDED_EVENT_MODELS, *_SCOPED_EXCLUSIONS.get(target_type, ()))
            queryset = AuditWriteEvent.objects.references([obj]).exclude(pgh_model__in=excluded).exclude(label="seed")
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
