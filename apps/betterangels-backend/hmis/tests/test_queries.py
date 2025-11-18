import datetime
from unittest.mock import ANY

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
from common.models import PhoneNumber
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.geos import Point
from django.test import override_settings
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
from test_utils.vcr_config import scrubbed_vcr


@override_settings(HMIS_REST_URL="https://example.com", HMIS_HOST="example.com")
class HmisNoteQueryTests(HmisNoteBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.graphql_client.force_login(self.org_1_case_manager_1)

        self.hmis_client_profile = baker.make(HmisClientProfile, hmis_id="388")
        self.hmis_note = baker.make(
            HmisNote,
            hmis_id="467",
            hmis_client_profile_id=self.hmis_client_profile.pk,
        )

    @scrubbed_vcr.use_cassette("test_hmis_note_query.yaml")
    def test_hmis_note_query(self) -> None:
        query = f"""
            query ($client_hmis_id: String!, $note_hmis_id: String!) {{
                hmisNote(clientHmisId: $client_hmis_id, noteHmisId: $note_hmis_id) {{
                    {self.hmis_note_fields}
                }}
            }}
        """
        variables = {
            "client_hmis_id": self.hmis_client_profile.hmis_id,
            "note_hmis_id": self.hmis_note.hmis_id,
        }
        response = self.execute_graphql(query, variables)

        hmis_note = response["data"]["hmisNote"]

        expected = {
            "id": ANY,
            "hmisId": "467",
            "hmisClientProfileId": str(self.hmis_client_profile.pk),
            "title": "poet",
            "note": "<p>poen</p>",
            "date": "2025-11-12",
            "addedDate": "2025-11-13T01:40:39+00:00",
            "lastUpdated": "2025-11-13T01:40:39+00:00",
            "refClientProgram": None,
            "createdBy": None,
        }

        self.assertEqual(expected, hmis_note)


@override_settings(HMIS_REST_URL="https://example.com", HMIS_HOST="example.com")
class HmisClientProfileQueryTests(HmisClientProfileBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.graphql_client.force_login(self.org_1_case_manager_1)
        self.residence_geolocation = [-118.2437207, 34.0521723]

        self.hmis_client_profile = baker.make(
            HmisClientProfile,
            # ID & Metadata Fields
            hmis_id="1",
            personal_id="7e401eed7ee14c36a7641ef44626695c",
            unique_identifier="69E44770D",
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

    @scrubbed_vcr.use_cassette("test_hmis_client_profile_query.yaml")
    def test_hmis_client_profile_query(self) -> None:
        query = f"""
            query ($hmis_id: String!) {{
                hmisClientProfile(hmisId: $hmis_id) {{
                    {self.hmis_client_profile_fields}
                }}
            }}
        """
        variables = {"hmis_id": self.hmis_client_profile.hmis_id}
        response = self.execute_graphql(query, variables)

        hmis_client_profile = response["data"]["hmisClientProfile"]
        expected = {
            # ID & metadata fields
            "hmisId": "1",
            "personalId": "7e401eed7ee14c36a7641ef44626695c",
            "uniqueIdentifier": "69E44770D",
            "addedDate": "2025-08-06T20:43:43+00:00",
            "lastUpdated": "2025-11-06T19:14:54+00:00",
            # Client fields
            "alias": None,
            "birthDate": "2001-01-01",
            "dobQuality": HmisDobQualityEnum.FULL.name,
            "firstName": "John",
            "lastName": "Smith",
            "nameQuality": HmisNameQualityEnum.FULL.name,
            "ssn1": "***",
            "ssn2": "**",
            "ssn3": "4321",
            "ssnQuality": HmisSsnQualityEnum.FULL.name,
            # SV fields
            "age": 24,
            "gender": [HmisGenderEnum.WOMAN_GIRL.name, HmisGenderEnum.DIFFERENT.name],
            "genderIdentityText": "Gen Id",
            "nameMiddle": "B",
            "nameSuffix": HmisSuffixEnum.JR.name,
            "raceEthnicity": [HmisRaceEnum.INDIGENOUS.name, HmisRaceEnum.ASIAN.name],
            "additionalRaceEthnicityDetail": "AddlRace",
            "veteran": HmisVeteranStatusEnum.YES.name,
            # BA fields
            "adaAccommodation": [AdaAccommodationEnum.HEARING.name, AdaAccommodationEnum.MOBILITY.name],
            "address": "123 Main St",
            "californiaId": "A1357246",
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "email": "jbs@example.com",
            "eyeColor": EyeColorEnum.BLUE.name,
            "hairColor": HairColorEnum.BLACK.name,
            "heightInInches": 72.0,
            "importantNotes": "important notes",
            "livingSituation": LivingSituationEnum.OPEN_AIR.name,
            "mailingAddress": "123 Mail St",
            "maritalStatus": MaritalStatusEnum.DIVORCED.name,
            "phoneNumbers": [{"id": ANY, "number": "2125551212", "isPrimary": True}],
            "physicalDescription": "physdesc",
            "placeOfBirth": "Los Angeles",
            "preferredCommunication": [PreferredCommunicationEnum.CALL.name],
            "preferredLanguage": LanguageEnum.ARABIC.name,
            "profilePhoto": None,
            "pronouns": PronounEnum.OTHER.name,
            "pronounsOther": "pronouns",
            "residenceAddress": "123 Res St",
            "residenceGeolocation": self.residence_geolocation,
            "spokenLanguages": [LanguageEnum.ENGLISH.name, LanguageEnum.SPANISH.name],
        }

        self.assertEqual(expected, hmis_client_profile)
