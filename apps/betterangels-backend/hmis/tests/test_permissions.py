from unittest.mock import patch

from hmis.models import HmisClientProfile
from hmis.tests.utils import HmisClientProfileBaseTestCase
from model_bakery import baker


class HmisClientProfilePermissionTestCase(HmisClientProfileBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.hmis_client_profile = baker.make(HmisClientProfile, _fill_optional=["hmis_id"])

    def test_hmis_client_profile_permission_success(self) -> None:
        self.graphql_client.force_login(self.hmis_user)

        query = """
            query ($id: ID!) {
                hmisClientProfile(id: $id) { id }
            }
        """
        variables = {"id": str(self.hmis_client_profile.pk)}

        with patch("hmis.api_bridge.HmisApiBridge.get_client"):
            response = self.execute_graphql(query, variables)

        self.assertEqual(response["data"]["hmisClientProfile"]["id"], str(self.hmis_client_profile.pk))

    def test_hmis_client_profile_permission_denied(self) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)

        query = """
            query ($id: ID!) {
                hmisClientProfile(id: $id) { id }
            }
        """
        variables = {"id": str(self.hmis_client_profile.pk)}
        response = self.execute_graphql(query, variables)

        self.assertIsNone(response["data"])
        self.assertEqual(len(response["errors"]), 1)
        self.assertEqual(response["errors"][0]["message"], "You do not have access to this resource.")

    def test_hmis_client_profiles_permission_success(self) -> None:
        self.graphql_client.force_login(self.hmis_user)

        query = """
            query ($pagination: OffsetPaginationInput) {
                hmisClientProfiles (pagination: $pagination) {
                    totalCount
                    results { id }
                }
            }
        """

        response = self.execute_graphql(query)

        self.assertEqual(response["data"]["hmisClientProfiles"]["totalCount"], 1)
        self.assertEqual(response["data"]["hmisClientProfiles"]["results"][0]["id"], str(self.hmis_client_profile.pk))

    def test_hmis_client_profiles_permission_denied(self) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)

        query = """
            query ($pagination: OffsetPaginationInput) {
                hmisClientProfiles (pagination: $pagination) {
                    totalCount
                    results { id }
                }
            }
        """

        response = self.execute_graphql(query)

        self.assertIsNone(response["data"])
        self.assertEqual(len(response["errors"]), 1)
        self.assertEqual(response["errors"][0]["message"], "You do not have access to this resource.")

    def test_hmis_create_hmis_client_profile_permission_success(self) -> None:
        self.graphql_client.force_login(self.hmis_user)

        variables = {"firstName": "Create", "lastName": "Me", "nameQuality": "FULL"}

        with (
            patch(
                "hmis.api_bridge.HmisApiBridge.create_client",
                return_value={"hmis_id": "123", "unique_identifier": "321"},
            ) as _,
            patch("hmis.api_bridge.HmisApiBridge.create_client_program") as _,
        ):
            response = self._create_hmis_client_profile_fixture(variables)

        self.assertEqual(response["data"]["createHmisClientProfile"]["hmisId"], "123")

    def test_hmis_create_hmis_client_profile_permission_denied(self) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)

        variables = {"firstName": "Dont Create", "lastName": "Me", "nameQuality": "FULL"}
        response = self._create_hmis_client_profile_fixture(variables)

        self.assertIsNone(response["data"])
        self.assertEqual(len(response["errors"]), 1)
        self.assertEqual(response["errors"][0]["message"], "You do not have access to this resource.")

    def test_hmis_update_hmis_client_profile_permission_success(self) -> None:
        self.graphql_client.force_login(self.hmis_user)

        variables = {
            "id": str(self.hmis_client_profile.pk),
            "gender": ["NOT_COLLECTED"],
            "raceEthnicity": ["NOT_COLLECTED"],
        }

        with patch(
            "hmis.api_bridge.HmisApiBridge.update_client",
            return_value={"hmis_id": "456", "unique_identifier": "654"},
        ):
            response = self._update_hmis_client_profile_fixture(variables)

        self.assertEqual(response["data"]["updateHmisClientProfile"]["uniqueIdentifier"], "654")

    def test_hmis_update_hmis_client_profile_permission_denied(self) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)

        variables = {
            "id": str(self.hmis_client_profile.pk),
            "gender": ["NOT_COLLECTED"],
            "raceEthnicity": ["NOT_COLLECTED"],
        }
        response = self._update_hmis_client_profile_fixture(variables)

        self.assertIsNone(response["data"])
        self.assertEqual(len(response["errors"]), 1)
        self.assertEqual(response["errors"][0]["message"], "You do not have access to this resource.")
