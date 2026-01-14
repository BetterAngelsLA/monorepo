import datetime
from unittest.mock import ANY, patch

from clients.enums import (
    AdaAccommodationEnum,
    EyeColorEnum,
    HairColorEnum,
    LanguageEnum,
    LivingSituationEnum,
    MaritalStatusEnum,
    PreferredCommunicationEnum,
    PronounEnum,
)
from common.models import Location, PhoneNumber
from common.tests.utils import GraphQLBaseTestCase
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.geos import Point
from django.test import TestCase, override_settings
from hmis.api_bridge import HmisApiBridge
from hmis.enums import (
    HmisDobQualityEnum,
    HmisGenderEnum,
    HmisNameQualityEnum,
    HmisRaceEnum,
    HmisSsnQualityEnum,
    HmisSuffixEnum,
    HmisVeteranStatusEnum,
)
from hmis.models import HmisClientProfile, HmisNote
from hmis.tests.utils import HmisClientProfileBaseTestCase, HmisNoteBaseTestCase
from model_bakery import baker
from notes.models import OrganizationService, ServiceRequest
from test_utils.vcr_config import scrubbed_vcr

LOGIN_MUTATION = """
    mutation ($email: String!, $password: String!) {
        hmisLogin(email: $email, password: $password) {
            __typename
            ... on UserType { id isHmisUser }
            ... on HmisLoginError { message field }
        }
    }
"""


@override_settings(HMIS_HOST="example.com", HMIS_REST_URL="https://example.com")
class HmisNoteMutationTests(HmisNoteBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.graphql_client.force_login(self.org_1_case_manager_1)
        self.hmis_client_profile = baker.make(HmisClientProfile, hmis_id="388")

    @scrubbed_vcr.use_cassette("test_create_hmis_note_mutation.yaml")
    def test_create_hmis_note_mutation(self) -> None:
        variables = {
            "hmisClientProfileId": str(self.hmis_client_profile.pk),
            "title": "pitle",
            "note": "pote",
            "date": "2010-10-10",
        }
        response = self._create_hmis_note_fixture(variables)
        note = response["data"]["createHmisNote"]

        expected = {
            "id": ANY,
            "hmisId": "517",
            "hmisClientProfile": {
                "id": str(self.hmis_client_profile.pk),
                "hmisId": self.hmis_client_profile.hmis_id,
                "firstName": self.hmis_client_profile.first_name,
                "lastName": self.hmis_client_profile.last_name,
            },
            "title": "pitle",
            "note": "pote",
            "date": "2010-10-10",
            "location": None,
            "providedServices": [],
            "requestedServices": [],
            "addedDate": "2025-11-25T01:37:07+00:00",
            "lastUpdated": "2025-11-25T01:37:07+00:00",
            "refClientProgram": None,
            "clientProgram": None,
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
        }

        self.assertEqual(expected, note)

    @scrubbed_vcr.use_cassette("test_create_hmis_program_note_mutation.yaml")
    def test_create_hmis_program_note_mutation(self) -> None:
        variables = {
            "hmisClientProfileId": str(self.hmis_client_profile.pk),
            "title": "prog note title",
            "note": "prog note note",
            "date": "2011-11-11",
            "refClientProgram": "525",
        }
        response = self._create_hmis_note_fixture(variables)
        note = response["data"]["createHmisNote"]

        expected = {
            "id": ANY,
            "hmisId": "521",
            "hmisClientProfile": {
                "id": str(self.hmis_client_profile.pk),
                "hmisId": self.hmis_client_profile.hmis_id,
                "firstName": self.hmis_client_profile.first_name,
                "lastName": self.hmis_client_profile.last_name,
            },
            "title": "prog note title",
            "note": "prog note note",
            "date": "2011-11-11",
            "location": None,
            "providedServices": [],
            "requestedServices": [],
            "addedDate": "2025-11-25T02:01:19+00:00",
            "lastUpdated": "2025-11-25T02:01:19+00:00",
            "refClientProgram": "525",
            "clientProgram": {
                "id": "525",
                "program": {
                    "id": "2",
                    "name": "Housing Program 01",
                },
            },
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
        }

        self.assertEqual(expected, note)

    @scrubbed_vcr.use_cassette("test_update_hmis_note_mutation.yaml")
    def test_update_hmis_note_mutation(self) -> None:
        hmis_note = baker.make(
            HmisNote,
            hmis_id="521",
            hmis_client_profile_id=self.hmis_client_profile.pk,
            title="prog note title",
            note="prog note note",
            date="2011-11-11",
            created_by=self.org_1_case_manager_1,
        )
        provided_services = [baker.make(ServiceRequest, service=OrganizationService.objects.first())]
        requested_services = [baker.make(ServiceRequest, service=OrganizationService.objects.last())]
        hmis_note.provided_services.set(provided_services)
        hmis_note.requested_services.set(requested_services)
        # TODO: remove after service cutover
        assert provided_services[0].service
        assert requested_services[0].service

        variables = {
            "id": str(hmis_note.pk),
            "title": "updated note title",
            "note": "updated note note",
            "date": "2012-12-12",
        }
        response = self._update_hmis_note_fixture(variables)
        note = response["data"]["updateHmisNote"]

        expected = {
            "id": ANY,
            "hmisId": "521",
            "hmisClientProfile": {
                "id": str(self.hmis_client_profile.pk),
                "hmisId": self.hmis_client_profile.hmis_id,
                "firstName": self.hmis_client_profile.first_name,
                "lastName": self.hmis_client_profile.last_name,
            },
            "title": "updated note title",
            "note": "updated note note",
            "date": "2012-12-12",
            "location": None,
            "providedServices": [
                {
                    "id": str(provided_services[0].pk),
                    "service": {
                        "id": str(provided_services[0].service.pk),
                        "label": provided_services[0].service.label,
                    },
                }
            ],
            "requestedServices": [
                {
                    "id": str(requested_services[0].pk),
                    "service": {
                        "id": str(requested_services[0].service.pk),
                        "label": requested_services[0].service.label,
                    },
                }
            ],
            "addedDate": "2025-11-25T02:01:19+00:00",
            "lastUpdated": "2025-11-25T02:04:24+00:00",
            "refClientProgram": "525",
            "clientProgram": {
                "id": "525",
                "program": {
                    "id": "2",
                    "name": "Housing Program 01",
                },
            },
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
        }

        self.assertEqual(expected, note)

    def test_update_hmis_note_location_mutation(self) -> None:
        self._setup_hmis_session()
        self._setup_location()

        hmis_note = baker.make(HmisNote, _fill_optional=True)
        hmis_note_id = hmis_note.pk
        json_address_input, address_input = self._get_address_inputs()

        location = {
            "address": json_address_input,
            "point": self.point,
            "pointOfInterest": self.point_of_interest,
        }
        variables = {
            "id": hmis_note_id,
            "location": location,
        }

        expected_query_count = 19
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self._update_hmis_note_location_fixture(variables)

        assert isinstance(address_input["addressComponents"], list)
        expected_address = {
            "street": (
                f"{address_input['addressComponents'][0]['long_name']} "
                f"{address_input['addressComponents'][1]['long_name']}"
            ),
            "city": address_input["addressComponents"][3]["long_name"],
            "state": address_input["addressComponents"][5]["short_name"],
            "zipCode": address_input["addressComponents"][7]["long_name"],
        }

        updated_note_location = response["data"]["updateHmisNoteLocation"]["location"]
        self.assertEqual(updated_note_location["point"], self.point)
        self.assertEqual(updated_note_location["address"], expected_address)

        hmis_note = HmisNote.objects.get(id=hmis_note_id)
        self.assertIsNotNone(hmis_note.location)

        location = Location.objects.get(id=hmis_note.location.pk)  # type: ignore
        self.assertEqual(hmis_note, location.hmis_notes.first())

    def test_create_hmis_note_service_request_mutation(self) -> None:
        bag_svc = OrganizationService.objects.get(label="Bag(s)")
        hmis_note = baker.make(HmisNote, _fill_optional=True)

        variables = {
            "serviceId": str(bag_svc.pk),
            "hmisNoteId": str(hmis_note.id),
            "serviceRequestType": "PROVIDED",
        }

        initial_org_service_count = OrganizationService.objects.count()

        response = self._create_hmis_note_service_request_fixture(variables)
        self.assertEqual(initial_org_service_count, OrganizationService.objects.count())

        response_service_request = response["data"]["createHmisNoteServiceRequest"]
        service_request = ServiceRequest.objects.get(id=response_service_request["id"])

        assert service_request.service
        self.assertIn(service_request, hmis_note.provided_services.all())

        self.assertEqual(response_service_request["service"]["id"], str(bag_svc.pk))
        self.assertEqual(response_service_request["service"]["label"], bag_svc.label)

        self.assertEqual(service_request.service.pk, bag_svc.pk)
        self.assertEqual(service_request.service.label, bag_svc.label)
        self.assertEqual(service_request.service.category, bag_svc.category)

    def test_create_hmis_note_service_request_other_mutation(self) -> None:
        hmis_note = baker.make(HmisNote, _fill_optional=True)
        variables = {
            "serviceOther": "another service",
            "hmisNoteId": str(hmis_note.id),
            "serviceRequestType": "PROVIDED",
        }

        initial_org_service_count = OrganizationService.objects.count()

        response = self._create_hmis_note_service_request_fixture(variables)
        self.assertEqual(initial_org_service_count + 1, OrganizationService.objects.count())

        response_service_request = response["data"]["createHmisNoteServiceRequest"]
        service_request = ServiceRequest.objects.get(id=response_service_request["id"])

        assert service_request.service
        self.assertIn(service_request, hmis_note.provided_services.all())

        self.assertEqual(response_service_request["service"]["label"], "another service")

        self.assertEqual(service_request.service.label, "another service")
        self.assertIsNone(service_request.service.category)

    def test_remove_hmis_note_service_request_mutation(self) -> None:
        provided_services = [baker.make(ServiceRequest, service=OrganizationService.objects.first())]
        requested_services = [baker.make(ServiceRequest, service=OrganizationService.objects.last())]

        hmis_note = baker.make(HmisNote, _fill_optional=True)
        hmis_note.provided_services.set(provided_services)
        hmis_note.requested_services.set(requested_services)

        service_to_remove = provided_services[0]

        variables = {
            "serviceRequestId": str(service_to_remove.pk),
            "hmisNoteId": str(hmis_note.pk),
            "serviceRequestType": "PROVIDED",
        }

        self._remove_hmis_note_service_request_fixture(variables)

        self.assertNotIn(service_to_remove, hmis_note.provided_services.all())
        self.assertIn(requested_services[0], hmis_note.requested_services.all())
        self.assertEqual(hmis_note.provided_services.count(), 0)
        self.assertEqual(hmis_note.requested_services.count(), 1)


@override_settings(HMIS_HOST="example.com", HMIS_REST_URL="https://example.com")
class HmisClientProfileMutationTests(HmisClientProfileBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.graphql_client.force_login(self.org_1_case_manager_1)
        self.residence_geolocation = [-118.2437207, 34.0521723]

        self.hmis_client_profile = baker.make(
            HmisClientProfile,
            _fill_optional=["hmis_id"],
            # ID & Metadata Fields
            added_date=datetime.datetime.strptime("2025-08-06 13:43:43", "%Y-%m-%d %H:%M:%S"),
            last_updated=datetime.datetime.strptime("2025-11-06 11:14:54", "%Y-%m-%d %H:%M:%S"),
            # Client Fields
            alias=None,
            birth_date=datetime.date.fromisoformat("2001-01-01"),
            dob_quality=HmisDobQualityEnum.FULL,
            first_name="John",
            last_name="Smith",
            name_quality=HmisNameQualityEnum.FULL,
            ssn1="***",
            ssn2="**",
            ssn3="4321",
            ssn_quality=HmisSsnQualityEnum.FULL,
            # Client Sub Fields
            age=24,
            gender=[HmisGenderEnum.WOMAN_GIRL, HmisGenderEnum.DIFFERENT],
            gender_identity_text="Gen Id",
            name_middle="B",
            name_suffix=HmisSuffixEnum.JR,
            race_ethnicity=[HmisRaceEnum.INDIGENOUS, HmisRaceEnum.ASIAN],
            additional_race_ethnicity_detail="AddlRace",
            veteran=HmisVeteranStatusEnum.YES,
            # BA Fields
            ada_accommodation=[AdaAccommodationEnum.HEARING, AdaAccommodationEnum.MOBILITY],
            address="123 Main St",
            california_id="A1357246",
            email="jbs@example.com",
            eye_color=EyeColorEnum.BLUE,
            hair_color=HairColorEnum.BLACK,
            height_in_inches=72,
            important_notes="important notes",
            living_situation=LivingSituationEnum.OPEN_AIR,
            mailing_address="123 Mail St",
            marital_status=MaritalStatusEnum.DIVORCED,
            physical_description="physdesc",
            place_of_birth="Los Angeles",
            preferred_communication=[PreferredCommunicationEnum.CALL],
            preferred_language=LanguageEnum.ARABIC,
            pronouns=PronounEnum.OTHER,
            pronouns_other="pronouns",
            residence_address="123 Res St",
            residence_geolocation=Point(self.residence_geolocation),
            spoken_languages=[LanguageEnum.ENGLISH, LanguageEnum.SPANISH],
            created_by=self.org_1_case_manager_1,
        )
        content_type = ContentType.objects.get_for_model(HmisClientProfile)
        PhoneNumber.objects.create(
            content_type=content_type,
            object_id=self.hmis_client_profile.pk,
            number="2125551212",
            is_primary=True,
        )

    @scrubbed_vcr.use_cassette("test_create_hmis_client_profile_mutation_minimal.yaml")
    def test_create_hmis_client_profile_mutation_minimal(self) -> None:
        variables = {
            "firstName": "Edgar",
            "lastName": "Poe",
            "nameQuality": HmisNameQualityEnum.FULL.name,
        }
        response = self._create_hmis_client_profile_fixture(variables)
        client = response["data"]["createHmisClientProfile"]

        expected = {
            # ID & Metadata Fields
            "id": ANY,
            "hmisId": ANY,
            "uniqueIdentifier": ANY,
            "personalId": None,
            "addedDate": ANY,
            "lastUpdated": ANY,
            # Client Fields
            "alias": None,
            "birthDate": None,
            "dobQuality": HmisDobQualityEnum.NOT_COLLECTED.name,
            "firstName": "Edgar",
            "lastName": "Poe",
            "nameQuality": HmisNameQualityEnum.FULL.name,
            "ssn1": "***",
            "ssn2": "**",
            "ssn3": "xxxx",
            "ssnQuality": HmisSsnQualityEnum.NOT_COLLECTED.name,
            # Client Sub Fields
            "age": 0,
            "gender": [HmisGenderEnum.NOT_COLLECTED.name],
            "genderIdentityText": None,
            "nameMiddle": None,
            "nameSuffix": None,
            "raceEthnicity": [HmisRaceEnum.NOT_COLLECTED.name],
            "additionalRaceEthnicityDetail": None,
            "veteran": HmisVeteranStatusEnum.NOT_COLLECTED.name,
            # BA Fields
            "adaAccommodation": None,
            "address": None,
            "californiaId": None,
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "email": None,
            "eyeColor": None,
            "hairColor": None,
            "heightInInches": None,
            "importantNotes": None,
            "livingSituation": None,
            "mailingAddress": None,
            "maritalStatus": None,
            "phoneNumbers": [],
            "physicalDescription": None,
            "placeOfBirth": None,
            "preferredCommunication": None,
            "preferredLanguage": None,
            "profilePhoto": None,
            "pronouns": None,
            "pronounsOther": None,
            "residenceAddress": None,
            "residenceGeolocation": None,
            "spokenLanguages": None,
        }

        self.assertEqual(expected, client)

    @scrubbed_vcr.use_cassette("test_update_hmis_client_profile_mutation.yaml")
    def test_update_hmis_client_profile_mutation(self) -> None:
        hmis_client_profile = baker.make(
            HmisClientProfile,
            # ID Fields
            hmis_id="384",
            unique_identifier="9AD65C3CF",
            # Client Fields
            dob_quality=HmisDobQualityEnum.NOT_COLLECTED,
            first_name="Edgar",
            last_name="Poe",
            name_quality=HmisNameQualityEnum.FULL,
            ssn3="xxxx",
            ssn_quality=HmisSsnQualityEnum.NOT_COLLECTED,
            # Client Sub Fields
            gender=[HmisGenderEnum.NOT_COLLECTED],
            race_ethnicity=[HmisRaceEnum.NOT_COLLECTED],
            veteran=HmisVeteranStatusEnum.NOT_COLLECTED,
            created_by=self.org_1_case_manager_1,
        )

        variables = {
            "id": str(hmis_client_profile.pk),
            #
            "alias": "the raven",
            "birthDate": datetime.date.fromisoformat("1909-01-19"),
            "dobQuality": HmisDobQualityEnum.FULL.name,
            "firstName": "Eddie",
            "lastName": "Po",
            "nameQuality": HmisNameQualityEnum.FULL.name,
            "ssn1": "13",
            "ssn2": "57",
            "ssn3": "9246",
            "ssnQuality": HmisSsnQualityEnum.FULL.name,
            #
            "gender": [HmisGenderEnum.MAN_BOY.name],
            "genderIdentityText": "genid",
            "nameMiddle": "Allen",
            "nameSuffix": HmisSuffixEnum.FIRST.name,
            "raceEthnicity": [HmisRaceEnum.WHITE.name],
            "additionalRaceEthnicityDetail": None,
            "veteran": HmisVeteranStatusEnum.NO.name,
            #
            "adaAccommodation": [AdaAccommodationEnum.HEARING.name],
            "address": "3 Amity St.",
            "californiaId": "R0192837",
            "email": "ed@example.com",
            "eyeColor": EyeColorEnum.BROWN.name,
            "hairColor": HairColorEnum.BROWN.name,
            "heightInInches": 68.0,
            "importantNotes": "spooky",
            "livingSituation": LivingSituationEnum.HOUSING.name,
            "mailingAddress": "3 Amity Mail St.",
            "maritalStatus": MaritalStatusEnum.SINGLE.name,
            "phoneNumbers": [{"number": "6175551212", "isPrimary": True}],
            "physicalDescription": "tall",
            "placeOfBirth": "Boston",
            "preferredCommunication": [PreferredCommunicationEnum.CALL.name],
            "preferredLanguage": LanguageEnum.ENGLISH.name,
            "profilePhoto": None,
            "pronouns": PronounEnum.HE_HIM_HIS.name,
            "pronounsOther": None,
            "residenceAddress": "3 Amity Res St.",
            "residenceGeolocation": self.residence_geolocation,
            "spokenLanguages": [LanguageEnum.ENGLISH.name],
        }
        response = self._update_hmis_client_profile_fixture(variables)
        client = response["data"]["updateHmisClientProfile"]

        expected = {
            "id": str(hmis_client_profile.pk),
            "hmisId": ANY,
            "uniqueIdentifier": ANY,
            "personalId": ANY,
            "addedDate": ANY,
            "lastUpdated": ANY,
            #
            "alias": "the raven",
            "birthDate": "1909-01-19",
            "dobQuality": HmisDobQualityEnum.FULL.name,
            "firstName": "Eddie",
            "lastName": "Po",
            "nameQuality": HmisNameQualityEnum.FULL.name,
            "ssn1": "***",
            "ssn2": "**",
            "ssn3": "9246",
            "ssnQuality": HmisSsnQualityEnum.FULL.name,
            #
            "age": 116,
            "gender": [HmisGenderEnum.MAN_BOY.name],
            "genderIdentityText": "genid",
            "nameMiddle": "Allen",
            "nameSuffix": HmisSuffixEnum.FIRST.name,
            "raceEthnicity": [HmisRaceEnum.WHITE.name],
            "additionalRaceEthnicityDetail": None,
            "veteran": HmisVeteranStatusEnum.NO.name,
            #
            "adaAccommodation": [AdaAccommodationEnum.HEARING.name],
            "address": "3 Amity St.",
            "californiaId": "R0192837",
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "email": "ed@example.com",
            "eyeColor": EyeColorEnum.BROWN.name,
            "hairColor": HairColorEnum.BROWN.name,
            "heightInInches": 68.0,
            "importantNotes": "spooky",
            "livingSituation": LivingSituationEnum.HOUSING.name,
            "mailingAddress": "3 Amity Mail St.",
            "maritalStatus": MaritalStatusEnum.SINGLE.name,
            "phoneNumbers": [{"id": ANY, "number": "6175551212", "isPrimary": True}],
            "physicalDescription": "tall",
            "placeOfBirth": "Boston",
            "preferredCommunication": [PreferredCommunicationEnum.CALL.name],
            "preferredLanguage": LanguageEnum.ENGLISH.name,
            "profilePhoto": None,
            "pronouns": PronounEnum.HE_HIM_HIS.name,
            "pronounsOther": None,
            "residenceAddress": "3 Amity Res St.",
            "residenceGeolocation": self.residence_geolocation,
            "spokenLanguages": [LanguageEnum.ENGLISH.name],
        }

        self.assertEqual(expected, client)


@override_settings(
    AUTHENTICATION_BACKENDS=["django.contrib.auth.backends.ModelBackend"],
    HMIS_REST_URL="https://example.com",
    HMIS_HOST="example.com",
)
class HmisLoginMutationTests(GraphQLBaseTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.existing_user = baker.make(get_user_model(), _fill_optional=["email"])

    @override_settings(HMIS_TOKEN_KEY="LeUjRutbzg_txpcdszNmKbpX8rFiMWLnpJtPbF2nsS0=")
    def test_hmis_login_success(self) -> None:
        token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImlhdCI6MTY3Mjc2NjAyOCwiZXhwIjoxNjc0NDk0MDI4fQ.kCak9sLJr74frSRVQp0_27BY4iBCgQSmoT3vQVWKzJg"

        with patch(
            "hmis.api_bridge.HmisApiBridge.create_auth_token",
            autospec=True,
        ) as mock_create_auth_token:

            def fake_create_auth_token(self: HmisApiBridge, username: str, password: str) -> None:
                self._set_auth_token(token)
                return None

            mock_create_auth_token.side_effect = fake_create_auth_token

            resp = self.execute_graphql(
                LOGIN_MUTATION,
                variables={"email": self.existing_user.email, "password": "anything"},
            )

        self.assertIsNone(resp.get("errors"))
        payload = resp["data"]["hmisLogin"]
        self.assertEqual(payload["__typename"], "UserType")
        self.assertEqual(payload["id"], str(self.existing_user.pk))
        self.assertEqual(payload["isHmisUser"], True)

        # Session should now contain the logged-in user
        session = self.graphql_client.session
        self.assertIn("_auth_user_id", session)
        self.assertEqual(session["_auth_user_id"], str(self.existing_user.pk))
        self.assertEqual(
            session.get("_auth_user_backend"),
            "django.contrib.auth.backends.ModelBackend",
        )

    @scrubbed_vcr.use_cassette("test_hmis_login_invalid_credentials.yaml")
    def test_hmis_login_invalid_credentials(self) -> None:
        resp = self.execute_graphql(
            LOGIN_MUTATION,
            variables={"email": self.existing_user.email, "password": "wrong"},
        )
        self.assertEqual(len(resp["errors"]), 1)
        self.assertIn("Login Failed: Invalid credentials.", resp["errors"][0]["message"])

    def test_hmis_login_unknown_email_no_autocreate(self) -> None:
        with patch(
            "hmis.api_bridge.HmisApiBridge.create_auth_token",
            return_value=None,
        ):
            resp = self.execute_graphql(
                LOGIN_MUTATION,
                variables={"email": "nonexistent_user@example.org", "password": "pw"},
            )

        self.assertIsNone(resp.get("errors"))
        payload = resp["data"]["hmisLogin"]
        self.assertEqual(payload["__typename"], "HmisLoginError")
        self.assertIn("Invalid credentials or HMIS login failed", payload["message"])
