from common.models import Address
from common.tests.utils import AddressGraphQLBaseTestCase
from unittest_parametrize import parametrize


class AddressPermissionTestCase(AddressGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Case Manager user should succeed
            ("org_2_case_manager_1", True),  # Case Manager user should succeed
            # TODO: We'll probably give Clients access to this at some point.
            ("fake_client_1", False),  # Client user should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_create_address_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        address_count = Address.objects.count()

        # Change the street number so we can create a new address.
        json_address_input, _ = self._get_address_inputs(street_number_override="201")
        response = self._get_or_create_address_fixture(json_address_input)

        if should_succeed:
            self.assertIsNotNone(response["data"]["getOrCreateAddress"]["id"])
            self.assertEqual(address_count + 1, Address.objects.count())
        else:
            self.assertEqual(
                response["data"]["getOrCreateAddress"]["messages"][0],
                {
                    "kind": "PERMISSION",
                    "field": "getOrCreateAddress",
                    "message": "You don't have permission to access this app.",
                },
            )
            self.assertEqual(address_count, Address.objects.count())

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Case Manager user should succeed
            ("org_2_case_manager_1", True),  # Case Manager user should succeed
            # TODO: We'll probably give Clients access to this at some point.
            ("fake_client_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_address_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        mutation = """
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
        response = self.execute_graphql(mutation, variables)

        if should_succeed:
            self.assertIsNotNone(response["data"])
        else:
            self.assertIsNotNone(response["errors"])
