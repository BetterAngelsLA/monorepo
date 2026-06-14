from accounts.models import User
from common.tests.utils import GraphQLBaseTestCase
from model_bakery import baker
from waffle import (
    get_waffle_flag_model,
    get_waffle_sample_model,
    get_waffle_switch_model,
)


class FeatureControlDataTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.flags = [
            get_waffle_flag_model().objects.create(name="flag_1", everyone=True),
            get_waffle_flag_model().objects.create(name="flag_2", everyone=True),
            get_waffle_flag_model().objects.create(name="flag_3", everyone=True),
        ]
        self.switches = [
            get_waffle_switch_model().objects.create(name="switch_1", active=True),
            get_waffle_switch_model().objects.create(name="switch_2", active=True),
        ]

        self.samples = [get_waffle_sample_model().objects.create(name="sample_1", percent=100)]

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


class FeatureControlsUnauthenticatedTestCase(GraphQLBaseTestCase):
    """Regression test: anonymous GraphQL queries hitting the New Relic agent's
    ``wrap_execute_operation`` hook.

    See newrelic/newrelic-python-agent#1756 — as of graphql-core 3.2.10,
    ``ExecutionContext.errors`` was removed, and New Relic < 13.2 crashed with
    ``AttributeError: 'StrawberryGraphQLCoreExecutionContext' object has no
    attribute 'errors'``.  We pin newrelic to its ``main`` branch until a fixed
    release is published.

    This test ensures anonymous GraphQL queries (which bypass
    ``IsAuthenticated`` early-return and reach full execution) complete
    without a 500 caused by the New Relic hook.
    """

    def test_feature_controls_unauthenticated(self) -> None:
        """Anonymous featureControls query must return data without crashing."""
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
        self.assertIn("data", result)
        self.assertIsNotNone(result["data"])
        self.assertIsInstance(result["data"]["featureControls"]["flags"], list)


class FeatureControlsAccessTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.user_with_access = baker.make(User)
        self.user_without_access = baker.make(User)

        self.feature_flag = get_waffle_flag_model().objects.create(name="flag_1", everyone=None)
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
