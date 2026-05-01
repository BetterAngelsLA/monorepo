from datetime import timedelta
from typing import Any, cast

from common.tests.utils import GraphQLBaseTestCase
from django.contrib.auth.models import Permission
from django.utils import timezone
from shelters.enums import BedStatusChoices, DemographicChoices, PetChoices
from shelters.enums import ShelterChoices as ShelterTypeChoices
from shelters.enums import SPAChoices, SpecialSituationRestrictionChoices
from shelters.models import SPA, Bed, Demographic, Pet, ShelterType, SpecialSituationRestriction
from shelters.permissions import ShelterPermissions
from shelters.tests.baker_recipes import shelter_recipe
from unittest_parametrize import ParametrizedTestCase, parametrize


class AdminShelterQueryTestCase(GraphQLBaseTestCase):
    ADMIN_SHELTERS_QUERY = """
        query AdminShelters($orgIds: [ID!], $offset: Int, $limit: Int) {
            adminShelters(
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
        self._create_shelters()

    def _add_shelter_view_permission(self) -> None:
        app_label, codename = ShelterPermissions.VIEW.value.split(".")
        perm = Permission.objects.get(codename=codename, content_type__app_label=app_label)
        self.org_1_case_manager_1.user_permissions.add(perm)
        self.org_1_case_manager_2.user_permissions.add(perm)
        self.org_2_case_manager_1.user_permissions.add(perm)

    def _create_shelters(self) -> None:
        self.org_1_shelter_older = shelter_recipe.make(
            organization=self.org_1,
            created_at=timezone.now() - timedelta(minutes=1),
        )
        self.org_1_shelter_newer = shelter_recipe.make(
            organization=self.org_1,
            created_at=timezone.now(),
        )
        self.org_2_shelter = shelter_recipe.make(organization=self.org_2)

    def test_admin_shelters_filter_by_organization(self) -> None:
        """Only shelters for the specified organization are returned."""
        self.graphql_client.force_login(self.org_1_case_manager_1)

        response = self.execute_graphql(
            self.ADMIN_SHELTERS_QUERY,
            variables={"orgIds": [str(self.org_1.id)], "offset": 0, "limit": 10},
        )

        payload = response["data"]["adminShelters"]
        self.assertEqual(payload["totalCount"], 2)
        self.assertEqual(len(payload["results"]), 2)
        self.assertEqual(payload["results"][0]["id"], str(self.org_1_shelter_newer.id))
        self.assertEqual(payload["results"][1]["id"], str(self.org_1_shelter_older.id))
        self.assertEqual(payload["pageInfo"], {"offset": 0, "limit": 10})

    def test_admin_shelters_returns_all_accessible_orgs_when_no_filter(self) -> None:
        """Without an org filter, returns shelters for all orgs the user belongs to."""
        self.graphql_client.force_login(self.org_1_case_manager_1)

        response = self.execute_graphql(
            self.ADMIN_SHELTERS_QUERY,
            variables={"offset": 0, "limit": 10},
        )

        payload = response["data"]["adminShelters"]
        # org_1_case_manager_1 belongs to org_1 only
        self.assertEqual(payload["totalCount"], 2)
        returned_ids = {r["id"] for r in payload["results"]}
        self.assertSetEqual(
            returned_ids,
            {str(self.org_1_shelter_older.id), str(self.org_1_shelter_newer.id)},
        )

    def test_admin_shelters_excludes_non_member_org(self) -> None:
        """Filtering by an org the user doesn't belong to returns empty results."""
        self.graphql_client.force_login(self.org_1_case_manager_1)

        response = self.execute_graphql(
            self.ADMIN_SHELTERS_QUERY,
            variables={"orgIds": [str(self.org_2.id)], "offset": 0, "limit": 10},
        )

        payload = response["data"]["adminShelters"]
        self.assertEqual(payload["totalCount"], 0)
        self.assertEqual(payload["results"], [])

    def test_admin_shelters_multi_org_user_sees_all_member_orgs(self) -> None:
        """A user belonging to multiple orgs sees shelters from all of them."""
        # org_1_case_manager_1 belongs only to org_1; add them to org_2 as well
        self.org_2.add_user(self.org_1_case_manager_1)
        self.graphql_client.force_login(self.org_1_case_manager_1)

        response = self.execute_graphql(
            self.ADMIN_SHELTERS_QUERY,
            variables={"offset": 0, "limit": 10},
        )

        payload = response["data"]["adminShelters"]
        self.assertEqual(payload["totalCount"], 3)
        returned_ids = {r["id"] for r in payload["results"]}
        self.assertSetEqual(
            returned_ids,
            {
                str(self.org_1_shelter_older.id),
                str(self.org_1_shelter_newer.id),
                str(self.org_2_shelter.id),
            },
        )

    def test_admin_shelters_unauthenticated(self) -> None:
        """Unauthenticated requests are rejected."""
        self.graphql_client.logout()

        response = self.execute_graphql(
            self.ADMIN_SHELTERS_QUERY,
            variables={"offset": 0, "limit": 10},
        )

        self.assertGraphQLUnauthenticated(response)

    def test_admin_shelters_without_permission(self) -> None:
        """Users without shelter view permission see no results (HasPerm filters silently)."""
        self.graphql_client.force_login(self.non_case_manager_user)

        response = self.execute_graphql(
            self.ADMIN_SHELTERS_QUERY,
            variables={"offset": 0, "limit": 10},
        )

        payload = response["data"]["adminShelters"]
        self.assertEqual(payload["totalCount"], 0)
        self.assertEqual(payload["results"], [])

    def test_admin_shelters_filter_by_name(self) -> None:
        """Name filter returns only shelters whose name matches (case-insensitive)."""
        self.graphql_client.force_login(self.org_1_case_manager_1)
        self.org_1_shelter_newer.name = "Safe Haven"
        self.org_1_shelter_newer.save()

        query = """
            query AdminShelters($orgIds: [ID!], $name: String) {
                adminShelters(
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

        payload = response["data"]["adminShelters"]
        self.assertEqual(payload["totalCount"], 1)
        self.assertEqual(payload["results"][0]["id"], str(self.org_1_shelter_newer.id))
        self.assertEqual(payload["results"][0]["name"], "Safe Haven")

    def test_admin_shelters_filter_by_properties(self) -> None:
        """Property filters narrow results through the admin endpoint."""
        self.graphql_client.force_login(self.org_1_case_manager_1)

        pet_cats, _ = Pet.objects.get_or_create(name=PetChoices.CATS)
        self.org_1_shelter_newer.pets.set([pet_cats])
        self.org_1_shelter_older.pets.clear()

        query = """
            query AdminShelters($orgIds: [ID!], $properties: ShelterPropertyInput) {
                adminShelters(
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

        payload = response["data"]["adminShelters"]
        self.assertEqual(payload["totalCount"], 1)
        self.assertEqual(payload["results"][0]["id"], str(self.org_1_shelter_newer.id))

    def test_admin_shelters_beds_by_status(self) -> None:
        """Bed counts are returned grouped by status."""
        self.graphql_client.force_login(self.org_1_case_manager_1)
        shelter = self.org_1_shelter_newer

        Bed.objects.create(shelter=shelter, status=BedStatusChoices.AVAILABLE)
        Bed.objects.create(shelter=shelter, status=BedStatusChoices.AVAILABLE)
        Bed.objects.create(shelter=shelter, status=BedStatusChoices.OCCUPIED)
        Bed.objects.create(shelter=shelter, status=BedStatusChoices.RESERVED)
        Bed.objects.create(shelter=shelter, status=BedStatusChoices.OUT_OF_SERVICE)

        query = """
            query AdminShelters($orgIds: [ID!]) {
                adminShelters(filters: { organizations: $orgIds }) {
                    results {
                        id
                        bedsByStatus {
                            available
                            occupied
                            reserved
                            outOfService
                        }
                    }
                }
            }
        """
        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables={"orgIds": [str(self.org_1.id)]})
        results = response["data"]["adminShelters"]["results"]
        shelter_data = next(r for r in results if r["id"] == str(shelter.id))
        self.assertEqual(
            shelter_data["bedsByStatus"],
            {"available": 2, "occupied": 1, "reserved": 1, "outOfService": 1},
        )

    def test_admin_shelters_beds_by_status_no_beds(self) -> None:
        """Shelter with no beds returns all zeros for beds by status."""
        self.graphql_client.force_login(self.org_1_case_manager_1)

        query = """
            query AdminShelters($orgIds: [ID!]) {
                adminShelters(filters: { organizations: $orgIds }) {
                    results {
                        id
                        bedsByStatus {
                            available
                            occupied
                            reserved
                            outOfService
                        }
                    }
                }
            }
        """
        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables={"orgIds": [str(self.org_1.id)]})
        results = response["data"]["adminShelters"]["results"]
        for result in results:
            self.assertEqual(
                result["bedsByStatus"],
                {"available": 0, "occupied": 0, "reserved": 0, "outOfService": 0},
            )


class AdminShelterPropertyFilterTestCase(GraphQLBaseTestCase, ParametrizedTestCase):
    """Tests for the `properties` filter in ViewSheltersByOrganization (adminShelters)."""

    VIEW_SHELTERS_BY_ORGANIZATION_QUERY = """
        query ViewSheltersByOrganization(
            $organizationId: ID!
            $properties: ShelterPropertyInput
        ) {
            adminShelters(
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
        app_label, codename = ShelterPermissions.VIEW.value.split(".")
        perm = Permission.objects.get(codename=codename, content_type__app_label=app_label)
        self.org_1_case_manager_1.user_permissions.add(perm)
        self.graphql_client.force_login(self.org_1_case_manager_1)

        spa_one = SPA.objects.get_or_create(name=SPAChoices.ONE)[0]
        spa_two = SPA.objects.get_or_create(name=SPAChoices.TWO)[0]

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
                spa=spa_one,
            )
        # Shelter C: FAMILIES, HIV_AIDS, TINY_HOMES, SPA TWO
        shelter_recipe.make(
            organization=self.org_1,
            demographics=[Demographic.objects.get_or_create(name=DemographicChoices.FAMILIES)[0]],
            special_situation_restrictions=[
                SpecialSituationRestriction.objects.get_or_create(name=SpecialSituationRestrictionChoices.HIV_AIDS)[0]
            ],
            shelter_types=[ShelterType.objects.get_or_create(name=ShelterTypeChoices.TINY_HOMES)[0]],
            spa=spa_two,
        )

    def _query(self, properties: dict[str, Any]) -> list[dict[Any, Any]]:
        response = self.execute_graphql(
            self.VIEW_SHELTERS_BY_ORGANIZATION_QUERY,
            variables={"organizationId": str(self.org_1.pk), "properties": properties},
        )
        self.assertIsNone(response.get("errors"))
        return cast(list[dict[Any, Any]], response["data"]["adminShelters"]["results"])

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

    @parametrize(
        "properties, expected_count",
        [
            ({"spa": SPAChoices.ONE.name}, 2),
            ({"spa": SPAChoices.TWO.name}, 1),
        ],
    )
    def test_spa_filter(self, properties: dict[str, Any], expected_count: int) -> None:
        self.assertEqual(len(self._query(properties)), expected_count)

    def test_combined_properties_filter(self) -> None:
        results = self._query(
            {
                "demographics": [DemographicChoices.SINGLE_MEN.name],
                "shelterTypes": [ShelterTypeChoices.BUILDING.name],
            }
        )
        self.assertEqual(len(results), 2)
