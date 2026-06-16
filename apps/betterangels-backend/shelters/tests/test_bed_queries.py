from accounts.tests.baker_recipes import organization_recipe
from django.test import TestCase
from shelters.enums import BedStatusChoices, BedTypeChoices, StatusChoices
from shelters.models import Bed, Room
from shelters.tests.baker_recipes import shelter_recipe
from shelters.tests.utils import ShelterTestCase


class BedQueriesTestCase(ShelterTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.operator)
        self.shelter = shelter_recipe.make(
            organization=self.org,
            status=StatusChoices.APPROVED,
            is_private=False,
        )
        self.room = Room.objects.create(shelter=self.shelter, name="Room-101")
        self.bed = Bed.objects.create(
            shelter=self.shelter,
            room=self.room,
            name="Bed-1",
            status=BedStatusChoices.AVAILABLE,
            type=BedTypeChoices.TWIN,
            fees=25,
            storage=True,
        )

        self.bed_query = f"""
            query ($id: ID!) {{
                bed(pk: $id) {{
                    {self.bed_fields}
                }}
            }}
        """

        self.beds_query = f"""
            query ($filters: BedFilter, $pagination: OffsetPaginationInput) {{
                beds(filters: $filters, pagination: $pagination) {{
                    totalCount
                    pageInfo {{
                        offset
                        limit
                    }}
                    results {{
                        {self.bed_fields}
                    }}
                }}
            }}
        """


class BedQueryTestCase(BedQueriesTestCase):
    def test_bed_query(self) -> None:
        expected_query_count = 12
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.bed_query, variables={"id": str(self.bed.pk)})
        self.assertIsNone(response.get("errors"))

        bed = response["data"]["bed"]
        self.assertEqual(bed["id"], str(self.bed.pk))
        self.assertEqual(bed["b7"], False)
        self.assertEqual(bed["fees"], 25)
        self.assertEqual(bed["lastCleanedInspected"], None)
        self.assertEqual(bed["maintenanceFlag"], False)
        self.assertEqual(bed["name"], "Bed-1")
        self.assertEqual(bed["status"], BedStatusChoices.AVAILABLE.name)
        self.assertEqual(bed["statusNotes"], None)
        self.assertEqual(bed["storage"], True)
        self.assertEqual(bed["type"], BedTypeChoices.TWIN.name)
        self.assertEqual(bed["accessibility"], [])
        self.assertEqual(bed["demographics"], [])
        self.assertEqual(bed["funders"], [])
        self.assertEqual(bed["medicalNeeds"], [])
        self.assertEqual(bed["pets"], [])
        self.assertEqual(bed["room"], {"id": str(self.room.pk)})
        self.assertEqual(bed["shelter"], {"id": str(self.shelter.pk)})


class BedsQueryTestCase(BedQueriesTestCase):
    def test_beds_query_returns_org_beds(self) -> None:
        expected_query_count = 13
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.beds_query, variables={"pagination": {"offset": 0, "limit": 10}})
        self.assertIsNone(response.get("errors"))

        payload = response["data"]["beds"]
        self.assertEqual(payload["totalCount"], 1)

        bed = payload["results"][0]
        self.assertEqual(bed["id"], str(self.bed.pk))
        self.assertEqual(bed["b7"], False)
        self.assertEqual(bed["fees"], 25)
        self.assertEqual(bed["lastCleanedInspected"], None)
        self.assertEqual(bed["maintenanceFlag"], False)
        self.assertEqual(bed["name"], "Bed-1")
        self.assertEqual(bed["status"], BedStatusChoices.AVAILABLE.name)
        self.assertEqual(bed["statusNotes"], None)
        self.assertEqual(bed["storage"], True)
        self.assertEqual(bed["type"], BedTypeChoices.TWIN.name)
        self.assertEqual(bed["accessibility"], [])
        self.assertEqual(bed["demographics"], [])
        self.assertEqual(bed["funders"], [])
        self.assertEqual(bed["medicalNeeds"], [])
        self.assertEqual(bed["pets"], [])
        self.assertEqual(bed["room"], {"id": str(self.room.pk)})
        self.assertEqual(bed["shelter"], {"id": str(self.shelter.pk)})

    def test_beds_query_filters_by_shelter_id(self) -> None:
        other_shelter = shelter_recipe.make(organization=self.org)
        other_bed = Bed.objects.create(shelter=other_shelter, name="Bed-2")

        expected_query_count = 13
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.beds_query,
                variables={
                    "filters": {"shelterId": str(self.shelter.pk)},
                    "pagination": {"offset": 0, "limit": 10},
                },
            )

        self.assertIsNone(response.get("errors"))
        payload = response["data"]["beds"]
        self.assertEqual(payload["totalCount"], 1)
        self.assertEqual(payload["results"][0]["id"], str(self.bed.pk))
        self.assertNotIn(str(other_bed.pk), [bed["id"] for bed in payload["results"]])

    def test_beds_query_filters_by_status(self) -> None:
        reserved_bed = Bed.objects.create(
            shelter=self.shelter,
            name="Bed-2",
            status=BedStatusChoices.RESERVED,
        )

        expected_query_count = 12
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.beds_query,
                variables={
                    "filters": {"status": [BedStatusChoices.RESERVED.name]},
                    "pagination": {"offset": 0, "limit": 10},
                },
            )

        self.assertIsNone(response.get("errors"))
        payload = response["data"]["beds"]
        self.assertEqual(payload["totalCount"], 1)
        self.assertEqual(payload["results"][0]["id"], str(reserved_bed.pk))

    def test_beds_query_filters_by_type(self) -> None:
        bunk_bed = Bed.objects.create(
            shelter=self.shelter,
            name="Bed-3",
            type=BedTypeChoices.BUNK,
        )

        expected_query_count = 12
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.beds_query,
                variables={
                    "filters": {"type": [BedTypeChoices.BUNK.name]},
                    "pagination": {"offset": 0, "limit": 10},
                },
            )

        self.assertIsNone(response.get("errors"))
        payload = response["data"]["beds"]
        self.assertEqual(payload["totalCount"], 1)
        self.assertEqual(payload["results"][0]["id"], str(bunk_bed.pk))

    def test_beds_query_excludes_other_org_beds(self) -> None:
        other_org = organization_recipe.make()
        other_shelter = shelter_recipe.make(organization=other_org)
        Bed.objects.create(shelter=other_shelter, name="Other-Bed")

        expected_query_count = 13
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.beds_query, variables={"pagination": {"offset": 0, "limit": 10}})

        self.assertIsNone(response.get("errors"))
        payload = response["data"]["beds"]
        self.assertEqual(payload["totalCount"], 1)
        self.assertEqual(payload["results"][0]["id"], str(self.bed.pk))

    def test_beds_query_without_permission_returns_empty(self) -> None:
        self.operator.user_permissions.clear()

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.beds_query, variables={"pagination": {"offset": 0, "limit": 10}})

        payload = response["data"]["beds"]
        self.assertEqual(payload["totalCount"], 0)
        self.assertEqual(payload["results"], [])

    def test_beds_query_unauthenticated(self) -> None:
        self.graphql_client.logout()

        expected_query_count = 1
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.beds_query, variables={"pagination": {"offset": 0, "limit": 10}})

        self.assertGraphQLUnauthenticated(response)
