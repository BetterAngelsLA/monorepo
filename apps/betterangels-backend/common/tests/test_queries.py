from common.tests.utils import AddressGraphQLBaseTestCase, GraphQLBaseTestCase
from model_bakery import baker
from waffle.models import Flag, Sample, Switch


class AddressQueryTestCase(AddressGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)

    def test_address_query(self) -> None:
        expected_address = {
            "id": self.address["id"],
            "street": self.address["street"],
            "city": self.address["city"],
            "state": self.address["state"],
            "zipCode": self.address["zipCode"],
        }

        query = """
            query ViewAddress($id: ID!) {
                address(pk: $id) {
                    id
                    street
                    city
                    state
                    zipCode
                }
            }
        """
        variables = {"id": self.address["id"]}

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables)

        address = response["data"]["address"]
        self.assertEqual(expected_address, address)

    def test_addresses_query(self) -> None:
        query = """
            {
                addresses {
                    id
                    street
                    city
                    state
                    zipCode
                }
            }
        """
        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query)

        addresses = response["data"]["addresses"]
        self.assertEqual(len(addresses), 1)
        self.assertEqual(self.address, addresses[0])


class FeatureControlDataTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.flags = baker.make(Flag, _quantity=3, _fill_optional=True)
        self.switches = baker.make(Switch, _quantity=2, _fill_optional=True)
        self.samples = baker.make(Sample, _quantity=1, _fill_optional=True)

    def test_feature_controls_query(self) -> None:
        query = """
        query {
            featureControls {
                flags {
                    name
                    isActive
                    lastModified
                }
                switches {
                    name
                    isActive
                    lastModified
                }
                samples {
                    name
                    isActive
                    lastModified
                }
            }
        }
        """

        # Execute the query
        result = self.execute_graphql(query)

        # Assertions
        self.assertNotIn("errors", result)
        self.assertEqual(len(result["data"]["featureControls"]["flags"]), 3)
        self.assertEqual(len(result["data"]["featureControls"]["switches"]), 2)
        self.assertEqual(len(result["data"]["featureControls"]["samples"]), 1)
