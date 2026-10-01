"""GraphQL tests for ``objectAuditLog`` (ADR 0004 §20)."""

from clients.models import ClientProfile
from common.tests.utils import GraphQLBaseTestCase
from model_bakery import baker

from audit.tests.utils import audit_context
from shelters.enums import DemographicChoices, ReservationStatusChoices
from shelters.models import Bed, Demographic, Reservation, ReservationClient, Shelter

OBJECT_AUDIT_LOG_QUERY = """
    query ObjectAuditLog($targetType: AuditTargetType!, $objectId: ID!, $limit: Int, $offset: Int) {
        objectAuditLog(targetType: $targetType, objectId: $objectId, limit: $limit, offset: $offset) {
            timestamp
            actor
            summary
            fieldChanges
            events {
                kind
                action
                targetType
                targetId
                actor
                fieldChanges
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

        with audit_context(label="seed"):
            self.shelter = Shelter.objects.create(name="Query Shelter", organization=self.org_1)
            self.demographic_all = Demographic.objects.create(name=DemographicChoices.ALL)
            self.demographic_couples = Demographic.objects.create(name=DemographicChoices.COUPLES)
            self.shelter.demographics.set([self.demographic_all])
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
        actions = response["data"]["objectAuditLog"]

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
        actions = response["data"]["objectAuditLog"]

        self.assertEqual(len(actions), 1)
        removed, added = actions[0]["fieldChanges"]["demographics"]
        self.assertEqual(removed, [])
        self.assertEqual(added, ["couples"])

    def test_reservation_client_write_is_attributed_to_the_reservation(self) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)
        client_profile = baker.make(ClientProfile, first_name="Grace", last_name="Hopper")
        with audit_context(user=self.org_1_case_manager_1):
            ReservationClient.objects.create(
                reservation=self.reservation, client_profile=client_profile, is_primary=True
            )

        response = self._query("RESERVATION", self.reservation.id)
        actions = response["data"]["objectAuditLog"]

        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0]["events"][0]["action"], "reservation_client.add")
        self.assertEqual(actions[0]["fieldChanges"]["client_profile_id"], [None, "Grace Hopper"])

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

    def test_pagination_slices_actions(self) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)
        for name in ("First", "Second", "Third"):
            with audit_context(user=self.org_1_case_manager_1):
                self.shelter.name = name
                self.shelter.save()

        response = self._query("SHELTER", self.shelter.id, limit=1, offset=1)
        actions = response["data"]["objectAuditLog"]

        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0]["fieldChanges"]["name"], ["First", "Second"])
