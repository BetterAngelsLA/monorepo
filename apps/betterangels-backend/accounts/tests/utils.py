from typing import Any, Dict

from accounts.models import User
from common.tests.utils import GraphQLBaseTestCase
from model_bakery import baker
from organizations.models import OrganizationUser

from .baker_recipes import organization_recipe, permission_group_recipe


class CurrentUserGraphQLBaseTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.setup_users()

        self.user_fields = """
            id
            firstName
            lastName
            middleName
            email
            hasAcceptedTos
            hasAcceptedPrivacyPolicy
            isOutreachAuthorized
            organizations: organizationsOrganization {
                id
                name
            }
        """

    def setup_users(self) -> None:
        self.user = baker.make(
            User,
            first_name="Dale",
            last_name="Cooper",
            middle_name="Bartholomew",
            email="coop@example.co",
            has_accepted_tos=False,
            has_accepted_privacy_policy=False,
        )
        self.user_organization = organization_recipe.make(name="Twin Peaks Sheriff's Department")
        permission_group_recipe.make(organization=self.user_organization)
        baker.make(OrganizationUser, user=self.user, organization=self.user_organization)

    def _update_current_user_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_current_user_fixture("update", variables)

    def _create_or_update_current_user_fixture(self, operation: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        assert operation in ["create", "update"], "Invalid operation specified."
        mutation: str = f"""
            mutation {operation.capitalize()}CurrentUser($data: {operation.capitalize()}UserInput!) {{ # noqa: B950
                {operation}CurrentUser(data: $data) {{
                    ... on OperationInfo {{
                        messages {{
                            kind
                            field
                            message
                        }}
                    }}
                    ... on UserType {{
                        {self.user_fields}
                    }}
                }}
            }}
        """
        return self.execute_graphql(mutation, {"data": variables})
