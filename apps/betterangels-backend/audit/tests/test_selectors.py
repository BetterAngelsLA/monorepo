"""Tests for the object audit-log selector (ADR 0004 §20)."""

from typing import Any

from django.db import connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from model_bakery import baker
from pghistory.core import event_models

from accounts.models import User
from audit.selectors import (
    _EXCLUDED_EVENT_MODELS,
    LABEL_FIELD,
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

    def test_status_change_is_folded_into_the_reservation_update_action(self) -> None:
        with audit_context(user=self.user):
            self.reservation.status = ReservationStatusChoices.CHECKED_IN
            self.reservation.save()

        actions = object_audit_log(obj=self.reservation, target_type="RESERVATION")

        self.assertEqual(len(actions), 1)
        action = actions[0]
        labels = [event.action for event in action.events]
        self.assertNotIn("reservation.status_change", labels)
        self.assertIn("reservation.update", labels)
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
        changes = actions[0].field_changes
        self.assertEqual(changes["status"], ["Confirmed", "Checked In"])
        self.assertEqual(changes["notes"], [None, "Bed bugs reported"])

    # ── §13/§14 INSERT and FK labels ─────────────────────────────────────────

    def test_insert_renders_non_null_fields_and_resolves_fk_labels(self) -> None:
        with audit_context(user=self.user):
            Reservation.objects.create(bed=self.bed, status=ReservationStatusChoices.CANCELLED)

        actions = object_audit_log(obj=self.bed, target_type="BED")
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

    def test_references_boundary_for_room(self) -> None:
        labels = {event_model._meta.label for event_model in event_models(references_model=Room)}

        self.assertEqual(labels, _EXPECTED_ROOM_REFERENCES)
        # Counter-intuitive but intended: a room's log includes BedEvent and
        # ReservationEvent because both carry a room_id FK (§10, §20).
        self.assertIn("shelters.BedEvent", labels)
        self.assertIn("shelters.ReservationEvent", labels)


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

# Bed/Room reference sets, pinned literally (like the Shelter set) so adding a
# model with a bed_id/room_id FK must be acknowledged, not silently absorbed.
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
