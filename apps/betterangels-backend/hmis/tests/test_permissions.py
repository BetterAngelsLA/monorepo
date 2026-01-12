from unittest.mock import patch

from django.test import override_settings
from hmis.models import HmisClientProfile, HmisNote
from hmis.tests.utils import HmisClientProfileBaseTestCase, HmisNoteBaseTestCase
from model_bakery import baker


@override_settings(HMIS_HOST="example.com", HMIS_REST_URL="https://example.com")
class HmisClientProfilePermissionTestCase(HmisClientProfileBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

        self._setup_hmis_session()
        self.graphql_client.force_login(self.org_1_case_manager_1)
        self.hmis_client_profile = baker.make(HmisClientProfile, _fill_optional=["hmis_id"])

    def test_hmis_client_profile_permission_success(self) -> None:
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
        self._clear_hmis_session()

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
        self._clear_hmis_session()

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
        self._clear_hmis_session()

        variables = {"firstName": "Dont Create", "lastName": "Me", "nameQuality": "FULL"}
        response = self._create_hmis_client_profile_fixture(variables)

        self.assertIsNone(response["data"])
        self.assertEqual(len(response["errors"]), 1)
        self.assertEqual(response["errors"][0]["message"], "You do not have access to this resource.")

    def test_hmis_update_hmis_client_profile_permission_success(self) -> None:
        variables = {
            "id": str(self.hmis_client_profile.pk),
            "firstName": "Update Me",
            "gender": ["NOT_COLLECTED"],
            "raceEthnicity": ["NOT_COLLECTED"],
        }

        with patch(
            "hmis.api_bridge.HmisApiBridge.update_client",
            return_value={"hmis_id": "456", "unique_identifier": "654"},
        ):
            response = self._update_hmis_client_profile_fixture(variables)

        self.assertEqual(response["data"]["updateHmisClientProfile"]["uniqueIdentifier"], "654")
        self.assertEqual(HmisClientProfile.objects.get(pk=self.hmis_client_profile.pk).first_name, "Update Me")

    def test_hmis_update_hmis_client_profile_permission_denied(self) -> None:
        self._clear_hmis_session()

        variables = {
            "id": str(self.hmis_client_profile.pk),
            "gender": ["NOT_COLLECTED"],
            "raceEthnicity": ["NOT_COLLECTED"],
        }
        response = self._update_hmis_client_profile_fixture(variables)

        self.assertIsNone(response["data"])
        self.assertEqual(len(response["errors"]), 1)
        self.assertEqual(response["errors"][0]["message"], "You do not have access to this resource.")
        self.assertEqual(
            HmisClientProfile.objects.get(pk=self.hmis_client_profile.pk).first_name,
            self.hmis_client_profile.first_name,
        )


@override_settings(HMIS_HOST="example.com", HMIS_REST_URL="https://example.com")
class HmisNotePermissionTestCase(HmisNoteBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.graphql_client.force_login(self.org_1_case_manager_1)
        self.hmis_client_profile = baker.make(HmisClientProfile, _fill_optional=["hmis_id"])
        self.hmis_note = baker.make(HmisNote, hmis_client_profile=self.hmis_client_profile)

    def test_hmis_note_permission_success(self) -> None:

        query = """
            query ($id: ID!) {
                hmisNote(id: $id) { id }
            }
        """
        variables = {"id": str(self.hmis_note.pk)}

        with patch("hmis.api_bridge.HmisApiBridge.get_note") as _, patch("hmis.schema._get_client_program") as _:
            response = self.execute_graphql(query, variables)

        self.assertEqual(response["data"]["hmisNote"]["id"], str(self.hmis_note.pk))

    def test_hmis_note_permission_denied(self) -> None:
        self._clear_hmis_session()

        query = """
            query ($id: ID!) {
                hmisNote(id: $id) { id }
            }
        """
        variables = {"id": str(self.hmis_note.pk)}
        response = self.execute_graphql(query, variables)

        self.assertIsNone(response["data"])
        self.assertEqual(len(response["errors"]), 1)
        self.assertEqual(response["errors"][0]["message"], "You do not have access to this resource.")

    def test_hmis_notes_permission_success(self) -> None:
        query = """
            query ($pagination: OffsetPaginationInput) {
                hmisNotes (pagination: $pagination) {
                    totalCount
                    results { id }
                }
            }
        """

        response = self.execute_graphql(query)

        self.assertEqual(response["data"]["hmisNotes"]["totalCount"], 1)
        self.assertEqual(response["data"]["hmisNotes"]["results"][0]["id"], str(self.hmis_note.pk))

    def test_hmis_notes_permission_denied(self) -> None:
        self._clear_hmis_session()

        query = """
            query ($pagination: OffsetPaginationInput) {
                hmisNotes (pagination: $pagination) {
                    totalCount
                    results { id }
                }
            }
        """

        response = self.execute_graphql(query)

        self.assertIsNone(response["data"])
        self.assertEqual(len(response["errors"]), 1)
        self.assertEqual(response["errors"][0]["message"], "You do not have access to this resource.")

    def test_hmis_create_hmis_note_permission_success(self) -> None:
        variables = {
            "title": "Create",
            "note": "Me",
            "date": "2025-12-18",
            "hmisClientProfileId": str(self.hmis_client_profile.pk),
        }

        with patch(
            "hmis.api_bridge.HmisApiBridge.create_note",
            return_value={"hmis_id": "123"},
        ):
            response = self._create_hmis_note_fixture(variables)

        self.assertEqual(response["data"]["createHmisNote"]["hmisId"], "123")

    def test_hmis_create_hmis_note_permission_denied(self) -> None:
        self._clear_hmis_session()

        variables = {
            "title": "Dont Create",
            "note": "Me",
            "date": "2025-12-18",
            "hmisClientProfileId": str(self.hmis_client_profile.pk),
        }
        response = self._create_hmis_note_fixture(variables)

        self.assertIsNone(response["data"])
        self.assertEqual(len(response["errors"]), 1)
        self.assertEqual(response["errors"][0]["message"], "You do not have access to this resource.")

    def test_hmis_update_hmis_note_permission_success(self) -> None:
        variables = {"id": str(self.hmis_note.pk), "title": "Update", "note": "Me"}

        with patch(
            "hmis.api_bridge.HmisApiBridge.update_note",
            return_value={"title": "Update"},
        ):
            response = self._update_hmis_note_fixture(variables)

        self.assertEqual(response["data"]["updateHmisNote"]["title"], "Update")
        self.assertEqual(HmisNote.objects.get(pk=self.hmis_note.pk).title, "Update")

    def test_hmis_update_hmis_note_permission_denied(self) -> None:
        self._clear_hmis_session()

        variables = {"id": str(self.hmis_note.pk), "title": "Dont Update", "note": "Me"}
        response = self._update_hmis_note_fixture(variables)

        self.assertIsNone(response["data"])
        self.assertEqual(len(response["errors"]), 1)
        self.assertEqual(response["errors"][0]["message"], "You do not have access to this resource.")
        self.assertEqual(HmisNote.objects.get(pk=self.hmis_note.pk).title, self.hmis_note.title)
