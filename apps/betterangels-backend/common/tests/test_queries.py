from common.tests.utils import AddressGraphQLBaseTestCase


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
        with self.assertNumQueries(expected_query_count):
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
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query)

        addresses = response["data"]["addresses"]
        self.assertEqual(len(addresses), 1)
        self.assertEqual(self.address, addresses[0])
