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
from organizations.models import OrganizationInvitation, OrganizationUser
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

        self.org_admin = baker.make(User, first_name="admin")

        self.org = organization_recipe.make(name="org")
        self.org.add_user(self.org_admin)

        omb = OrgPermissionManager(self.org)
        omb.set_role(self.org_admin, OrgRoleEnum.ADMIN)

        self.graphql_client.force_login(self.org_admin)

    def test_add_organization_member(self) -> None:
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
            "organizationId": self.org.pk,
        }

        with patch("accounts.backends.CustomInvitations.send_invitation") as mock_send_invitation:
            with self.assertNumQueriesWithoutCache(20):
                response = self.execute_graphql(mutation, {"data": variables})

            mock_send_invitation.assert_called_once()

        expected_member = {**new_member, "id": ANY, "memberRole": OrgRoleEnum.MEMBER.name}
        self.assertEqual(expected_member, response["data"]["addOrganizationMember"])

        new_user = User.objects.get(email=new_member["email"])
        self.assertIn(new_user, self.org.users.all())

        invitation = OrganizationInvitation.objects.get(invitee_id=new_user.pk)
        self.assertEqual(invitation.organization, self.org)
        self.assertEqual(invitation.invited_by, self.org_admin)

        group = Group.objects.get(
            permissiongroup__organization=self.org,
            permissiongroup__template__name=GroupTemplateNames.CASEWORKER,
        )
        self.assertIn(group, new_user.groups.all())

    def test_add_organization_member_already_member(self) -> None:
        org_member = baker.make(
            User,
            first_name="Current",
            last_name="Member",
            email="current_member@example.com",
        )
        self.org.add_user(org_member)

        initial_org_member_count = OrganizationUser.objects.count()

        new_member = {
            "email": "current_member@example.com",
            "firstName": "New",
            "middleName": "Ish",
            "lastName": "Member",
        }

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
                    }
                }
            }
        """

        variables = {
            **new_member,
            "organizationId": self.org.pk,
        }

        with self.assertNumQueriesWithoutCache(10):
            response = self.execute_graphql(mutation, {"data": variables})

        self.assertEqual(len(response["data"]["addOrganizationMember"]["messages"]), 1)
        self.assertEqual(
            response["data"]["addOrganizationMember"]["messages"][0]["message"],
            "New Member is already a member of org.",
        )
        self.assertEqual(initial_org_member_count, OrganizationUser.objects.count())

    def test_remove_organization_member(self) -> None:

        removable_member = baker.make(
            User,
            first_name="Remove",
            last_name="Me",
            email="remove@example.com",
        )
        self.org.add_user(removable_member)

        self.assertTrue(
            OrganizationUser.objects.filter(
                organization=self.org,
                user=removable_member,
            ).exists()
        )

        mutation = """
            mutation ($data: RemoveOrganizationMemberInput!) {
                removeOrganizationMember(data: $data) {
                    ... on OperationInfo {
                        messages { kind field message }
                    }
                    ... on DeletedObjectType {
                        id
                    }
                }
            }
        """

        variables = {
            "id": removable_member.pk,
            "organizationId": self.org.pk,
        }

        response = self.execute_graphql(mutation, {"data": variables})

        self.assertEqual(
            {"id": removable_member.pk},
            response["data"]["removeOrganizationMember"],
        )

        self.assertFalse(
            OrganizationUser.objects.filter(
                organization=self.org,
                user=removable_member,
            ).exists()
        )

        self.assertTrue(User.objects.filter(pk=removable_member.pk).exists())

    def test_remove_organization_member_user_not_in_org(self) -> None:
        outsider = baker.make(
            User,
            first_name="Out",
            last_name="Side",
            email="outsider@example.com",
        )

        mutation = """
            mutation ($data: RemoveOrganizationMemberInput!) {
                removeOrganizationMember(data: $data) {
                    ... on OperationInfo {
                        messages { kind field message }
                    }
                    ... on DeletedObjectType { id }
                }
            }
        """

        variables = {
            "id": outsider.pk,
            "organizationId": self.org.pk,
        }

        response = self.execute_graphql(mutation, {"data": variables})

        self.assertEqual(len(response["data"]["removeOrganizationMember"]["messages"]), 1)
        self.assertEqual(
            response["data"]["removeOrganizationMember"]["messages"][0]["message"],
            "User is not a member of this organization.",
        )

        self.assertFalse(
            OrganizationUser.objects.filter(
                organization=self.org,
                user=outsider,
            ).exists()
        )

    def test_remove_organization_member_cannot_remove_owner(self) -> None:

        mutation = """
            mutation ($data: RemoveOrganizationMemberInput!) {
                removeOrganizationMember(data: $data) {
                    ... on OperationInfo {
                        messages { kind field message }
                    }
                    ... on DeletedObjectType { id }
                }
            }
        """

        variables = {
            "id": self.org_admin.pk,
            "organizationId": self.org.pk,
        }

        response = self.execute_graphql(mutation, {"data": variables})

        self.assertEqual(len(response["data"]["removeOrganizationMember"]["messages"]), 1)
        self.assertEqual(
            response["data"]["removeOrganizationMember"]["messages"][0]["message"],
            "You cannot remove the organization owner. Transfer ownership first.",
        )

        self.assertTrue(
            OrganizationUser.objects.filter(
                organization=self.org,
                user=self.org_admin,
            ).exists()
        )
