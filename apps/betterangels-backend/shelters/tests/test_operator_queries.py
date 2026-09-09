import datetime
from typing import Any, cast

from common.tests.utils import GraphQLBaseTestCase
from model_bakery import baker
from unittest_parametrize import ParametrizedTestCase, parametrize
from waffle.testutils import override_flag

from shelters.constants import BA_ADMIN_ONLY_FIELDS_FLAG
from shelters.enums import DemographicChoices, PetChoices, ReservationStatusChoices, SpecialSituationRestrictionChoices
from shelters.enums import ShelterChoices as ShelterTypeChoices
from shelters.models import (
    Bed,
    ContactInfo,
    Demographic,
    Pet,
    Reservation,
    Shelter,
    ShelterType,
    SpecialSituationRestriction,
)
from shelters.models.shelter import ACTIVE_RESERVATION_STATUSES
from shelters.tests.baker_recipes import shelter_recipe


class OperatorShelterQueryTestCase(GraphQLBaseTestCase):
    OPERATOR_SHELTERS_QUERY = """
        query OperatorShelters($orgIds: [ID!], $offset: Int, $limit: Int) {
            operatorShelters(
                filters: { organizations: $orgIds }
                ordering: [{ createdAt: DESC }]
                pagination: { offset: $offset, limit: $limit }
            ) {
                totalCount
                pageInfo { offset limit }
                results { id name }
            }
        }
    """

    def setUp(self) -> None:
        super().setUp()
        self._add_shelter_view_permission()
        self.shelter = shelter_recipe.make(organization=self.org_1)

    def _add_shelter_view_permission(self) -> None:
        # Grant view_shelter through a Role+Grant (ADR 0001) so the case
        # manager can see shelters.  The legacy PermissionGroup mutation is
        # gone — permission checks read the Role the Grant references.
        self._grant_permission(self.org_1_case_manager_1, Shelter.perms.VIEW, self.org_1)

    def test_operator_shelters_filter_by_organization(self) -> None:
        """Only shelters for the specified organization are returned."""
        self.graphql_client.force_login(self.org_1_case_manager_1)
        shelter_2 = shelter_recipe.make(organization=self.org_1)

        response = self.execute_graphql(
            self.OPERATOR_SHELTERS_QUERY,
            variables={"orgIds": [str(self.org_1.id)], "offset": 0, "limit": 10},
        )

        payload = response["data"]["operatorShelters"]
        self.assertEqual(payload["totalCount"], 2)

        returned_ids = {r["id"] for r in payload["results"]}
        self.assertSetEqual(
            returned_ids,
            {str(self.shelter.id), str(shelter_2.id)},
        )

    def test_operator_shelters_org_filter_honors_grant_reach_not_membership(self) -> None:
        """The org *view* is bounded by grant reach, not membership.

        A user with a direct VIEW grant at an org they are not a member of can
        filter to it (delta 3: the filter variable is the org view).  Filtering
        by membership alone would return an empty dashboard for grant-only and
        delegated holders, even though ``visible()``/``switchable_orgs``
        include the org.
        """
        # Direct grant at org_2 — deliberately NO membership (no org_2.add_user).
        self._grant_permission(self.org_1_case_manager_1, Shelter.perms.VIEW, self.org_2)
        org_2_shelter = shelter_recipe.make(organization=self.org_2)
        self.graphql_client.force_login(self.org_1_case_manager_1)

        response = self.execute_graphql(
            self.OPERATOR_SHELTERS_QUERY,
            variables={"orgIds": [str(self.org_2.id)], "offset": 0, "limit": 10},
        )

        payload = response["data"]["operatorShelters"]
        self.assertEqual(payload["totalCount"], 1)
        self.assertEqual(payload["results"][0]["id"], str(org_2_shelter.id))

    def test_operator_shelters_returns_all_accessible_orgs_when_no_filter(self) -> None:
        """Without an org filter, returns shelters for all orgs the user belongs to."""
        self.graphql_client.force_login(self.org_1_case_manager_1)
        shelter_2 = shelter_recipe.make(organization=self.org_1)

        response = self.execute_graphql(
            self.OPERATOR_SHELTERS_QUERY,
            variables={"offset": 0, "limit": 10},
        )

        payload = response["data"]["operatorShelters"]
        # org_1_case_manager_1 belongs to org_1 only
        self.assertEqual(payload["totalCount"], 2)
        returned_ids = {r["id"] for r in payload["results"]}
        self.assertSetEqual(
            returned_ids,
            {str(self.shelter.id), str(shelter_2.id)},
        )

    def test_operator_shelters_excludes_non_member_org(self) -> None:
        """Filtering by an org the user doesn't belong to returns empty results."""
        self.graphql_client.force_login(self.org_1_case_manager_1)

        response = self.execute_graphql(
            self.OPERATOR_SHELTERS_QUERY,
            variables={"orgIds": [str(self.org_2.id)], "offset": 0, "limit": 10},
        )

        payload = response["data"]["operatorShelters"]
        self.assertEqual(payload["totalCount"], 0)
        self.assertEqual(payload["results"], [])

    def test_operator_shelters_multi_org_membership_alone_does_not_extend_reach(self) -> None:
        """Membership in a second org does not surface its shelters without a VIEW grant.

        Reads are reach-scoped (``visible()``) and org-narrowed by the query's
        ``filters`` variable — never by membership alone.
        """
        self.org_2.add_user(self.org_1_case_manager_1)
        self.graphql_client.force_login(self.org_1_case_manager_1)
        shelter_2 = shelter_recipe.make(organization=self.org_1)

        response = self.execute_graphql(
            self.OPERATOR_SHELTERS_QUERY,
            variables={"offset": 0, "limit": 10},
        )

        payload = response["data"]["operatorShelters"]
        self.assertEqual(payload["totalCount"], 2)
        returned_ids = {r["id"] for r in payload["results"]}
        self.assertSetEqual(
            returned_ids,
            {str(self.shelter.id), str(shelter_2.id)},
        )

    def test_operator_shelters_multi_org_user_reach_spans_orgs(self) -> None:
        """A multi-org user with VIEW grants sees both orgs' shelters.

        The org view comes from the query's ``filters.organizations`` variable.
        """
        from accounts.role_manager import OrgRoleManager
        from notes.groups import CASEWORKER

        self.org_2.add_user(self.org_1_case_manager_1)
        OrgRoleManager(self.org_2).add_roles(self.org_1_case_manager_1, CASEWORKER)

        # Grant view_shelter in org_2 via a Role+Grant (ADR 0001).
        self._grant_permission(self.org_1_case_manager_1, Shelter.perms.VIEW, self.org_2)

        self.graphql_client.force_login(self.org_1_case_manager_1)
        org_2_shelter = shelter_recipe.make(organization=self.org_2)

        # No filter → all reachable orgs' shelters.
        response = self.execute_graphql(
            self.OPERATOR_SHELTERS_QUERY,
            variables={"offset": 0, "limit": 10},
        )
        payload = response["data"]["operatorShelters"]
        self.assertEqual(payload["totalCount"], 2)
        returned_ids = {r["id"] for r in payload["results"]}
        self.assertSetEqual(returned_ids, {str(self.shelter.id), str(org_2_shelter.id)})

        # Org view: the filters variable narrows to org_2.
        response = self.execute_graphql(
            self.OPERATOR_SHELTERS_QUERY,
            variables={"orgIds": [str(self.org_2.id)], "offset": 0, "limit": 10},
        )
        payload = response["data"]["operatorShelters"]
        self.assertEqual(payload["totalCount"], 1)
        self.assertEqual(payload["results"][0]["id"], str(org_2_shelter.id))

    def test_operator_shelters_org_filter_narrows_multi_org_reach(self) -> None:
        """``filters.organizations`` narrows a reach-scoped read to one org.

        The user can reach both orgs, but the query variable is the org view:
        filtering org_2 returns only org_2's shelter.
        """
        from accounts.role_manager import OrgRoleManager
        from notes.groups import CASEWORKER

        self.org_2.add_user(self.org_1_case_manager_1)
        OrgRoleManager(self.org_2).add_roles(self.org_1_case_manager_1, CASEWORKER)
        self._grant_permission(self.org_1_case_manager_1, Shelter.perms.VIEW, self.org_2)

        self.graphql_client.force_login(self.org_1_case_manager_1)
        org_2_shelter = shelter_recipe.make(organization=self.org_2)

        response = self.execute_graphql(
            self.OPERATOR_SHELTERS_QUERY,
            variables={"orgIds": [str(self.org_2.id)], "offset": 0, "limit": 10},
        )

        payload = response["data"]["operatorShelters"]
        self.assertEqual(payload["totalCount"], 1)
        self.assertEqual(payload["results"][0]["id"], str(org_2_shelter.id))

    def test_operator_shelters_unauthenticated(self) -> None:
        """Unauthenticated requests are rejected."""
        self.graphql_client.logout()

        response = self.execute_graphql(
            self.OPERATOR_SHELTERS_QUERY,
            variables={"offset": 0, "limit": 10},
        )

        self.assertGraphQLUnauthenticated(response)

    def test_operator_shelters_without_permission(self) -> None:
        """Users without shelter view permission get an empty result (fail-closed)."""
        self.graphql_client.force_login(self.non_case_manager_user)

        response = self.execute_graphql(
            self.OPERATOR_SHELTERS_QUERY,
            variables={"offset": 0, "limit": 10},
        )

        self.assertIsNone(response.get("errors"))
        payload = response["data"]["operatorShelters"]
        self.assertEqual(payload["totalCount"], 0)
        self.assertEqual(payload["results"], [])

    def test_operator_shelters_filter_by_name(self) -> None:
        """Name filter returns only shelters whose name matches (case-insensitive)."""
        self.graphql_client.force_login(self.org_1_case_manager_1)
        self.shelter.name = "Safe Haven"
        self.shelter.save()

        query = """
            query OperatorShelters($orgIds: [ID!], $name: String) {
                operatorShelters(
                    filters: { organizations: $orgIds, name: $name }
                ) {
                    totalCount
                    results { id name }
                }
            }
        """
        response = self.execute_graphql(
            query,
            variables={"orgIds": [str(self.org_1.id)], "name": "safe haven"},
        )

        payload = response["data"]["operatorShelters"]
        self.assertEqual(payload["totalCount"], 1)
        self.assertEqual(payload["results"][0]["id"], str(self.shelter.id))
        self.assertEqual(payload["results"][0]["name"], "Safe Haven")

    def test_operator_shelters_filter_by_properties(self) -> None:
        """Property filters narrow results through the operator endpoint."""
        self.graphql_client.force_login(self.org_1_case_manager_1)
        shelter_2 = shelter_recipe.make(organization=self.org_1)

        pet_cats, _ = Pet.objects.get_or_create(name=PetChoices.CATS)
        self.shelter.pets.set([pet_cats])
        shelter_2.pets.clear()

        query = """
            query OperatorShelters($orgIds: [ID!], $properties: ShelterPropertyInput) {
                operatorShelters(
                    filters: { organizations: $orgIds, properties: $properties }
                ) {
                    totalCount
                    results { id }
                }
            }
        """
        response = self.execute_graphql(
            query,
            variables={
                "orgIds": [str(self.org_1.id)],
                "properties": {"pets": [PetChoices.CATS.name]},
            },
        )

        payload = response["data"]["operatorShelters"]
        self.assertEqual(payload["totalCount"], 1)
        self.assertEqual(payload["results"][0]["id"], str(self.shelter.id))

    def test_operator_shelters_beds_by_status(self) -> None:
        """Bed counts are returned grouped by status."""
        self.graphql_client.force_login(self.org_1_case_manager_1)
        shelter = self.shelter

        baker.make(Bed, shelter=shelter, maintenance_flag=True)
        # Create a bed in turnaround: old last_cleaned with a completed reservation after it
        turnaround_bed = baker.make(
            Bed, shelter=shelter, last_cleaned=datetime.datetime(2020, 1, 1, tzinfo=datetime.timezone.utc)
        )
        baker.make(
            Reservation,
            bed=turnaround_bed,
            status=ReservationStatusChoices.COMPLETED,
            checked_out_at=datetime.datetime.now(datetime.timezone.utc),
        )
        baker.make(Bed, shelter=shelter)
        unavailable_beds = baker.make(Bed, shelter=shelter, _quantity=3)

        for pair in zip(unavailable_beds, ACTIVE_RESERVATION_STATUSES):
            baker.make(Reservation, bed=pair[0], status=pair[1])

        query = """
            query OperatorShelters($orgIds: [ID!]) {
                operatorShelters(filters: { organizations: $orgIds }) {
                    results {
                        id
                        bedCounts {
                            available
                            inTurnaround
                            occupied
                            outOfService
                            reserved
                            total
                        }
                    }
                }
            }
        """
        expected_query_count = 5
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables={"orgIds": [str(self.org_1.id)]})
        results = response["data"]["operatorShelters"]["results"]
        shelter_data = next(r for r in results if r["id"] == str(shelter.id))
        self.assertEqual(
            shelter_data["bedCounts"],
            {"available": 1, "occupied": 1, "reserved": 2, "outOfService": 1, "inTurnaround": 1, "total": 6},
        )

    def test_operator_shelters_beds_by_status_no_beds(self) -> None:
        """Shelter with no beds returns all zeros for beds by status."""
        self.graphql_client.force_login(self.org_1_case_manager_1)

        query = """
            query OperatorShelters($orgIds: [ID!]) {
                operatorShelters(filters: { organizations: $orgIds }) {
                    results {
                        id
                        bedCounts {
                            available
                            inTurnaround
                            occupied
                            outOfService
                            reserved
                            total
                        }
                    }
                }
            }
        """
        expected_query_count = 5
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables={"orgIds": [str(self.org_1.id)]})
        results = response["data"]["operatorShelters"]["results"]
        for result in results:
            self.assertEqual(
                result["bedCounts"],
                {"available": 0, "occupied": 0, "reserved": 0, "outOfService": 0, "inTurnaround": 0, "total": 0},
            )


class OperatorShelterPropertyFilterTestCase(GraphQLBaseTestCase, ParametrizedTestCase):
    """Tests for the `properties` filter on operatorShelters."""

    OPERATOR_SHELTERS_PROPERTY_QUERY = """
        query OperatorSheltersByProperty(
            $organizationId: ID!
            $properties: ShelterPropertyInput
        ) {
            operatorShelters(
                filters: {
                    organizations: [$organizationId]
                    properties: $properties
                }
                ordering: [{ createdAt: DESC }]
            ) {
                totalCount
                results { id }
            }
        }
    """

    def setUp(self) -> None:
        super().setUp()

        # HasOrgPerm checks org-scoped permissions, not global Django perms.
        # Grant view_shelter via a Role+Grant (ADR 0001).
        self._grant_permission(self.org_1_case_manager_1, Shelter.perms.VIEW, self.org_1)

        self.graphql_client.force_login(self.org_1_case_manager_1)

        # Shelters A & B: SINGLE_MEN, VETERANS, BUILDING, SPA ONE
        for _ in range(2):
            shelter_recipe.make(
                organization=self.org_1,
                demographics=[Demographic.objects.get_or_create(name=DemographicChoices.SINGLE_MEN)[0]],
                special_situation_restrictions=[
                    SpecialSituationRestriction.objects.get_or_create(name=SpecialSituationRestrictionChoices.VETERANS)[
                        0
                    ]
                ],
                shelter_types=[ShelterType.objects.get_or_create(name=ShelterTypeChoices.BUILDING)[0]],
            )
        # Shelter C: FAMILIES, HIV_AIDS, TINY_HOMES, SPA TWO
        shelter_recipe.make(
            organization=self.org_1,
            demographics=[Demographic.objects.get_or_create(name=DemographicChoices.FAMILIES)[0]],
            special_situation_restrictions=[
                SpecialSituationRestriction.objects.get_or_create(name=SpecialSituationRestrictionChoices.HIV_AIDS)[0]
            ],
            shelter_types=[ShelterType.objects.get_or_create(name=ShelterTypeChoices.TINY_HOMES)[0]],
        )

    def _query(self, properties: dict[str, Any]) -> list[dict[Any, Any]]:
        response = self.execute_graphql(
            self.OPERATOR_SHELTERS_PROPERTY_QUERY,
            variables={"organizationId": str(self.org_1.pk), "properties": properties},
        )
        self.assertIsNone(response.get("errors"))
        return cast(list[dict[Any, Any]], response["data"]["operatorShelters"]["results"])

    @parametrize(
        "properties, expected_count",
        [
            ({"demographics": [DemographicChoices.SINGLE_MEN.name]}, 2),
            ({"demographics": [DemographicChoices.FAMILIES.name]}, 1),
            ({"demographics": [DemographicChoices.SINGLE_MEN.name, DemographicChoices.FAMILIES.name]}, 3),
        ],
    )
    def test_demographics_filter(self, properties: dict[str, Any], expected_count: int) -> None:
        self.assertEqual(len(self._query(properties)), expected_count)

    @parametrize(
        "properties, expected_count",
        [
            ({"specialSituationRestrictions": [SpecialSituationRestrictionChoices.VETERANS.name]}, 2),
            ({"specialSituationRestrictions": [SpecialSituationRestrictionChoices.HIV_AIDS.name]}, 1),
        ],
    )
    def test_special_situation_restrictions_filter(self, properties: dict[str, Any], expected_count: int) -> None:
        self.assertEqual(len(self._query(properties)), expected_count)

    @parametrize(
        "properties, expected_count",
        [
            ({"shelterTypes": [ShelterTypeChoices.BUILDING.name]}, 2),
            ({"shelterTypes": [ShelterTypeChoices.TINY_HOMES.name]}, 1),
        ],
    )
    def test_shelter_types_filter(self, properties: dict[str, Any], expected_count: int) -> None:
        self.assertEqual(len(self._query(properties)), expected_count)

    def test_combined_properties_filter(self) -> None:
        results = self._query(
            {
                "demographics": [DemographicChoices.SINGLE_MEN.name],
                "shelterTypes": [ShelterTypeChoices.BUILDING.name],
            }
        )
        self.assertEqual(len(results), 2)


class OperatorShelterPermissionTestCase(GraphQLBaseTestCase):
    """operatorShelter(s) are gated on Shelter.perms.VIEW.

    Org membership alone is not enough — the caller needs a grant carrying
    ``shelters.view_shelter`` (ADR 0001). Without it the list fails closed
    (empty) and the single-object query reports not-found.
    """

    LIST_QUERY = """
        query OperatorShelters($orgIds: [ID!]) {
            operatorShelters(filters: { organizations: $orgIds }) {
                totalCount
                results { id name }
            }
        }
    """

    SINGLE_QUERY = """
        query OperatorShelter($pk: ID!) {
            operatorShelter(pk: $pk) { id name }
        }
    """

    def setUp(self) -> None:
        super().setUp()
        self.shelter = shelter_recipe.make(organization=self.org_1, name="Permission Gated Shelter")
        # org_1 member with the CASEWORKER role only — no shelter VIEW grant.
        self.graphql_client.force_login(self.org_1_case_manager_1)

    def test_list_without_view_permission_is_empty(self) -> None:
        response = self.execute_graphql(self.LIST_QUERY, {"orgIds": [str(self.org_1.pk)]})

        self.assertIsNone(response.get("errors"))
        payload = response["data"]["operatorShelters"]
        self.assertEqual(payload["totalCount"], 0)
        self.assertEqual(payload["results"], [])

    def test_list_with_view_permission_returns_shelters(self) -> None:
        self._grant_permission(self.org_1_case_manager_1, Shelter.perms.VIEW, self.org_1)

        response = self.execute_graphql(self.LIST_QUERY, {"orgIds": [str(self.org_1.pk)]})

        self.assertIsNone(response.get("errors"))
        payload = response["data"]["operatorShelters"]
        self.assertEqual(payload["totalCount"], 1)
        self.assertEqual(payload["results"][0]["id"], str(self.shelter.pk))

    def test_single_without_view_permission_is_not_found(self) -> None:
        response = self.execute_graphql(self.SINGLE_QUERY, {"pk": str(self.shelter.pk)})

        self.assertIsNotNone(response.get("errors"))

    def test_single_with_view_permission_returns_shelter(self) -> None:
        self._grant_permission(self.org_1_case_manager_1, Shelter.perms.VIEW, self.org_1)

        response = self.execute_graphql(self.SINGLE_QUERY, {"pk": str(self.shelter.pk)})

        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["operatorShelter"]["id"], str(self.shelter.pk))


class OperatorShelterAdditionalContactsTestCase(GraphQLBaseTestCase):
    """additionalContacts on operatorShelter is gated by ffShelterOperatorBaOnlyFields."""

    ADDITIONAL_CONTACTS_QUERY = """
        query OperatorShelter($pk: ID!) {
            operatorShelter(pk: $pk) {
                id
                additionalContacts {
                    id
                    contactName
                    contactNumber
                    contactEmail
                    contactTitle
                    isClaimant
                }
            }
        }
    """

    def setUp(self) -> None:
        super().setUp()
        self._grant_permission(self.org_1_case_manager_1, Shelter.perms.VIEW, self.org_1)
        self.graphql_client.force_login(self.org_1_case_manager_1)
        self.shelter = shelter_recipe.make(organization=self.org_1)
        ContactInfo.objects.create(
            shelter=self.shelter,
            contact_name="Ada",
            contact_number="2125550100",
            contact_email="ada@example.org",
            contact_title="Director",
            is_claimant=True,
        )

    def _query(self) -> dict:
        return self.execute_graphql(self.ADDITIONAL_CONTACTS_QUERY, {"pk": str(self.shelter.pk)})

    @override_flag(BA_ADMIN_ONLY_FIELDS_FLAG, active=False)
    def test_additional_contacts_hidden_when_flag_off(self) -> None:
        response = self._query()
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["operatorShelter"]["additionalContacts"], [])

    @override_flag(BA_ADMIN_ONLY_FIELDS_FLAG, active=True)
    def test_additional_contacts_visible_when_flag_on(self) -> None:
        response = self._query()

        self.assertIsNone(response.get("errors"))
        contacts = response["data"]["operatorShelter"]["additionalContacts"]
        self.assertEqual(len(contacts), 1)
        self.assertEqual(contacts[0]["contactName"], "Ada")
        self.assertEqual(contacts[0]["contactEmail"], "ada@example.org")
        self.assertEqual(contacts[0]["contactTitle"], "Director")
        self.assertTrue(contacts[0]["isClaimant"])
