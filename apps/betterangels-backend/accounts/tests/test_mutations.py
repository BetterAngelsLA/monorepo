from typing import Any
from unittest.mock import ANY, patch

from accounts.enums import OrgRoleEnum
from accounts.groups import GroupTemplateNames
from accounts.models import User
from accounts.tests.utils import CurrentUserGraphQLBaseTestCase
from accounts.utils import OrgPermissionManager
from common.tests.utils import GraphQLBaseTestCase
from django.contrib.auth.models import Group
from django.test import TestCase, ignore_warnings, override_settings
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


@ignore_warnings(category=UserWarning)
class OtpMutationTests(GraphQLBaseTestCase, TestCase):
    """Tests for OTP (One-Time Password) authentication mutations."""

    def setUp(self) -> None:
        super().setUp()
        self.test_email = "testuser@example.com"

    @override_settings(ACCOUNT_LOGIN_BY_CODE_ENABLED=True, ACCOUNT_LOGIN_BY_CODE_TIMEOUT=300)
    def test_request_otp_success(self) -> None:
        """Test that requesting an OTP returns success and creates a user."""
        mutation = """
            mutation RequestOtp($email: String!) {
                requestOtp(email: $email) {
                    success
                }
            }
        """
        variables = {"email": self.test_email}

        # Verify user doesn't exist yet
        self.assertFalse(User.objects.filter(email=self.test_email).exists())

        response = self.execute_graphql(mutation, variables)

        # Check response
        self.assertIsNone(response.get("errors"))
        self.assertTrue(response["data"]["requestOtp"]["success"])

        # Verify user was created
        user = User.objects.get(email=self.test_email)
        self.assertEqual(user.email, self.test_email)
        self.assertFalse(user.has_usable_password())

    @override_settings(ACCOUNT_LOGIN_BY_CODE_ENABLED=True)
    def test_request_otp_existing_user(self) -> None:
        """Test that requesting an OTP for an existing user works."""
        # Create existing user
        baker.make(User, email=self.test_email)

        mutation = """
            mutation RequestOtp($email: String!) {
                requestOtp(email: $email) {
                    success
                }
            }
        """
        variables = {"email": self.test_email}

        response = self.execute_graphql(mutation, variables)

        # Check response
        self.assertIsNone(response.get("errors"))
        self.assertTrue(response["data"]["requestOtp"]["success"])

        # Verify no duplicate user created
        self.assertEqual(User.objects.filter(email=self.test_email).count(), 1)

    @override_settings(ACCOUNT_LOGIN_BY_CODE_ENABLED=True)
    def test_request_otp_email_normalization(self) -> None:
        """Test that email addresses are normalized (lowercased and trimmed)."""
        mutation = """
            mutation RequestOtp($email: String!) {
                requestOtp(email: $email) {
                    success
                }
            }
        """
        variables = {"email": "  TestUser@EXAMPLE.COM  "}

        response = self.execute_graphql(mutation, variables)

        # Check response
        self.assertIsNone(response.get("errors"))
        self.assertTrue(response["data"]["requestOtp"]["success"])

        # Verify user was created with normalized email
        user = User.objects.get(email="testuser@example.com")
        self.assertEqual(user.email, "testuser@example.com")

    @override_settings(ACCOUNT_LOGIN_BY_CODE_ENABLED=False)
    def test_request_otp_when_disabled(self) -> None:
        """Test that requesting an OTP fails when the feature is disabled."""
        mutation = """
            mutation RequestOtp($email: String!) {
                requestOtp(email: $email) {
                    success
                }
            }
        """
        variables = {"email": self.test_email}

        response = self.execute_graphql(mutation, variables)

        # Check that an error is returned
        self.assertIsNotNone(response.get("errors"))
        self.assertIn("OTP login is not enabled", str(response["errors"]))

    @override_settings(ACCOUNT_LOGIN_BY_CODE_ENABLED=True, ACCOUNT_LOGIN_BY_CODE_TIMEOUT=300)
    @patch("accounts.schema.cache")
    def test_request_otp_stores_code_in_cache(self, mock_cache: Any) -> None:
        """Test that the OTP code is stored in cache with correct timeout."""
        mutation = """
            mutation RequestOtp($email: String!) {
                requestOtp(email: $email) {
                    success
                }
            }
        """
        variables = {"email": self.test_email}

        response = self.execute_graphql(mutation, variables)

        # Check response
        self.assertIsNone(response.get("errors"))
        self.assertTrue(response["data"]["requestOtp"]["success"])

        # Verify cache.set was called with correct parameters
        mock_cache.set.assert_called_once()
        call_args = mock_cache.set.call_args
        cache_key, code, timeout = call_args[0]

        self.assertEqual(cache_key, f"otp_code:{self.test_email}")
        self.assertEqual(len(code), 6)  # 6-digit code
        self.assertTrue(code.isdigit())  # All digits
        self.assertEqual(timeout, 300)  # 5 minutes

    @override_settings(ACCOUNT_LOGIN_BY_CODE_ENABLED=True, ACCOUNT_LOGIN_BY_CODE_TIMEOUT=300)
    def test_verify_otp_success(self) -> None:
        """Test that verifying a correct OTP logs the user in."""
        from django.core.cache import cache

        # First, request an OTP
        baker.make(User, email=self.test_email)
        code = "123456"
        cache_key = f"otp_code:{self.test_email}"
        cache.set(cache_key, code, 300)

        mutation = """
            mutation VerifyOtp($email: String!, $code: String!) {
                verifyOtp(email: $email, code: $code) {
                    token
                }
            }
        """
        variables = {"email": self.test_email, "code": code}

        response = self.execute_graphql(mutation, variables)

        # Check response
        self.assertIsNone(response.get("errors"))
        self.assertIsNotNone(response["data"]["verifyOtp"]["token"])

        # Verify code was deleted from cache
        self.assertIsNone(cache.get(cache_key))

    @override_settings(ACCOUNT_LOGIN_BY_CODE_ENABLED=True)
    def test_verify_otp_invalid_code(self) -> None:
        """Test that verifying an incorrect OTP fails."""
        from django.core.cache import cache

        # Setup: create user and store code
        baker.make(User, email=self.test_email)
        cache_key = f"otp_code:{self.test_email}"
        cache.set(cache_key, "123456", 300)

        mutation = """
            mutation VerifyOtp($email: String!, $code: String!) {
                verifyOtp(email: $email, code: $code) {
                    token
                }
            }
        """
        variables = {"email": self.test_email, "code": "999999"}  # Wrong code

        response = self.execute_graphql(mutation, variables)

        # Check that an error is returned
        self.assertIsNotNone(response.get("errors"))
        self.assertIn("Invalid code", str(response["errors"]))

        # Verify code is still in cache (not deleted on failed attempt)
        self.assertEqual(cache.get(cache_key), "123456")

    @override_settings(ACCOUNT_LOGIN_BY_CODE_ENABLED=True)
    def test_verify_otp_expired_code(self) -> None:
        """Test that verifying an expired OTP fails."""
        # Setup: create user but don't store code (simulating expiration)
        baker.make(User, email=self.test_email)

        mutation = """
            mutation VerifyOtp($email: String!, $code: String!) {
                verifyOtp(email: $email, code: $code) {
                    token
                }
            }
        """
        variables = {"email": self.test_email, "code": "123456"}

        response = self.execute_graphql(mutation, variables)

        # Check that an error is returned
        self.assertIsNotNone(response.get("errors"))
        self.assertIn("Invalid or expired code", str(response["errors"]))

    @override_settings(ACCOUNT_LOGIN_BY_CODE_ENABLED=True)
    def test_verify_otp_nonexistent_user(self) -> None:
        """Test that verifying an OTP for a non-existent user fails."""
        mutation = """
            mutation VerifyOtp($email: String!, $code: String!) {
                verifyOtp(email: $email, code: $code) {
                    token
                }
            }
        """
        variables = {"email": "nonexistent@example.com", "code": "123456"}

        response = self.execute_graphql(mutation, variables)

        # Check that an error is returned
        self.assertIsNotNone(response.get("errors"))
        self.assertIn("Invalid email or code", str(response["errors"]))

    @override_settings(ACCOUNT_LOGIN_BY_CODE_ENABLED=True)
    def test_verify_otp_email_normalization(self) -> None:
        """Test that email normalization works in verify OTP."""
        from django.core.cache import cache

        # Setup with normalized email
        baker.make(User, email=self.test_email)
        code = "123456"
        cache_key = f"otp_code:{self.test_email}"
        cache.set(cache_key, code, 300)

        mutation = """
            mutation VerifyOtp($email: String!, $code: String!) {
                verifyOtp(email: $email, code: $code) {
                    token
                }
            }
        """
        # Use uppercase and spaces in email
        variables = {"email": "  TestUser@EXAMPLE.COM  ", "code": code}

        response = self.execute_graphql(mutation, variables)

        # Check response
        self.assertIsNone(response.get("errors"))
        self.assertIsNotNone(response["data"]["verifyOtp"]["token"])

    @override_settings(ACCOUNT_LOGIN_BY_CODE_ENABLED=True)
    def test_verify_otp_code_whitespace_trimmed(self) -> None:
        """Test that whitespace in OTP code is trimmed."""
        from django.core.cache import cache

        # Setup
        baker.make(User, email=self.test_email)
        code = "123456"
        cache_key = f"otp_code:{self.test_email}"
        cache.set(cache_key, code, 300)

        mutation = """
            mutation VerifyOtp($email: String!, $code: String!) {
                verifyOtp(email: $email, code: $code) {
                    token
                }
            }
        """
        # Add whitespace to code
        variables = {"email": self.test_email, "code": "  123456  "}

        response = self.execute_graphql(mutation, variables)

        # Check response
        self.assertIsNone(response.get("errors"))
        self.assertIsNotNone(response["data"]["verifyOtp"]["token"])

    @override_settings(ACCOUNT_LOGIN_BY_CODE_ENABLED=True, ACCOUNT_LOGIN_BY_CODE_TIMEOUT=300)
    def test_request_otp_overwrites_previous_code(self) -> None:
        """Test that requesting a new OTP overwrites the previous code for the same email."""
        from django.core.cache import cache

        mutation = """
            mutation RequestOtp($email: String!) {
                requestOtp(email: $email) {
                    success
                }
            }
        """
        variables = {"email": self.test_email}

        # First OTP request
        cache_key = f"otp_code:{self.test_email}"
        first_code = "111111"
        cache.set(cache_key, first_code, 300)

        # Verify first code is stored
        self.assertEqual(cache.get(cache_key), first_code)

        # Second OTP request (should overwrite)
        with patch("accounts.schema.secrets.choice") as mock_choice:
            # Mock to return '2' for all 6 digits
            mock_choice.return_value = "2"
            response = self.execute_graphql(mutation, variables)

        # Check response
        self.assertIsNone(response.get("errors"))
        self.assertTrue(response["data"]["requestOtp"]["success"])

        # Verify the code was overwritten with new code
        stored_code = cache.get(cache_key)
        self.assertIsNotNone(stored_code)
        self.assertEqual(stored_code, "222222")
        self.assertNotEqual(stored_code, first_code)
