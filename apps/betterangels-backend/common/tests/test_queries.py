from accounts.models import User
from common.tests.utils import AddressGraphQLBaseTestCase, GraphQLBaseTestCase
from model_bakery import baker
from waffle import (
    get_waffle_flag_model,
    get_waffle_sample_model,
    get_waffle_switch_model,
)


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
        get_waffle_flag_model().objects.create(name="myflag1", everyone=True)
        get_waffle_flag_model().objects.create(name="myflag2", everyone=True)
        get_waffle_flag_model().objects.create(name="myflag3", everyone=True)
        get_waffle_switch_model().objects.create(name="myswitch1", active=True)
        get_waffle_switch_model().objects.create(name="myswitch2", active=True)
        get_waffle_sample_model().objects.create(name="test_sample_active", percent=100)

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
        result = self.execute_graphql(query)
        self.assertNotIn("errors", result)
        self.assertEqual(len(result["data"]["featureControls"]["flags"]), 3)
        self.assertEqual(len(result["data"]["featureControls"]["switches"]), 2)
        self.assertEqual(len(result["data"]["featureControls"]["samples"]), 1)


class FeatureControlsAccessTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.user_with_access = baker.make(User)
        self.user_without_access = baker.make(User)

        self.feature_flag = get_waffle_flag_model().objects.create(name="myflag1", everyone=None)
        self.feature_flag.users.add(self.user_with_access)  # type: ignore
        self.feature_flag.save()

    def test_user_with_access_to_feature_flag(self) -> None:
        self.graphql_client.force_login(self.user_with_access)
        query = """
        query {
            featureControls {
                flags {
                    name
                    isActive
                }
            }
        }
        """
        result = self.execute_graphql(query)
        flags = result["data"]["featureControls"]["flags"]
        new_feature_flag: dict = next((flag for flag in flags if flag["name"] == self.feature_flag.name), {})
        self.assertIsNotNone(new_feature_flag, "Feature flag not found in response.")
        self.assertTrue(
            new_feature_flag["isActive"],
            "Feature flag should be active for user with access.",
        )

    def test_user_without_access_to_feature_flag(self) -> None:
        self.graphql_client.force_login(self.user_without_access)
        query = """
        query {
            featureControls {
                flags {
                    name
                    isActive
                }
            }
        }
        """
        result = self.execute_graphql(query)
        flags = result["data"]["featureControls"]["flags"]
        new_feature_flag: dict = next((flag for flag in flags if flag["name"] == self.feature_flag.name), {})
        self.assertIsNotNone(new_feature_flag, "Feature flag not found in response.")
        self.assertFalse(
            new_feature_flag["isActive"],
            "Feature flag should not be active for user without access.",
        )
