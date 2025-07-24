from unittest.mock import ANY, patch

from accounts.enums import OrgRoleEnum
from accounts.groups import GroupTemplateNames
from accounts.models import User
from accounts.tests.utils import CurrentUserGraphQLBaseTestCase
from accounts.utils import OrgPermissionManager
from common.tests.utils import GraphQLBaseTestCase
from django.contrib.auth.models import Group
from django.test import TestCase, ignore_warnings
from model_bakery import baker
from organizations.models import OrganizationInvitation
from unittest_parametrize import ParametrizedTestCase

from .baker_recipes import organization_recipe


@ignore_warnings(category=UserWarning)
class CurrentUserGraphQLTests(CurrentUserGraphQLBaseTestCase, TestCase):
    def test_anonymous_user_logout(self) -> None:
        query = """
        mutation {
            logout
        }
        """
        response = self.execute_graphql(query)
        self.assertIsNone(response.get("errors"))
        self.assertFalse(response["data"]["logout"])

    def test_logged_in_user_logout(self) -> None:
        self.graphql_client.force_login(self.user)

        query = """
        mutation {
            logout
        }
        """
        response = self.execute_graphql(query)
        self.assertIsNone(response.get("errors"))
        self.assertTrue(response["data"]["logout"])

    def test_update_current_user_mutation(self) -> None:
        variables = {
            "id": str(self.user.pk),
            "firstName": "Daley",
            "lastName": "Coopery",
            "middleName": "Barty",
            "email": "dale@example.co",
            "hasAcceptedTos": False,
            "hasAcceptedPrivacyPolicy": False,
        }

        self.graphql_client.force_login(self.user)
        response = self._update_current_user_fixture(variables)
        user = response["data"]["updateCurrentUser"]
        expected_user = {
            **variables,
            "isOutreachAuthorized": True,
            "organizations": [
                {"id": str(self.user_organization.pk), "name": self.user_organization.name},
            ],
        }

        self.assertEqual(user, expected_user)

    def test_delete_current_user(self) -> None:
        initial_user_count = User.objects.count()
        self.graphql_client.force_login(self.user)

        mutation: str = """
            mutation DeleteCurrentUser {
                deleteCurrentUser {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on DeletedObjectType {
                        id
                    }
                }
            }
        """

        response = self.execute_graphql(mutation)["data"]["deleteCurrentUser"]
        self.assertEqual(response["id"], self.user.pk)
        self.assertEqual(User.objects.count(), initial_user_count - 1)


class OrganizationMemberMutationTestCase(GraphQLBaseTestCase, ParametrizedTestCase):
    def setUp(self) -> None:
        super().setUp()

    def test_add_organization_member(self) -> None:
        org = organization_recipe.make(name="org")
        org_admin = baker.make(User, first_name="admin")
        org.add_user(org_admin)

        omb = OrgPermissionManager(org)
        omb.set_role(org_admin, OrgRoleEnum.ADMIN)

        new_member = {
            "email": "new_member@example.com",
            "firstName": "New",
            "middleName": "Ish",
            "lastName": "Member",
        }

        with self.assertRaises(User.DoesNotExist):
            User.objects.get(email=new_member["email"])

        mutation = """
            mutation ($data: OrgInvitationInput!) {
                addOrganizationMember(data: $data) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on OrganizationMemberType {
                        id
                        email
                        firstName
                        lastName
                        memberRole
                        middleName
                    }
                }
            }
        """

        variables = {
            **new_member,
            "organizationId": org.pk,
        }

        self.graphql_client.force_login(org_admin)
        with patch("accounts.backends.CustomInvitations.send_invitation") as mock_send_invitation:
            with self.assertNumQueriesWithoutCache(20):
                response = self.execute_graphql(mutation, {"data": variables})

            mock_send_invitation.assert_called_once()

        expected_member = {**new_member, "id": ANY, "memberRole": OrgRoleEnum.MEMBER.name}
        self.assertEqual(expected_member, response["data"]["addOrganizationMember"])

        new_user = User.objects.get(email=new_member["email"])
        self.assertIn(new_user, org.users.all())

        invitation = OrganizationInvitation.objects.get(invitee_id=new_user.pk)
        self.assertEqual(invitation.organization, org)
        self.assertEqual(invitation.invited_by, org_admin)

        group = Group.objects.get(
            permissiongroup__organization=org,
            permissiongroup__template__name=GroupTemplateNames.CASEWORKER,
        )
        self.assertIn(group, new_user.groups.all())
