from django.test import TestCase
from model_bakery import baker
from places import Places
from shelters.models import Shelter
from test_utils.mixins import GraphQLTestCaseMixin
from unittest_parametrize import ParametrizedTestCase


class ShelterQueryTestCase(GraphQLTestCaseMixin, ParametrizedTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.shelter_count = 3
        self.shelter_fields = """
            id
            bedFees
            description
            entryInfo
            name
            otherRules
            otherServices
            phone
            programFees
            location {
                latitude
                longitude
                place
            }
        """

        shelter_location = Places("123 Main Street", "34.0549", "-118.2426")

        self.shelters = baker.make(
            Shelter,
            bed_fees="bed_fees",
            description="description",
            entry_info="entry_info",
            location=shelter_location,
            other_rules="other_rules",
            other_services="other_services",
            phone="2125551212",
            program_fees="program_fees",
            _quantity=self.shelter_count,
        )

    def test_shelter_query(self) -> None:
        shelter = self.shelters[0]
        query = f"""
            query ViewShelter($id: ID!) {{
                shelter(pk: $id) {{
                    {self.shelter_fields}
                }}
            }}
        """
        variables = {"id": shelter.pk}
        expected_query_count = 1

        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query, variables)

        response_shelter = response["data"]["shelter"]

        expected_shelter = {
            "id": str(shelter.pk),
            "bedFees": shelter.bed_fees,
            "description": shelter.description,
            "entryInfo": shelter.entry_info,
            "name": shelter.name,
            "otherRules": shelter.other_rules,
            "otherServices": shelter.other_services,
            "phone": str(shelter.phone.national_number),
            "programFees": shelter.program_fees,
            "location": {
                "latitude": float(shelter.location.latitude),
                "longitude": float(shelter.location.longitude),
                "place": shelter.location.place,
            },
        }
        self.assertEqual(response_shelter, expected_shelter)

    def test_shelters_query(self) -> None:
        query = f"""
            query ViewShelters($offset: Int, $limit: Int) {{
                shelters(pagination: {{offset: $offset, limit: $limit}}) {{
                    totalCount
                    pageInfo {{
                        limit
                        offset
                    }}
                    results {{
                        {self.shelter_fields}
                    }}
                }}
            }}
        """

        expected_query_count = 2

        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query)

        self.assertIsNotNone(response["data"])
        self.assertEqual(len(response["data"]["shelters"]["results"]), self.shelter_count)
