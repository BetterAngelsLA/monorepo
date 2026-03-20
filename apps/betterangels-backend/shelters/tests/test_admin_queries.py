from datetime import timedelta

from common.tests.utils import GraphQLBaseTestCase
from django.contrib.auth.models import Permission
from django.utils import timezone
from shelters.enums import BedStatusChoices
from shelters.models import Bed
from shelters.permissions import ShelterPermissions
from shelters.tests.baker_recipes import shelter_recipe


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

    def test_admin_shelters_bed_capacity(self) -> None:
        """Bed capacity counts are returned grouped by status."""
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
                        bedCapacity {
                            available
                            occupied
                            reserved
                            outOfService
                        }
                    }
                }
            }
        """
        response = self.execute_graphql(query, variables={"orgIds": [str(self.org_1.id)]})
        results = response["data"]["adminShelters"]["results"]
        shelter_data = next(r for r in results if r["id"] == str(shelter.id))
        self.assertEqual(
            shelter_data["bedCapacity"],
            {"available": 2, "occupied": 1, "reserved": 1, "outOfService": 1},
        )

    def test_admin_shelters_bed_capacity_no_beds(self) -> None:
        """Shelter with no beds returns all zeros for bed capacity."""
        self.graphql_client.force_login(self.org_1_case_manager_1)

        query = """
            query AdminShelters($orgIds: [ID!]) {
                adminShelters(filters: { organizations: $orgIds }) {
                    results {
                        id
                        bedCapacity {
                            available
                            occupied
                            reserved
                            outOfService
                        }
                    }
                }
            }
        """
        response = self.execute_graphql(query, variables={"orgIds": [str(self.org_1.id)]})
        results = response["data"]["adminShelters"]["results"]
        for result in results:
            self.assertEqual(
                result["bedCapacity"],
                {"available": 0, "occupied": 0, "reserved": 0, "outOfService": 0},
            )
