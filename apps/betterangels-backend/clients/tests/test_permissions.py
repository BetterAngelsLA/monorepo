from typing import Optional

from accounts.tests.baker_recipes import permission_group_recipe
from clients.enums import (
    ClientDocumentNamespaceEnum,
    GenderEnum,
    HmisAgencyEnum,
    LanguageEnum,
)
from clients.models import ClientContact, ClientProfile, HmisProfile
from clients.tests.utils import (
    ClientContactBaseTestCase,
    ClientProfileGraphQLBaseTestCase,
    HmisProfileBaseTestCase,
)
from common.models import Attachment
from common.tests.utils import GraphQLBaseTestCase
from django.test import override_settings
from unittest_parametrize import parametrize


class ClientProfilePermissionTestCase(ClientProfileGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),
            ("client_user_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_create_client_profile_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        client_count = ClientProfile.objects.count()
        client_profile_user = {
            "firstName": "Firsty",
            "lastName": "Lasty",
            "middleName": "Middly",
            "email": "firsty_lasty@example.com",
        }
        variables = {
            "dateOfBirth": self.date_of_birth,
            "gender": GenderEnum.FEMALE.name,
            "preferredLanguage": LanguageEnum.ENGLISH.name,
            "user": client_profile_user,
        }
        response = self._create_client_profile_fixture(variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["createClientProfile"]["id"])
            self.assertEqual(client_count + 1, ClientProfile.objects.count())
        else:
            self.assertEqual(len(response["data"]["createClientProfile"]["messages"]), 1)
            self.assertEqual(
                response["data"]["createClientProfile"]["messages"][0],
                {
                    "kind": "PERMISSION",
                    "field": "createClientProfile",
                    "message": "You don't have permission to access this app.",
                },
            )
            self.assertEqual(client_count, ClientProfile.objects.count())

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),
            ("org_1_case_manager_2", True),
            ("org_2_case_manager_1", True),
            ("client_user_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_update_client_profile_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)
        original_nickname = ClientProfile.objects.get(id=self.client_profile_1["id"]).nickname

        variables = {"id": self.client_profile_1["id"], "nickname": "updated nick"}
        response = self._update_client_profile_fixture(variables)
        updated_nickname = ClientProfile.objects.get(id=self.client_profile_1["id"]).nickname

        if should_succeed:
            self.assertIsNotNone(response["data"]["updateClientProfile"]["id"])
            self.assertNotEqual(original_nickname, updated_nickname)
        else:
            self.assertEqual(len(response["errors"]), 1)
            self.assertIn(
                response["errors"][0]["message"],
                {
                    "You do not have permission to modify this client.",
                    "Cannot filter against a non-conditional expression.",
                },
            )
            self.assertEqual(original_nickname, updated_nickname)

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", True),  # CM in different org should succeed
            ("client_user_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_client_profile_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        query = """
            query ViewClientProfile($id: ID!) {
                clientProfile(pk: $id) {
                    id
                    user {
                        firstName
                        lastName
                        middleName
                        email
                    }
                }
            }
        """
        variables = {"id": self.client_profile_1["id"]}
        response = self.execute_graphql(query, variables)

        if should_succeed:
            self.assertIsNotNone(response["data"])
        else:
            self.assertIsNotNone(response["errors"])

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", True),  # CM in different org should succeed
            ("client_user_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_delete_client_profile_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        mutation = """
            mutation DeleteClientProfile($id: ID!) {
                deleteClientProfile(data: { id: $id }) {
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
        variables = {"id": self.client_profile_1["id"]}
        response = self.execute_graphql(mutation, variables)

        if should_succeed:
            self.assertIsNotNone(response["data"])
        else:
            self.assertIsNotNone(response["errors"])

    @parametrize(
        "user_label, expected_client_count",
        [
            ("org_1_case_manager_1", 2),  # Owner should succeed
            ("org_1_case_manager_2", 2),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", 2),  # CM in different org should succeed
            ("client_user_1", 0),  # Non CM should not succeed
            # NOTE: Anon user raising an error may be caused by a strawberry bug.
            # This test may fail and need updating when the bug is fixed.
            (None, None),  # Anonymous user should return error
        ],
    )
    def test_view_client_profiles_permission(self, user_label: str, expected_client_count: Optional[int]) -> None:
        self._handle_user_login(user_label)
        query = """
            query {
                clientProfiles {
                    totalCount
                }
            }
        """
        response = self.execute_graphql(query)

        if expected_client_count is not None:
            self.assertEqual(response["data"]["clientProfiles"]["totalCount"], expected_client_count)
        else:
            self.assertTrue("errors" in response)


@override_settings(DEFAULT_FILE_STORAGE="django.core.files.storage.InMemoryStorage")
class ClientDocumentPermissionTestCase(ClientProfileGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("org_1_case_manager_1")
        self.client_document = self._create_client_document_fixture(
            self.client_profile_1["id"],
            ClientDocumentNamespaceEnum.DRIVERS_LICENSE_FRONT.name,
            b"Permission test file",
            "permission.txt",
        )["data"]["createClientDocument"]
        self.graphql_client.logout()

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", True),  # CM in different org should succeed
            ("client_user_1", False),  # Client modifying client profile should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_create_client_document_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)
        response = self._create_client_document_fixture(
            self.client_profile_1["id"],
            ClientDocumentNamespaceEnum.DRIVERS_LICENSE_FRONT.name,
            b"This is a test file",
            "test.txt",
        )
        attachment_id = response.get("data", {}).get("createClientDocument", {}).get("id")
        if should_succeed:
            self.assertIsNotNone(attachment_id)
        else:
            self.assertIsNone(attachment_id)

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", False),  # CM in different org should succeed
            ("client_user_1", False),  # Client modifying client profile should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_update_client_document_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)
        variables = {
            "id": self.client_document["id"],
            "originalFilename": "Updated name",
        }

        response = self._update_client_document_fixture(variables)

        if should_succeed:
            document = Attachment.objects.get(id=self.client_document["id"])

            self.assertIsNotNone(response["data"]["updateClientDocument"]["id"])
            self.assertEqual(document.original_filename, "Updated name")
        else:
            self.assertEqual(len(response["data"]["updateClientDocument"]["messages"]), 1)
            self.assertEqual(
                response["data"]["updateClientDocument"]["messages"][0],
                {
                    "kind": "PERMISSION",
                    "field": None,
                    "message": "You don't have permission to access this app.",
                },
            )

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", False),  # CM in a different org should not succeed
            ("client_user_1", False),  # Client should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_delete_client_document_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login("org_1_case_manager_1")
        response = self._create_client_document_fixture(
            self.client_profile_1["id"],
            ClientDocumentNamespaceEnum.DRIVERS_LICENSE_FRONT.name,
            b"Test file content",
        )
        client_document_id = response["data"]["createClientDocument"]["id"]

        self._handle_user_login(user_label)
        self._delete_client_document_fixture(client_document_id)

        self.assertTrue(Attachment.objects.filter(id=client_document_id).exists() != should_succeed)

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Creator should succeed
            ("org_1_case_manager_2", True),  # Other CM in the same org should succeed
            ("org_2_case_manager_1", True),  # CM in a different org should succeed
            ("client_user_1", False),  # Client should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_client_document_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)
        query = """
            query ($id: ID!) {
                clientDocument(pk: $id) {
                    id
                }
            }
        """
        variables = {"id": self.client_profile_1_document_1["id"]}
        response = self.execute_graphql(query, variables)

        if should_succeed:
            self.assertTrue(
                "id" in response["data"]["clientDocument"],
                "Should return the attachment.",
            )
        else:
            self.assertTrue(
                "errors" in response,
                "Should not have access to view the client document.",
            )

    @parametrize(
        "user_label, expected_document_count",
        [
            ("org_1_case_manager_1", 4),  # Creator should succeed
            ("org_1_case_manager_2", 4),  # Other CM in the same org should succeed
            ("org_2_case_manager_1", 4),  # CM in a different org should succeed
            ("client_user_1", 0),  # Client should not succeed
            # NOTE: Anon user raising an error may be caused by a strawberry bug.
            # This test may fail and need updating when the bug is fixed.
            (None, None),  # Anonymous user should return error
        ],
    )
    def test_view_client_documents_permission(self, user_label: str, expected_document_count: Optional[int]) -> None:
        self._handle_user_login(user_label)

        query = """
            query {
                clientDocuments {
                    totalCount
                }
            }
        """
        response = self.execute_graphql(query)

        if expected_document_count is not None:
            self.assertEqual(response["data"]["clientDocuments"]["totalCount"], expected_document_count)
        else:
            self.assertTrue("errors" in response)


class ClientContactPermissionTestCase(ClientContactBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),
            ("org_1_case_manager_2", True),
            ("org_2_case_manager_1", True),
            ("client_user_1", False),  # Non CM user should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_client_contact_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        query = """
            query ($id: ID!) {
                clientContact(pk: $id) {
                    id
                }
            }
        """
        variables = {"id": self.client_contact_1["id"]}
        response = self.execute_graphql(query, variables)

        if should_succeed:
            self.assertEqual(response["data"]["clientContact"]["id"], self.client_contact_1["id"])
        else:
            self.assertIsNotNone(response["errors"])

    @parametrize(
        "user_label, expected_profile_count",
        [
            ("org_1_case_manager_1", 2),
            ("org_1_case_manager_2", 2),
            ("org_2_case_manager_1", 2),
            ("client_user_1", 0),  # Non CM should not succeed
            # NOTE: Anon user raising an error may be caused by a strawberry bug.
            # This test may fail and need updating when the bug is fixed.
            (None, None),  # Anonymous user should return error
        ],
    )
    def test_view_client_contacts_permission(self, user_label: str, expected_profile_count: int | None) -> None:
        self._handle_user_login(user_label)
        query = """
            query {
                clientContacts {
                    totalCount
                }
            }
        """
        response = self.execute_graphql(query)

        if expected_profile_count is not None:
            self.assertEqual(response["data"]["clientContacts"]["totalCount"], expected_profile_count)
        else:
            self.assertTrue("errors" in response)

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Case manager should succeed
            ("client_user_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_create_client_contact_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        client_contact_count = ClientContact.objects.count()
        variables = {
            "name": "Buddy Guy",
            "clientProfile": self.client_profile["id"],
        }
        response = self._create_client_contact_fixture(variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["createClientContact"]["id"])
            self.assertEqual(client_contact_count + 1, ClientContact.objects.count())
        else:
            self.assertEqual(len(response["data"]["createClientContact"]["messages"]), 1)
            self.assertEqual(
                response["data"]["createClientContact"]["messages"][0],
                {
                    "kind": "PERMISSION",
                    "field": "createClientContact",
                    "message": "You don't have permission to access this app.",
                },
            )
            self.assertEqual(client_contact_count, ClientContact.objects.count())

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),
            ("org_1_case_manager_2", True),
            ("org_2_case_manager_1", True),
            ("client_user_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_update_client_contact_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        variables = {
            "id": self.client_contact_1["id"],
            "name": "John Joe",
        }
        response = self._update_client_contact_fixture(variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["updateClientContact"]["id"])
        else:
            self.assertEqual(len(response["data"]["updateClientContact"]["messages"]), 1)
            self.assertEqual(
                response["data"]["updateClientContact"]["messages"][0],
                {
                    "kind": "PERMISSION",
                    "field": None,
                    "message": "You don't have permission to access this app.",
                },
            )

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),
            ("org_1_case_manager_2", True),
            ("org_2_case_manager_1", True),
            ("client_user_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_delete_client_contact_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        variables = {"object": "ClientContact", "object_id": self.client_contact_1["id"]}
        response = self._delete_fixture(**variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["deleteClientContact"]["id"])
        else:
            self.assertEqual(len(response["data"]["deleteClientContact"]["messages"]), 1)
            self.assertEqual(
                response["data"]["deleteClientContact"]["messages"][0],
                {
                    "kind": "PERMISSION",
                    "field": None,
                    "message": "You don't have permission to access this app.",
                },
            )


class HmisProfilePermissionTestCase(HmisProfileBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),
            ("org_1_case_manager_2", True),
            ("org_2_case_manager_1", True),
            ("client_user_1", False),  # Non CM user should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_hmis_profile_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        query = """
            query ($id: ID!) {
                hmisProfile(pk: $id) {
                    id
                }
            }
        """
        variables = {"id": self.hmis_profile_1["id"]}
        response = self.execute_graphql(query, variables)

        if should_succeed:
            self.assertEqual(response["data"]["hmisProfile"]["id"], self.hmis_profile_1["id"])
        else:
            self.assertIsNotNone(response["errors"])

    @parametrize(
        "user_label, expected_profile_count",
        [
            ("org_1_case_manager_1", 2),
            ("org_1_case_manager_2", 2),
            ("org_2_case_manager_1", 2),
            ("client_user_1", 0),  # Non CM should not succeed
            # NOTE: Anon user raising an error may be caused by a strawberry bug.
            # This test may fail and need updating when the bug is fixed.
            (None, None),  # Anonymous user should return error
        ],
    )
    def test_view_hmis_profiles_permission(self, user_label: str, expected_profile_count: int | None) -> None:
        self._handle_user_login(user_label)
        query = """
            query {
                hmisProfiles {
                    totalCount
                }
            }
        """
        response = self.execute_graphql(query)

        if expected_profile_count is not None:
            self.assertEqual(response["data"]["hmisProfiles"]["totalCount"], expected_profile_count)
        else:
            self.assertTrue("errors" in response)

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Case manager should succeed
            ("client_user_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_create_hmis_profile_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        hmis_profile_count = HmisProfile.objects.count()
        variables = {
            "hmisId": "permission test",
            "agency": HmisAgencyEnum.LAHSA.name,
            "clientProfile": self.client_profile["id"],
        }
        response = self._create_hmis_profile_fixture(variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["createHmisProfile"]["id"])
            self.assertEqual(hmis_profile_count + 1, HmisProfile.objects.count())
        else:
            self.assertEqual(len(response["data"]["createHmisProfile"]["messages"]), 1)
            self.assertEqual(
                response["data"]["createHmisProfile"]["messages"][0],
                {
                    "kind": "PERMISSION",
                    "field": "createHmisProfile",
                    "message": "You don't have permission to access this app.",
                },
            )
            self.assertEqual(hmis_profile_count, HmisProfile.objects.count())

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),
            ("org_1_case_manager_2", True),
            ("org_2_case_manager_1", True),
            ("client_user_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_update_hmis_profile_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        variables = {
            "id": self.hmis_profile_1["id"],
            "hmisId": "update",
            "agency": HmisAgencyEnum.LAHSA.name,
        }
        response = self._update_hmis_profile_fixture(variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["updateHmisProfile"]["id"])
        else:
            self.assertEqual(len(response["data"]["updateHmisProfile"]["messages"]), 1)
            self.assertEqual(
                response["data"]["updateHmisProfile"]["messages"][0],
                {
                    "kind": "PERMISSION",
                    "field": None,
                    "message": "You don't have permission to access this app.",
                },
            )

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),
            ("org_1_case_manager_2", True),
            ("org_2_case_manager_1", True),
            ("client_user_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_delete_hmis_profile_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        variables = {"object": "HmisProfile", "object_id": self.hmis_profile_1["id"]}
        response = self._delete_fixture(**variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["deleteHmisProfile"]["id"])
        else:
            self.assertEqual(len(response["data"]["deleteHmisProfile"]["messages"]), 1)
            self.assertEqual(
                response["data"]["deleteHmisProfile"]["messages"][0],
                {
                    "kind": "PERMISSION",
                    "field": None,
                    "message": "You don't have permission to access this app.",
                },
            )


class OrganizationPermissionTestCase(GraphQLBaseTestCase):
    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Case Manager should succeed
            ("client_user_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_caseworker_organizations_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        # This recipe creates an organization in the process. Including this here because even though
        # Caseworker orgs are created elsewhere in the test suite, this test should be self-contained.
        permission_group_recipe.make(name="Caseworker")

        query = """
            query CaseworkerOrganizations($pagination: OffsetPaginationInput) {
                caseworkerOrganizations(pagination: $pagination) {
                    totalCount
                    results {
                        id
                        name
                    }
                    pageInfo {
                        offset
                        limit
                    }
                }
            }
        """
        variables = {"pagination": {"offset": 0, "limit": 10}}
        response = self.execute_graphql(query, variables=variables)

        if should_succeed:
            self.assertTrue(len(response["data"]["caseworkerOrganizations"]["results"]) > 0)
        else:
            self.assertTrue(len(response["data"]["caseworkerOrganizations"]["results"]) == 0)
