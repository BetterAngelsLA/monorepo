from common.tests.utils import GraphQLBaseTestCase
from shelters.enums import StatusChoices
from shelters.tests.baker_recipes import shelter_recipe
from unittest_parametrize import parametrize


class ShelterPrivacyPermissionTestCase(GraphQLBaseTestCase):
    """Verify that `shelter` and `shelters` queries respect the `view_private_shelter` permission."""

    def setUp(self) -> None:
        super().setUp()
        self.public_shelter = shelter_recipe.make(status=StatusChoices.APPROVED, is_private=False)
        self.private_shelter = shelter_recipe.make(status=StatusChoices.APPROVED, is_private=True)

    @parametrize(
        "user_label, expect_private_visible",
        [
            (None, False),
            ("non_case_manager_user", False),
            ("org_1_case_manager_1", True),
        ],
    )
    def test_shelters_query_privacy(self, user_label: str | None, expect_private_visible: bool) -> None:
        self._handle_user_login(user_label)
        query = """
            query {
                shelters {
                    totalCount
                    results { id }
                }
            }
        """
        response = self.execute_graphql(query)
        self.assertIsNone(response.get("errors"))
        shelter_ids = [s["id"] for s in response["data"]["shelters"]["results"]]
        self.assertIn(str(self.public_shelter.pk), shelter_ids)
        self.assertEqual(str(self.private_shelter.pk) in shelter_ids, expect_private_visible)

    @parametrize(
        "user_label, is_private, expect_error",
        [
            (None, True, True),
            (None, False, False),
            ("non_case_manager_user", True, True),
            ("non_case_manager_user", False, False),
            ("org_1_case_manager_1", True, False),
            ("org_1_case_manager_1", False, False),
        ],
    )
    def test_shelter_query_privacy(self, user_label: str | None, is_private: bool, expect_error: bool) -> None:
        self._handle_user_login(user_label)
        shelter = self.private_shelter if is_private else self.public_shelter
        query = """
            query ($id: ID!) {
                shelter(pk: $id) { id }
            }
        """
        response = self.execute_graphql(query, {"id": shelter.pk})
        self.assertEqual(response.get("errors") is not None, expect_error)
