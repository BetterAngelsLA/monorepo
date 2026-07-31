from typing import Any

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
        self.assertEqual(len(result["data"]["featureControls"]["switches"]), 3)
        self.assertEqual(len(result["data"]["featureControls"]["samples"]), 1)


class NewRelicGraphQLSmokeTestCase(GraphQLBaseTestCase):
    """
    End-to-end test: execute a Strawberry GraphQL query inside a New
    Relic background task and verify the response is not corrupted.

    The agent's ``wrap_execute_operation`` hook calls ``set_name()``
    after every execution.  That function accesses
    ``execution_context.errors``, which was renamed to
    ``collected_errors`` in graphql-core >= 3.2.10.  Strawberry's custom
    ``StrawberryGraphQLCoreExecutionContext`` does NOT expose
    ``.errors``, so the agent raises ``AttributeError``.

    With **11.5.0 / pre-PR #1760**:
        ``result.data`` is ``None`` and ``result.errors`` contains:
        ``'StrawberryGraphQLCoreExecutionContext' object has no
        attribute 'errors'``

    With **commit 825d7bd3 (PR #1760 fix)**:
        ``result.data`` is correct and ``result.errors`` is ``None``.
    """

    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()
        cls._init_agent()

    @classmethod
    def tearDownClass(cls) -> None:
        from newrelic.core.agent import shutdown_agent

        shutdown_agent()
        super().tearDownClass()

    @staticmethod
    def _init_agent() -> None:
        import logging
        import os

        from newrelic.api.application import register_application
        from newrelic.config import initialize
        from newrelic.core.config import apply_config_setting, global_settings

        os.environ.setdefault("NEW_RELIC_DEVELOPER_MODE", "true")

        s = global_settings()
        s.app_name = "BA Test"
        s.developer_mode = True
        s.license_key = "DEVELOPERMODELICENSEKEY"

        for k, v in {
            "package_reporting.enabled": False,
            "debug.disable_harvest_until_shutdown": True,
            "debug.record_transaction_failure": True,
        }.items():
            apply_config_setting(s, k, v)

        # Suppress agent log noise during tests — no log file on disk.
        logging.getLogger("newrelic").setLevel(logging.ERROR)
        initialize(log_level=logging.ERROR)
        register_application()

    def test_graphql_query_not_corrupted_by_newrelic(self) -> None:
        """
        Execute ``{ hello }`` via ``schema.execute_sync()`` under a
        New Relic background task.

        Asserts that ``result.errors`` is ``None`` and that
        ``result.data`` contains the expected ``"Hello!"``.
        """
        import newrelic.agent
        import strawberry
        from strawberry.schema import Schema as StrawberrySchema

        @strawberry.type
        class _Query:
            @strawberry.field
            def hello(self) -> str:
                return "Hello!"

        schema = StrawberrySchema(query=_Query)

        @newrelic.agent.background_task()
        def _run() -> Any:
            return schema.execute_sync("{ hello }")

        result = _run()
        self.assertIsNone(result.errors)
        self.assertEqual(result.data["hello"], "Hello!")


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
