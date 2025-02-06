from accounts.tests.baker_recipes import permission_group_recipe
from clients.enums import ClientDocumentNamespaceEnum, GenderEnum, LanguageEnum
from clients.models import ClientProfile
from clients.tests.utils import ClientProfileGraphQLBaseTestCase
from common.models import Attachment
from common.tests.utils import GraphQLBaseTestCase
from django.test import override_settings
from unittest_parametrize import parametrize


class ClientPermissionTestCase(ClientProfileGraphQLBaseTestCase):
    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Case manager should succeed
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
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", True),  # CM in different org should succeed
            ("client_user_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_client_profile_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        mutation = """
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
        response = self.execute_graphql(mutation, variables)

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
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", True),  # CM in different org should succeed
            ("client_user_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_client_profiles_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)
        client_count = ClientProfile.objects.count()
        mutation = """
            query ViewClientProfiles {
                clientProfiles {
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

        response = self.execute_graphql(mutation, variables)

        expected_client_count = client_count if should_succeed else 0
        self.assertTrue(len(response["data"]["clientProfiles"]) == expected_client_count)


@override_settings(DEFAULT_FILE_STORAGE="django.core.files.storage.InMemoryStorage")
class ClientDocumentPermessionTestCase(ClientProfileGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.attachment_ids = list(
            str(attachment_id) for attachment_id in (Attachment.objects.values_list("id", flat=True))
        )
        self._handle_user_login("org_1_case_manager_1")
        for _ in range(2):  # Create two attachments for testing
            response = self._create_client_document_fixture(
                self.client_profile_1["id"],
                ClientDocumentNamespaceEnum.DRIVERS_LICENSE_FRONT.name,
                b"Test file content for viewing multiple attachments",
                f"multiple_view_permission_test_{_}.txt",
            )
            self.attachment_ids.append(response["data"]["createClientDocument"]["id"])
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
            query ViewClientDocument($id: ID!) {
                clientDocument(pk: $id) {
                    id
                }
            }
        """
        variables = {"id": self.attachment_ids[0]}
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
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Creator should succeed
            ("org_1_case_manager_2", True),  # Other CM in the same org should succeed
            ("org_2_case_manager_1", True),  # CM in a different org should succeed
            ("client_user_1", False),  # Client should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_client_documents_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        query = """
            query ViewClientDocuments {
                clientDocuments {
                    id
                }
            }
        """
        response = self.execute_graphql(query)

        if should_succeed:
            returned_ids = {attachment["id"] for attachment in response["data"]["clientDocuments"]}
            expected_ids = set(self.attachment_ids)
            self.assertSetEqual(
                returned_ids,
                expected_ids,
                "Should return exactly the expected attachments for the user.",
            )
        else:
            self.assertTrue(
                len(response["data"]["clientDocuments"]) == 0,
                "Should return an empty list for client documents.",
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
    def test_view_available_organizations_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        # This recipe creates an organization in the process. Including this here because even though
        # Caseworker orgs are created elsewhere in the test suite, this test should be self-contained.
        permission_group_recipe.make(name="Caseworker")

        query = """
            query {
                availableOrganizations {
                    id
                    name
                }
            }
        """
        response = self.execute_graphql(query)

        if should_succeed:
            self.assertTrue(len(response["data"]["availableOrganizations"]) > 0)
        else:
            self.assertTrue(len(response["data"]["availableOrganizations"]) == 0)
