"""Tests for the object audit-log selector (ADR 0004 §20)."""

import re
from types import SimpleNamespace
from typing import Any

from django.apps import apps
from django.db import connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from model_bakery import baker
from pghistory.core import event_models

from accounts.models import User
from audit.selectors import (
    _EXCLUDED_EVENT_MODELS,
    _LABEL_FIELD_OVERRIDES,
    MAX_LIMIT,
    _label_field,
    _LabelResolver,
    _m2m_meta,
    _scalar_changes,
    _through_event_meta,
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
        # The anchored shelter's own change stays bare; the related bed is
        # qualified with its model and id, so the two never merge.
        self.assertEqual(changes["name"], ["Audit Shelter", "Renamed Shelter"])
        self.assertEqual(changes[f"Bed {self.bed.pk} name"], ["Bed A", "Renamed Bed"])

    def test_one_action_touching_two_rows_of_a_model_keeps_them_separate(self) -> None:
        """Two rows of the *same* model must not merge into one pair (§13).

        A bulk write (e.g. the ``label="import"`` CSV import) saves many rows under
        one context. Keying the action rollup by field name alone would render a
        50-object import as a single ``name: [None, "<last>"]`` create.
        """
        with audit_context(label="seed"):
            other_bed = Bed.objects.create(shelter=self.shelter, name="Bed B")

        with audit_context(user=self.user):
            self.bed.name = "Renamed Bed A"
            self.bed.save()
            other_bed.name = "Renamed Bed B"
            other_bed.save()

        actions = object_audit_log(obj=self.shelter, target_type="SHELTER")

        self.assertEqual(len(actions), 1)
        changes = actions[0].field_changes
        # Each bed keeps its own before/after, keyed by row id.
        self.assertEqual(changes[f"Bed {self.bed.pk} name"], ["Bed A", "Renamed Bed A"])
        self.assertEqual(changes[f"Bed {other_bed.pk} name"], ["Bed B", "Renamed Bed B"])

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

    def test_insert_omits_the_primary_key(self) -> None:
        """The pk is in ``pgh_data`` but can never change, so it is not a change (§13).

        The UPDATE branch renders ``pgh_diff``, which never contains it; without
        this the insert branch alone would show ``id: [None, 7]``.
        """
        with audit_context(user=self.user):
            reservation = Reservation.objects.create(bed=self.bed, status=ReservationStatusChoices.CANCELLED)

        add_action = _action_with(object_audit_log(obj=reservation, target_type="RESERVATION"), "Cancelled")
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
        with audit_context(user=self.user):
            self.bed.room = self.room
            self.bed.save()

        actions = object_audit_log(obj=self.shelter, target_type="SHELTER")
        bed_key = f"Bed {self.bed.pk} room"
        bed_actions = [a for a in actions if a.field_changes.get(bed_key)]

        self.assertEqual(len(bed_actions), 1)
        self.assertEqual(bed_actions[0].field_changes[bed_key], [None, "Room A"])

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

        actions = object_audit_log(obj=self.shelter, target_type="SHELTER")

        # Both writes are in the shelter's log (references() spans its beds) but
        # they are two separate actions, not one merged "system" action.
        shelter_action = _action_with(actions, "Shelter No Context")
        bed_action = _action_with(actions, "Bed No Context")
        self.assertIsNotNone(shelter_action)
        self.assertIsNotNone(bed_action)
        self.assertNotEqual(shelter_action, bed_action)

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

        actions = object_audit_log(obj=self.shelter, target_type="SHELTER", include_snapshot=True)

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
        for offset in range(3):
            seen.extend(object_audit_log(obj=self.shelter, target_type="SHELTER", limit=1, offset=offset))

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
    #
    # Recorded from the interpolated SQL the selector actually issues (the max
    # over its grouped key query and page query, measured by the test below),
    # rounded up with ~5% headroom.
    _STATEMENT_CEILINGS = {"SHELTER": 76_500, "BED": 20_600, "ROOM": 20_800, "RESERVATION": 7_150}

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
                object_audit_log(obj=obj, target_type=target_type, limit=1, offset=0)

            size = max((len(query["sql"]) for query in captured.captured_queries), default=0)

            self.assertLessEqual(size, self._STATEMENT_CEILINGS[target_type], f"{target_type} statement grew to {size}")


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
