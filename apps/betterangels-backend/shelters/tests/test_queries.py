from django.test import TestCase
from model_bakery import baker
from shelters.models import Shelter
from test_utils.mixins import GraphQLTestCaseMixin
from unittest_parametrize import ParametrizedTestCase


class ShelterQueryTestCase(GraphQLTestCaseMixin, ParametrizedTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.shelter_count = 2
        self.shelter_fields = """
            id
            name
        """

        self.shelter_1, self.shelter_2 = baker.make(
            Shelter,
            phone="2125551212",
            description="description",
            other_rules="other_rules",
            other_services="other_services",
            entry_info="entry_info",
            bed_fees="bed_fees",
            program_fees="program_fees",
            _quantity=self.shelter_count,
        )

    def test_shelter_query(self) -> None:
        shelter = self.shelter_1
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
            "name": shelter.name,
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

        response = self.execute_graphql(query)

        self.assertIsNotNone(response["data"])
        self.assertEqual(len(response["data"]["shelters"]["results"]), self.shelter_count)
