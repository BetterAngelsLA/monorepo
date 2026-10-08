"""GraphQL tests for ``objectAuditLog`` (ADR 0004 §20–§21)."""

import json
from datetime import datetime, timezone

from model_bakery import baker

from accounts.models import Role, User
from accounts.services import role_assign, sync_roles
from audit.selectors import MAX_LIMIT
from audit.tests.utils import audit_context
from common.tests.utils import GraphQLBaseTestCase
from shelters.enums import DemographicChoices, ReservationStatusChoices
from shelters.groups import GLOBAL_SHELTER_OPERATOR_ROLE
from shelters.models import Bed, ContactInfo, Demographic, Reservation, Room, Shelter
from test_utils.pghistory import backdate_event_rows

_T1 = datetime(2026, 1, 1, 12, 0, tzinfo=timezone.utc)
_T2 = datetime(2026, 2, 1, 12, 0, tzinfo=timezone.utc)

BA_REVIEW_QUERY = """
    query OperatorShelter($pk: ID!) {
        operatorShelter(pk: $pk) {
            id
            overallRating
            subjectiveReview
            declinedBaVisit
        }
    }
"""

BEDS_QUERY = """
    query Beds {
        beds(pagination: {limit: 10}) {
            results { id name }
        }
    }
"""

OBJECT_AUDIT_LOG_QUERY = """
    query ObjectAuditLog(
        $targetType: AuditTargetType!,
        $objectId: ID!,
        $dateFrom: DateTime,
        $dateTo: DateTime,
        $actorId: ID,
        $limit: Int,
        $after: String,
        $includeSnapshot: Boolean
    ) {
        objectAuditLog(
            targetType: $targetType,
            objectId: $objectId,
            dateFrom: $dateFrom,
            dateTo: $dateTo,
            actorId: $actorId,
            limit: $limit,
            after: $after,
            includeSnapshot: $includeSnapshot
        ) {
            endCursor
            hasNextPage
            results {
                timestamp
                actor
                summary
                fieldChanges
                truncated
                events {
                    kind
                    action
                    targetType
                    targetId
                    actor
                    summary
                    fieldChanges
                    snapshot
                }
            }
        }
    }
"""


class ObjectAuditLogQueryTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.org_1_case_manager_1.first_name = "Casey"
        self.org_1_case_manager_1.last_name = "Manager"
        self.org_1_case_manager_1.email = "casey@example.com"
        self.org_1_case_manager_1.save()
        self._grant_permission(self.org_1_case_manager_1, Shelter.perms.VIEW, self.org_1)
        self._grant_permission(self.org_1_case_manager_1, Reservation.perms.VIEW, self.org_1)
        self._grant_permission(self.org_1_case_manager_1, Room.perms.VIEW, self.org_1)
        self._grant_permission(self.org_1_case_manager_1, Bed.perms.VIEW, self.org_1)

        with audit_context(label="seed"):
            self.shelter = Shelter.objects.create(name="Query Shelter", organization=self.org_1)
            self.demographic_all = Demographic.objects.create(name=DemographicChoices.ALL)
            self.demographic_couples = Demographic.objects.create(name=DemographicChoices.COUPLES)
            self.shelter.demographics.set([self.demographic_all])
            self.room = Room.objects.create(shelter=self.shelter, name="Room A")
            self.bed = Bed.objects.create(shelter=self.shelter, name="Bed A")
            self.reservation = Reservation.objects.create(bed=self.bed, status=ReservationStatusChoices.CONFIRMED)

    def _query(self, target_type: str, object_id: int, **variables: object) -> dict:
        return self.execute_graphql(
            OBJECT_AUDIT_LOG_QUERY,
            variables={"targetType": target_type, "objectId": str(object_id), **variables},
        )

    # ── grouping / ordering / attribution ────────────────────────────────────

    def test_actions_are_grouped_and_ordered_newest_first(self) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)
        with audit_context(user=self.org_1_case_manager_1):
            self.shelter.name = "First"
            self.shelter.save()
        with audit_context(user=self.org_1_case_manager_1):
            self.shelter.name = "Second"
            self.shelter.save()

        response = self._query("SHELTER", self.shelter.id)
        actions = response["data"]["objectAuditLog"]["results"]

        self.assertEqual(len(actions), 2)
        self.assertEqual(actions[0]["fieldChanges"]["name"], ["First", "Second"])
        self.assertEqual(actions[1]["fieldChanges"]["name"], ["Query Shelter", "First"])
        self.assertEqual(actions[0]["actor"], "Casey Manager")
        self.assertEqual(actions[0]["events"][0]["action"], "shelter.update")
        self.assertEqual(actions[0]["events"][0]["targetId"], str(self.shelter.id))

    def test_m2m_change_is_attributed_to_the_parent(self) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)
        with audit_context(user=self.org_1_case_manager_1):
            self.shelter.demographics.set([self.demographic_all, self.demographic_couples])

        response = self._query("SHELTER", self.shelter.id)
        actions = response["data"]["objectAuditLog"]["results"]

        self.assertEqual(len(actions), 1)
        removed, added = actions[0]["fieldChanges"]["demographics"]
        self.assertEqual(removed, [])
        self.assertEqual(added, ["couples"])

    def test_reservation_target_is_not_exposed(self) -> None:
        """``AuditTargetType`` no longer publishes ``RESERVATION`` (§32).

        Reservation history keeps accruing server-side; only the public query
        surface is withdrawn, so schema validation rejects the target.
        """
        self.graphql_client.force_login(self.org_1_case_manager_1)

        response = self._query("RESERVATION", self.reservation.id)

        errors = response.get("errors", [])
        self.assertEqual(len(errors), 1)
        self.assertIn("RESERVATION", errors[0]["message"])
        self.assertIn("AuditTargetType", errors[0]["message"])
        self.assertNotIn("objectAuditLog", response.get("data") or {})

    def test_summary_is_exposed_on_events(self) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)
        with audit_context(user=self.org_1_case_manager_1):
            self.bed.name = "Summarized Bed"
            self.bed.save()

        response = self._query("SHELTER", self.shelter.id)
        events = response["data"]["objectAuditLog"]["results"][0]["events"]

        self.assertEqual(events[0]["summary"], f"Updated Summarized Bed ({self.bed.id})")
        self.assertEqual(events[0]["fieldChanges"], {})

    # ── authorization (§18) ──────────────────────────────────────────────────

    def test_requires_authentication(self) -> None:
        self.graphql_client.logout()

        response = self._query("SHELTER", self.shelter.id)

        self.assertGraphQLUnauthenticated(response)

    def test_without_view_permission_fails_closed(self) -> None:
        self.graphql_client.force_login(self.non_case_manager_user)

        response = self._query("SHELTER", self.shelter.id)

        self.assertGraphQLError(response, "could not be found")

    def test_cross_org_object_fails_closed(self) -> None:
        self._grant_permission(self.org_2_case_manager_1, Shelter.perms.VIEW, self.org_2)
        self.graphql_client.force_login(self.org_2_case_manager_1)

        response = self._query("SHELTER", self.shelter.id)

        self.assertGraphQLError(response, "could not be found")

    def test_room_without_view_permission_fails_closed(self) -> None:
        self.graphql_client.force_login(self.non_case_manager_user)

        response = self._query("ROOM", self.room.id)

        self.assertGraphQLError(response, "could not be found")

    def test_room_cross_org_fails_closed(self) -> None:
        self._grant_permission(self.org_2_case_manager_1, Room.perms.VIEW, self.org_2)
        self.graphql_client.force_login(self.org_2_case_manager_1)

        response = self._query("ROOM", self.room.id)

        self.assertGraphQLError(response, "could not be found")

    def test_bed_without_view_permission_fails_closed(self) -> None:
        self.graphql_client.force_login(self.non_case_manager_user)

        response = self._query("BED", self.bed.id)

        self.assertGraphQLError(response, "could not be found")

    def test_bed_cross_org_fails_closed(self) -> None:
        self._grant_permission(self.org_2_case_manager_1, Bed.perms.VIEW, self.org_2)
        self.graphql_client.force_login(self.org_2_case_manager_1)

        response = self._query("BED", self.bed.id)

        self.assertGraphQLError(response, "could not be found")

    def test_global_tier_operator_can_read_a_cross_org_object(self) -> None:
        # §18: unlike the scoped tier above, a Global Shelter Operator reaches
        # any org's object — the primary audit surface for the global tier.
        sync_roles()
        gso = baker.make(User)
        role_assign(user=gso, role=Role.objects.get(name=GLOBAL_SHELTER_OPERATOR_ROLE.name))

        with audit_context(label="seed"):
            cross_org_shelter = Shelter.objects.create(name="Org 2 Shelter", organization=self.org_2)
        with audit_context(user=gso):
            cross_org_shelter.name = "Org 2 Renamed"
            cross_org_shelter.save()

        # The active-org header still points at org_1 (§2.4 never confines a
        # global holder), yet the org_2 object resolves.
        self.graphql_client.force_login(gso)
        response = self._query("SHELTER", cross_org_shelter.id)
        actions = response["data"]["objectAuditLog"]["results"]

        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0]["fieldChanges"]["name"], ["Org 2 Shelter", "Org 2 Renamed"])

    # ── excluded internal models (§7b.6) ─────────────────────────────────────

    def _seed_contact_info(self) -> ContactInfo:
        """Create an internal contact row, plus a shelter action as a positive control."""
        with audit_context(user=self.org_1_case_manager_2):
            contact = ContactInfo.objects.create(
                shelter=self.shelter,
                contact_name="BA Secret",
                contact_number="+15551234567",
                contact_email="secret@example.com",
                is_claimant=True,
            )
        # A non-contact action so the log cannot be empty for the wrong reason.
        with audit_context(user=self.org_1_case_manager_2):
            self.shelter.name = "Query Shelter Renamed"
            self.shelter.save()
        return contact

    def _assert_no_contact_data(self, response: dict) -> None:
        dumped = json.dumps(response)
        self.assertNotIn("Contact info", dumped)
        self.assertNotIn("BA Secret", dumped)
        self.assertNotIn("secret@example.com", dumped)
        self.assertNotIn("+15551234567", dumped)
        # The unrelated shelter action still renders, so the exclusion is
        # specific rather than a silently empty log.
        self.assertIn("Query Shelter Renamed", dumped)

    def test_contact_rows_are_written_but_never_rendered(self) -> None:
        """ContactInfo is internal BA data: no caller may read it through the log.

        The rows are still written (tracking is unchanged); the selector excludes
        the event model for every target and every caller, so contact names,
        emails, and phone numbers cannot surface even with ``includeSnapshot``.
        """
        contact = self._seed_contact_info()
        ContactInfoEvent = ContactInfo.pgh_event_model  # type: ignore[attr-defined]
        self.assertTrue(ContactInfoEvent.objects.filter(pgh_obj_id=contact.pk).exists())

        self.graphql_client.force_login(self.org_1_case_manager_1)
        response = self._query("SHELTER", self.shelter.id, includeSnapshot=True)

        self.assertIsNone(response.get("errors"))
        self._assert_no_contact_data(response)

    def test_contact_rows_are_hidden_from_the_global_operator(self) -> None:
        self._seed_contact_info()
        sync_roles()
        global_operator = baker.make(User)
        role_assign(user=global_operator, role=Role.objects.get(name=GLOBAL_SHELTER_OPERATOR_ROLE.name))

        self.graphql_client.force_login(global_operator)
        response = self._query("SHELTER", self.shelter.id, includeSnapshot=True)

        self.assertIsNone(response.get("errors"))
        self._assert_no_contact_data(response)

    def test_pagination_slices_actions(self) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)
        for name in ("First", "Second", "Third"):
            with audit_context(user=self.org_1_case_manager_1):
                self.shelter.name = name
                self.shelter.save()

        first = self._query("SHELTER", self.shelter.id, limit=1)
        page = first["data"]["objectAuditLog"]
        self.assertTrue(page["hasNextPage"])

        response = self._query("SHELTER", self.shelter.id, limit=1, after=page["endCursor"])
        actions = response["data"]["objectAuditLog"]["results"]

        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0]["fieldChanges"]["name"], ["First", "Second"])

    def test_cursor_past_the_oldest_action_returns_no_actions(self) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)
        with audit_context(user=self.org_1_case_manager_1):
            self.shelter.name = "Only"
            self.shelter.save()

        first = self._query("SHELTER", self.shelter.id, limit=5)
        page = first["data"]["objectAuditLog"]
        response = self._query("SHELTER", self.shelter.id, limit=5, after=page["endCursor"])

        self.assertEqual(response["data"]["objectAuditLog"]["results"], [])
        self.assertFalse(response["data"]["objectAuditLog"]["hasNextPage"])

    def test_limit_over_the_cap_is_a_graphql_error_not_a_crash(self) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)

        response = self._query("SHELTER", self.shelter.id, limit=MAX_LIMIT + 1)

        self.assertGraphQLError(response, f"limit must be between 1 and {MAX_LIMIT}")

    def test_malformed_cursor_is_a_graphql_error(self) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)

        response = self._query("SHELTER", self.shelter.id, after="not-a-cursor")

        self.assertGraphQLError(response, "Invalid cursor")

    def test_include_snapshot_returns_full_object_state(self) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)
        with audit_context(user=self.org_1_case_manager_1):
            self.shelter.name = "Snapshot Query"
            self.shelter.save()

        response = self._query("SHELTER", self.shelter.id, includeSnapshot=True)
        event = response["data"]["objectAuditLog"]["results"][0]["events"][0]

        self.assertEqual(event["snapshot"]["name"], "Snapshot Query")
        self.assertNotIn("updated_at", event["snapshot"])

    # ── regression: authorization of BA-review fields / related summaries ───

    def test_ba_review_fields_are_hidden_from_scoped_operator(self) -> None:
        """#2559 gates BA review globally; the audit log must not bypass it.

        ``operatorShelter`` returns ``None`` for this scoped user, and the log
        has to agree: without the global grant neither ``fieldChanges`` nor the
        opt-in snapshot may carry the review fields, or the log becomes a read
        side door around the gate.
        """
        with audit_context(user=self.org_1_case_manager_1):
            self.shelter.overall_rating = 5
            self.shelter.subjective_review = "BA-private-review"
            self.shelter.declined_ba_visit = True
            self.shelter.save()

        self.graphql_client.force_login(self.org_1_case_manager_1)

        gate = self.execute_graphql(BA_REVIEW_QUERY, {"pk": str(self.shelter.pk)})
        self.assertIsNone(gate["data"]["operatorShelter"]["overallRating"])
        self.assertIsNone(gate["data"]["operatorShelter"]["subjectiveReview"])
        self.assertIsNone(gate["data"]["operatorShelter"]["declinedBaVisit"])

        response = self._query("SHELTER", self.shelter.id, includeSnapshot=True)
        self.assertIsNone(response.get("errors"))
        self.assertTrue(response["data"]["objectAuditLog"]["results"], "audit log is empty")

        dumped = json.dumps(response)
        self.assertNotIn("BA-private-review", dumped)
        self.assertNotIn("subjective review", dumped)
        self.assertNotIn("overall rating", dumped)
        self.assertNotIn("Declined BA Visit", dumped)

    def test_ba_review_fields_are_rendered_for_global_reviewer(self) -> None:
        """Positive control: an authorized global reviewer still sees the fields."""
        sync_roles()
        reviewer = baker.make(User)
        role_assign(user=reviewer, role=Role.objects.get(name=GLOBAL_SHELTER_OPERATOR_ROLE.name))

        with audit_context(user=reviewer):
            self.shelter.subjective_review = "BA-global-review"
            self.shelter.save()

        self.graphql_client.force_login(reviewer)
        response = self._query("SHELTER", self.shelter.id)

        self.assertIsNone(response.get("errors"))
        self.assertIn("BA-global-review", json.dumps(response))

    def test_bed_and_room_summaries_require_related_view_permission(self) -> None:
        """A shelter-only role must not learn bed/room names from the shelter log.

        The ``beds`` query is empty for this user, so the summary lines are the
        only way the name/id is exposed.
        """
        # A unique role name matters: ``_grant_permission`` reuses the
        # class-named role, which setUp already gave Bed/Room/Reservation VIEW.
        shelter_only = baker.make(User)
        self._grant_permission(
            shelter_only,
            Shelter.perms.VIEW,
            self.org_1,
            role_name="Audit Shelter-Only Viewer",
        )

        with audit_context(user=shelter_only):
            self.shelter.name = "Visible Shelter Rename"
            self.shelter.save()
            Bed.objects.create(shelter=self.shelter, name="Hidden Bed")
            self.room.name = "Hidden Room"
            self.room.save()

        self.graphql_client.force_login(shelter_only)

        beds = self.execute_graphql(BEDS_QUERY)
        self.assertEqual(beds["data"]["beds"]["results"], [])

        response = self._query("SHELTER", self.shelter.id)
        self.assertIsNone(response.get("errors"))
        dumped = json.dumps(response)
        self.assertIn("Visible Shelter Rename", dumped)
        self.assertNotIn("Hidden Bed", dumped)
        self.assertNotIn("Hidden Room", dumped)

    def test_hidden_only_bed_action_has_no_false_summary_or_empty_events(self) -> None:
        """A hidden bed-only write must not leave a false, empty action.

        The fix for the name/id leak skips the Bed/Room summary event, but the
        action remains: it currently says the shelter was *created* and carries
        no events. This test fails on the current head by design.
        """
        shelter_only = baker.make(User)
        self._grant_permission(
            shelter_only,
            Shelter.perms.VIEW,
            self.org_1,
            role_name="Hidden Only Viewer",
        )
        with audit_context(user=shelter_only):
            Bed.objects.create(shelter=self.shelter, name="Hidden Only Bed")

        self.graphql_client.force_login(shelter_only)
        response = self._query("SHELTER", self.shelter.id)
        self.assertIsNone(response.get("errors"))
        self.assertNotIn("Hidden Only Bed", json.dumps(response))

        for action in response["data"]["objectAuditLog"]["results"]:
            self.assertNotIn("created shelter", action["summary"])
            self.assertTrue(action["events"], f"hidden-only action has no events: {action}")

    # ── date / actor filters (§21) ───────────────────────────────────────────

    def _rename_at(self, name: str, *, at: datetime, user: object) -> None:
        with audit_context(user=user):
            self.shelter.name = name
            self.shelter.save()
        backdate_event_rows(
            Shelter.pgh_event_model.objects.filter(pgh_obj_id=self.shelter.pk, pgh_label="shelter.update", name=name),
            pgh_created_at=at,
        )

    def test_date_filters_narrow_the_log(self) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)
        self._rename_at("Early", at=_T1, user=self.org_1_case_manager_1)
        self._rename_at("Late", at=_T2, user=self.org_1_case_manager_1)

        response = self._query("SHELTER", self.shelter.id, dateFrom=_T2.isoformat())
        actions = response["data"]["objectAuditLog"]["results"]

        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0]["fieldChanges"]["name"], ["Early", "Late"])

        response = self._query("SHELTER", self.shelter.id, dateTo=_T1.isoformat())
        actions = response["data"]["objectAuditLog"]["results"]

        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0]["fieldChanges"]["name"], ["Query Shelter", "Early"])

    def test_actor_filter_narrows_the_log(self) -> None:
        self._grant_permission(self.org_1_case_manager_2, Shelter.perms.VIEW, self.org_1)
        self.graphql_client.force_login(self.org_1_case_manager_1)
        self._rename_at("By Casey", at=_T1, user=self.org_1_case_manager_1)
        self._rename_at("By Dana", at=_T2, user=self.org_1_case_manager_2)

        response = self._query("SHELTER", self.shelter.id, actorId=str(self.org_1_case_manager_1.id))
        actions = response["data"]["objectAuditLog"]["results"]

        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0]["fieldChanges"]["name"], ["Query Shelter", "By Casey"])
