from typing import Any
from unittest.mock import ANY, patch

from accounts.enums import OrgRoleEnum
from accounts.groups import ORG_ADMIN, ORG_SUPERUSER
from accounts.models import PermissionGroup, User
from accounts.role_manager import OrgRoleManager
from accounts.tests.utils import CurrentUserGraphQLBaseTestCase
from accounts.types import PermissionTemplateEnum
from common.tests.utils import GraphQLBaseTestCase
from django.contrib.auth.models import Group
from django.test import TestCase, ignore_warnings
from model_bakery import baker
from notes.groups import CASEWORKER
from organizations.models import OrganizationInvitation, OrganizationUser
from shelters.groups import GLOBAL_SHELTER_OPERATOR
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


@ignore_warnings(category=UserWarning)
class UpdateUserProfileTests(CurrentUserGraphQLBaseTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()

        self.mutation = """
            mutation UpdateUserProfile($data: UpdateUserProfileInput!) {
                updateUserProfile(data: $data) {
                    ... on OperationInfo {
                        messages { kind field message }
                    }
                    ... on CurrentUserType {
                        id
                        firstName
                        lastName
                    }
                }
            }
        """

    def test_update_user_profile(self) -> None:
        self.graphql_client.force_login(self.user)
        variables = {"firstName": "Up", "lastName": "Date"}

        response = self.execute_graphql(self.mutation, {"data": variables})
        self.assertIsNone(response.get("errors"), response.get("errors"))

        payload = response["data"]["updateUserProfile"]
        self.assertEqual(payload["firstName"], "Up")
        self.assertEqual(payload["lastName"], "Date")
        self.assertEqual(payload["id"], str(self.user.pk))

        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Up")
        self.assertEqual(self.user.last_name, "Date")

    def test_update_user_profile_empty_value(self) -> None:
        self.graphql_client.force_login(self.user)
        variables = {"firstName": "  ", "lastName": "Date"}

        response = self.execute_graphql(self.mutation, {"data": variables})
        self.assertIsNotNone(response.get("errors"))
        self.assertEqual(len(response["errors"]), 1)
        self.assertIn("Value cannot be blank.", response["errors"][0]["message"])

        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Dale")
        self.assertEqual(self.user.last_name, "Cooper")


class OrganizationMemberMutationTestCase(GraphQLBaseTestCase, ParametrizedTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.org_admin = baker.make(User, first_name="admin")

        self.org = organization_recipe.make(name="org", owner=self.org_admin)
        self._set_active_org(self.org)

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
            "permissionTemplate": PermissionTemplateEnum.CASEWORKER.name,
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
            permissiongroup__template__name=CASEWORKER.name,
        )
        self.assertIn(group, new_user.groups.all())

    def test_add_organization_member_rejects_a_role_the_organization_cannot_hold(self) -> None:
        """``PermissionTemplateEnum`` offers every invitable role, not just this org's.

        The org is outreach-only, so Shelter Operator has no permission group here.
        Resolving the name against the whole registry accepted it and then failed in
        ``add_roles`` with ``PermissionGroup.DoesNotExist``.
        """
        mutation = """
            mutation ($data: OrgInvitationInput!) {
                addOrganizationMember(data: $data) {
                    ... on OperationInfo {
                        messages {
                            kind
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
            "email": "wrongrole@example.com",
            "firstName": "Wrong",
            "middleName": "",
            "lastName": "Role",
            "organizationId": self.org.pk,
            "permissionTemplate": PermissionTemplateEnum.SHELTER_OPERATOR.name,
        }

        response = self.execute_graphql(mutation, {"data": variables})

        messages = response["data"]["addOrganizationMember"]["messages"]
        self.assertIn("Shelter Operator", messages[0]["message"])
        self.assertFalse(User.objects.filter(email="wrongrole@example.com").exists())

    def test_change_organization_member_role_rejects_a_role_the_organization_cannot_hold(self) -> None:
        """The other caller of ``get_template_or_raise``, and the org is outreach-only."""
        member = baker.make(User, email="rolechange@example.com")
        self.org.add_user(member)
        # Only Organization Superuser carries CHANGE_ORG_MEMBER_ROLE.
        OrgRoleManager(self.org).add_roles(self.org_admin, ORG_SUPERUSER)

        mutation = """
            mutation ($data: ChangeOrganizationMemberRoleInput!) {
                changeOrganizationMemberRole(data: $data) {
                    ... on OperationInfo {
                        messages {
                            kind
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
            "userId": member.pk,
            "organizationId": self.org.pk,
            "permissionTemplate": PermissionTemplateEnum.SHELTER_OPERATOR.name,
        }

        response = self.execute_graphql(mutation, {"data": variables})

        messages = response["data"]["changeOrganizationMemberRole"]["messages"]
        self.assertIn("Shelter Operator", messages[0]["message"])

    def test_change_organization_member_role_keeps_a_role_it_cannot_name(self) -> None:
        """``ORG_ADMIN`` is ``is_invitable=False``, so ``PermissionTemplateEnum`` omits it.

        Replacing every org-scoped group therefore demoted an org admin on any
        call — including one only meant to grant them Caseworker as well.
        """
        member = baker.make(User, email="keepsadmin@example.com")
        self.org.add_user(member)
        OrgRoleManager(self.org).add_roles(member, ORG_ADMIN)
        # Only Organization Superuser carries CHANGE_ORG_MEMBER_ROLE.
        OrgRoleManager(self.org).add_roles(self.org_admin, ORG_SUPERUSER)

        mutation = """
            mutation ($data: ChangeOrganizationMemberRoleInput!) {
                changeOrganizationMemberRole(data: $data) {
                    ... on OperationInfo {
                        messages {
                            kind
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
            "userId": member.pk,
            "organizationId": self.org.pk,
            "permissionTemplate": PermissionTemplateEnum.CASEWORKER.name,
        }

        self.execute_graphql(mutation, {"data": variables})

        held = set(
            PermissionGroup.objects.filter(organization=self.org, user=member).values_list("template__name", flat=True)
        )
        self.assertSetEqual(held, {CASEWORKER.name, ORG_ADMIN.name})

    def test_permission_template_enum_omits_the_org_bypass_role(self) -> None:
        """GLOBAL_SHELTER_OPERATOR is is_invitable=False, so the enum can't name it.

        ``addOrganizationMember`` and ``changeOrganizationMemberRole`` take a
        ``PermissionTemplateEnum``, so an org-bypass role is unreachable by name
        at the GraphQL layer.
        """
        enum_values = {member.value for member in PermissionTemplateEnum.__members__.values()}
        self.assertNotIn(GLOBAL_SHELTER_OPERATOR.name, enum_values)

    def test_get_template_or_raise_refuses_the_org_bypass_role(self) -> None:
        """get_template_or_raise is the resolver-layer guard: it only resolves invitable roles."""
        from common.org_types import REGISTRY
        from django.core.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            REGISTRY.get_template_or_raise(GLOBAL_SHELTER_OPERATOR.name, self.org)

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
            "permissionTemplate": PermissionTemplateEnum.CASEWORKER.name,
        }

        response = self.execute_graphql(mutation, {"data": variables})

        # No error — already-member still gets missing templates assigned and an
        # invitation created (cross-portal re-invite support).
        self.assertNotIn("messages", response["data"]["addOrganizationMember"])
        self.assertIsNotNone(response["data"]["addOrganizationMember"]["id"])
        self.assertEqual(initial_org_member_count, OrganizationUser.objects.count())

    def test_add_organization_member_mixed_case_email(self) -> None:
        """Adding with a mixed-case email finds the existing (lowercased) user
        instead of creating a duplicate or raising IntegrityError."""
        existing_member = baker.make(
            User,
            first_name="Mixed",
            last_name="Case",
            email="mixedcase@example.com",
            is_active=False,
        )

        new_member = {
            "email": "MixedCase@Example.com",
            "firstName": "Mixed",
            "middleName": "Ish",
            "lastName": "Case",
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
                        email
                    }
                }
            }
        """

        variables = {
            **new_member,
            "organizationId": self.org.pk,
            "permissionTemplate": PermissionTemplateEnum.CASEWORKER.name,
        }

        with patch("accounts.backends.CustomInvitations.send_invitation"):
            response = self.execute_graphql(mutation, {"data": variables})

        # No IntegrityError / duplicate — the existing user is reused.
        self.assertNotIn("messages", response["data"]["addOrganizationMember"])
        self.assertEqual(
            response["data"]["addOrganizationMember"]["id"],
            str(existing_member.pk),
        )
        self.assertEqual(response["data"]["addOrganizationMember"]["email"], "mixedcase@example.com")
        self.assertEqual(User.objects.filter(email="mixedcase@example.com").count(), 1)

        # The deactivated user is reactivated by member_add.
        existing_member.refresh_from_db()
        self.assertTrue(existing_member.is_active)

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
            "You cannot remove the organization owner. Transfer ownership to another member first.",
        )

        self.assertTrue(
            OrganizationUser.objects.filter(
                organization=self.org,
                user=self.org_admin,
            ).exists()
        )


@ignore_warnings(category=UserWarning)
class CreateOrganizationMutationTests(GraphQLBaseTestCase):
    """The mutation is gated on IsAuthenticated alone, so it is the attack surface.

    Fixing the service alone would leave a future resolver free to reintroduce
    resolving an organization by name; these pin the property where a caller
    actually stands.
    """

    MUTATION = """
        mutation CreateOrganization($data: CreateOrganizationInput!) {
            createOrganization(data: $data) {
                organization { id name }
            }
        }
    """

    def setUp(self) -> None:
        super().setUp()
        self.incumbent = baker.make(User, email="incumbent@example.com")
        self.organization = organization_recipe.make(
            name="Acme Housing", owner=self.incumbent, owner_roles=(CASEWORKER,)
        )
        self.outsider = baker.make(User, email="outsider@example.com")

    def _create(self, name: str) -> dict[str, Any]:
        self.graphql_client.force_login(self.outsider)
        response = self.execute_graphql(self.MUTATION, {"data": {"organizationName": name, "orgType": "shelter"}})
        self.assertIsNone(response.get("errors"))
        organization: dict[str, Any] = response["data"]["createOrganization"]["organization"]
        return organization

    def test_naming_an_existing_organization_creates_a_separate_one(self) -> None:
        created = self._create("Acme Housing")

        self.assertNotEqual(created["id"], str(self.organization.pk))
        self.assertEqual(created["name"], "Acme Housing")

    def test_naming_an_existing_organization_grants_no_membership_on_it(self) -> None:
        self._create("Acme Housing")

        self.assertFalse(OrganizationUser.objects.filter(user=self.outsider, organization=self.organization).exists())

    def test_naming_an_existing_organization_grants_no_role_on_it(self) -> None:
        self._create("Acme Housing")

        held = set(
            PermissionGroup.objects.filter(organization=self.organization, user=self.outsider).values_list(
                "template__name", flat=True
            )
        )
        self.assertSetEqual(held, set())

    def test_naming_an_existing_organization_does_not_revoke_its_members_roles(self) -> None:
        self._create("Acme Housing")

        held = set(
            PermissionGroup.objects.filter(organization=self.organization, user=self.incumbent).values_list(
                "template__name", flat=True
            )
        )
        self.assertIn(CASEWORKER.name, held)
