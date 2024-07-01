from django.contrib.gis.geos import Point
from django.test import TestCase
from model_bakery import baker
from organizations.models import Organization
from shelters.models import (
    Funder,
    Location,
    Population,
    Requirement,
    Service,
    Shelter,
    ShelterType,
)
from test_utils.mixins import GraphQLTestCaseMixin


class ShelterQueryTestCase(GraphQLTestCaseMixin, TestCase):
    def setUp(self) -> None:
        super().setUp()

        # Use model_bakery to create Shelter with associated Location in one go
        self.shelter1 = baker.make(
            Shelter,
            title="Shelter-1",
            organization=baker.make(Organization, name="Organization-1", slug="organization_1"),
            email="shelter1@test.com",
            description="Some description",
            typical_stay_description="Some typical stay description",
            total_beds=100,
            available_beds=50,
            private_beds=25,
            max_stay=12,
            average_bed_rate=500.23,
            bed_layout_description="Some bed layout description",
            location=baker.make(Location, point=Point(5.152149, 46.199615), address="1234 Main St."),
        )

        # Create related instances for Shelter
        baker.make(ShelterType, shelter=self.shelter1, title="Emergency Shelter")
        baker.make(Service, shelter=self.shelter1, title="Mail")
        baker.make(Service, shelter=self.shelter1, title="Showers")
        baker.make(Population, shelter=self.shelter1, title="Men")
        baker.make(Population, shelter=self.shelter1, title="Women")
        baker.make(Requirement, shelter=self.shelter1, title="Veteran")
        baker.make(Funder, shelter=self.shelter1, title="MPP")
        baker.make(Funder, shelter=self.shelter1, title="DMH")

    def test_shelters_query(self) -> None:
        query = """
        query {
            shelters {
                id
                title
                organization
                location {
                    point
                }
                populations
                services
                funders
            }
        }
        """

        expected_response = {
            "shelters": [
                {
                    "id": "1",
                    "organization": "Organization-1",
                    "location": {"point": [5.152149, 46.199615]},
                    "populations": ["Men", "Women"],
                    "services": ["Mail", "Showers"],
                    "title": "Shelter-1",
                    "funders": ["MPP", "DMH"],
                }
            ]
        }

        with self.assertNumQueries(6):
            response = self.execute_graphql(query)

        self.assertEqual(len(response["data"]["shelters"]), 1)
        self.assertEqual(response["data"], expected_response)
