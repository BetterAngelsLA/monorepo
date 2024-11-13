from datetime import datetime, timedelta
from typing import Optional

import time_machine
from accounts.tests.baker_recipes import organization_recipe
from clients.enums import (
    AdaAccommodationEnum,
    EyeColorEnum,
    GenderEnum,
    HairColorEnum,
    LanguageEnum,
    LivingSituationEnum,
    MaritalStatusEnum,
    PreferredCommunicationEnum,
    PronounEnum,
    RaceEnum,
    YesNoPreferNotToSayEnum,
)
from clients.models import ClientProfile
from clients.tests.utils import ClientProfileGraphQLBaseTestCase
from clients.types import MIN_INTERACTED_AGO_FOR_ACTIVE_STATUS
from django.test import override_settings
from model_bakery import baker
from notes.models import Note
from unittest_parametrize import parametrize


class ClientProfileQueryTestCase(ClientProfileGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)

    def test_client_profile_query(self) -> None:
        client_profile_id = self.client_profile_1["id"]
        document_fields = """{
            id
            file {
                name
            }
            attachmentType
            originalFilename
            namespace
        }
        """
        query = f"""
            query ViewClientProfile($id: ID!) {{
                clientProfile(pk: $id) {{
                    {self.client_profile_fields}
                    docReadyDocuments {document_fields}
                    consentFormDocuments {document_fields}
                    otherDocuments {document_fields}
                }}
            }}
        """

        variables = {"id": client_profile_id}
        expected_query_count = 12

        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables)

        client_profile = response["data"]["clientProfile"]
        expected_client_profile = {
            "id": str(client_profile_id),
            "adaAccommodation": [AdaAccommodationEnum.HEARING.name],
            "address": self.client_profile_1["address"],
            "age": self.EXPECTED_CLIENT_AGE,
            "californiaId": "L1234567",
            "consentFormDocuments": [self.client_profile_1_document_3],
            "contacts": self.client_profile_1["contacts"],
            "dateOfBirth": self.date_of_birth.strftime("%Y-%m-%d"),
            "displayCaseManager": self.client_profile_1_contact_2["name"],
            "displayGender": "Male",
            "displayPronouns": "He/Him/His",
            "docReadyDocuments": [self.client_profile_1_document_1, self.client_profile_1_document_2],
            "eyeColor": EyeColorEnum.BROWN.name,
            "gender": GenderEnum.MALE.name,
            "genderOther": None,
            "hairColor": HairColorEnum.BROWN.name,
            "heightInInches": 71.75,
            "hmisId": self.client_profile_1["hmisId"],
            "hmisProfiles": self.client_profile_1["hmisProfiles"],
            "householdMembers": self.client_profile_1["householdMembers"],
            "importantNotes": "I am very important",
            "livingSituation": LivingSituationEnum.VEHICLE.name,
            "mailingAddress": "1475 Luck Hoof M Ave, Los Angeles, CA 90046",
            "maritalStatus": MaritalStatusEnum.SINGLE.name,
            "nickname": self.client_profile_1["nickname"],
            "otherDocuments": [self.client_profile_1_document_4],
            "phoneNumber": self.client_profile_1["phoneNumber"],
            "phoneNumbers": self.client_profile_1["phoneNumbers"],
            "physicalDescription": "A human",
            "placeOfBirth": self.client_profile_1["placeOfBirth"],
            "preferredCommunication": [PreferredCommunicationEnum.CALL.name],
            "preferredLanguage": LanguageEnum.ENGLISH.name,
            "profilePhoto": {"name": self.client_profile_1_photo_name},
            "pronouns": PronounEnum.HE_HIM_HIS.name,
            "pronounsOther": None,
            "race": RaceEnum.WHITE_CAUCASIAN.name,
            "residenceAddress": "1475 Luck Hoof R Ave, Los Angeles, CA 90046",
            "socialMediaProfiles": self.client_profile_1["socialMediaProfiles"],
            "spokenLanguages": [LanguageEnum.ENGLISH.name, LanguageEnum.SPANISH.name],
            "user": self.client_profile_1["user"],
            "veteranStatus": YesNoPreferNotToSayEnum.NO.name,
        }

        self.assertEqual(client_profile, expected_client_profile)

    def test_client_profiles_query(self) -> None:
        query = f"""
            query ViewClientProfiles {{
                clientProfiles{{
                    {self.client_profile_fields}
                }}
            }}
        """
        expected_query_count = 8
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query)

        client_profiles = response["data"]["clientProfiles"]
        client_profile_count = ClientProfile.objects.count()
        self.assertEqual(client_profile_count, len(client_profiles))

    @parametrize(
        ("sort_order, expected_first_name"),
        [("ASC", "Mister"), ("DESC", "Todd")],
    )
    def test_client_profiles_query_order(self, sort_order: Optional[str], expected_first_name: str) -> None:
        query = """
            query ViewClientProfiles($order: ClientProfileOrder) {
                clientProfiles(order: $order) {
                    id
                    user {
                        firstName
                    }
                }
            }
        """
        expected_query_count = 3
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables={"order": {"user_FirstName": sort_order}})

        client_profiles = response["data"]["clientProfiles"]
        self.assertEqual(client_profiles[0]["user"]["firstName"], expected_first_name)
        self.assertEqual(len(client_profiles), ClientProfile.objects.count())

    @parametrize(
        ("search_value, is_active, expected_client_profile_count"),
        [
            (None, None, 2),  # no filters
            (None, False, 1),  # active filter false
            (None, True, 1),  # active filter true
            ("tod ch gust toa", None, 1),  # name search matching inactive client
            ("tod", False, 1),  # first_name search matching inactive client + active filter false
            ("tod", True, 0),  # first_name search matching inactive client + active filter true
            ("pea mi tr", None, 0),  # name search matching matching no clients
            ("pea", False, 0),  # last_name search matching active client + active filter false
            ("pea", True, 1),  # last_name search matching active client + active filter true
            ("tod pea", None, 0),  # no match first_name, last_name search + active filter false
            ("HMISid", None, 2),  # hmis_id search matching both clients
            ("HMISid", False, 1),  # hmis_id search matching both clients + active filter false
            ("HMISid", True, 1),  # hmis_id search matching both clients + active filter true
            ("HMISidL", False, 1),  # hmis_id search matching inactive client
            ("HMISidL", True, 0),  # hmis_id search matching inactive client + active filter true
            ("HMISidP", False, 0),  # hmis_id search matching active client + active filter false
            ("HMISidP", True, 1),  # hmis_id search matching active client + active filter true
        ],
    )
    def test_client_profiles_query_search(
        self, search_value: Optional[str], is_active: Optional[bool], expected_client_profile_count: int
    ) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)

        organization = organization_recipe.make()
        client_profile_1 = ClientProfile.objects.get(id=self.client_profile_1["id"])
        client_profile_2 = ClientProfile.objects.get(id=self.client_profile_2["id"])
        # Make two notes for Client 1 (Chavez, inactive)
        baker.make(Note, organization=organization, client=client_profile_1.user)
        baker.make(Note, organization=organization, client=client_profile_1.user)

        query = """
            query ClientProfiles($isActive: Boolean, $search: String) {
                clientProfiles(filters: {isActive: $isActive, search: $search}) {
                    id
                }
            }
        """

        # Advance time 91 days (active client threshold)
        with time_machine.travel(datetime.now(), tick=False) as traveller:
            traveller.shift(timedelta(days=MIN_INTERACTED_AGO_FOR_ACTIVE_STATUS["days"] + 1))

            # Make two notes for Client 2 (Peanutbutter, active)
            baker.make(Note, organization=organization, client=client_profile_2.user)
            baker.make(
                Note,
                organization=organization,
                client=client_profile_2.user,
            )

            expected_query_count = 3
            with self.assertNumQueriesWithoutCache(expected_query_count):
                response = self.execute_graphql(query, variables={"search": search_value, "isActive": is_active})

        client_profiles = response["data"]["clientProfiles"]
        self.assertEqual(len(client_profiles), expected_client_profile_count)

    @parametrize(
        ("first_name, last_name, middle_name, expected_client_profile_count"),
        [
            (" ", " ", " ", 0),  # no filters
            ("Todd", None, None, 1),  # exact match on first name only
            (None, "Chavez", None, 2),  # exact match on last name only
            ("Tod", "Chavez", None, 0),  # inexact match on first name
            ("Todd", "Chave", None, 0),  # inexact match on last name
            ("Todd", "Chavez", "Eleanor", 0),  # inexact match on middle name
            ("Todd", "Chavez", None, 1),  # exact match on first & last name
            (" Todd ", " Chavez ", None, 1),  # exact match on first & last name (whitespace stripped)
            ("Todd", "Chavez", "Gustav", 1),  # exact match on first & last name & middle name
            ("Todd Gustav", "Chavez", None, 1),  # exact match on first & last name
        ],
    )
    def test_client_profiles_query_search_client_by_name(
        self, first_name: str, last_name: str, middle_name: str | None, expected_client_profile_count: int
    ) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)

        # create a new client with similar name to client 1, with space in first name
        self._create_client_profile_fixture(
            {
                "user": {
                    "firstName": "TODD GUSTAV",
                    "lastName": "CHAVEZ",
                    "middleName": None,
                    "email": "tchavez@pblivin.com",
                }
            }
        )

        query = """
            query ClientProfiles($searchClient: ClientSearchInput) {
                clientProfiles(filters: {searchClient: $searchClient}) {
                    id
                }
            }
        """

        search_fields = {
            **({"firstName": first_name} if first_name else {}),
            **({"lastName": last_name} if last_name else {}),
            **({"middleName": middle_name} if middle_name else {}),
        }

        response = self.execute_graphql(query, variables={"searchClient": search_fields})

        client_profiles = response["data"]["clientProfiles"]
        self.assertEqual(len(client_profiles), expected_client_profile_count)

    @parametrize(
        ("california_id, excluded_client_profile, expected_client_profile_count"),
        [
            ("X0000000", None, 0),  # no match
            ("L1234567", None, 1),  # match exists
            ("L1234567", "client_profile_1", 0),  # match exists only on current client
            ("L123456", None, 0),  # no match on partial id
        ],
    )
    def test_client_profiles_query_search_client_by_california_id(
        self,
        california_id: str,
        excluded_client_profile: Optional[str],
        expected_client_profile_count: int,
    ) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)

        query = """
            query ClientProfiles($searchClient: ClientSearchInput) {
                clientProfiles(filters: {searchClient: $searchClient}) {
                    id
                }
            }
        """

        search_fields = {"californiaId": california_id}

        if excluded_client_profile:
            search_fields["excludedClientProfileId"] = getattr(self, excluded_client_profile)["id"]

        response = self.execute_graphql(query, variables={"searchClient": search_fields})

        client_profiles = response["data"]["clientProfiles"]
        self.assertEqual(len(client_profiles), expected_client_profile_count)


@override_settings(DEFAULT_FILE_STORAGE="django.core.files.storage.InMemoryStorage")
class ClientDocumentQueryTestCase(ClientProfileGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

    def test_client_document_query(self) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)
        query = """
            query ViewClientDocument($id: ID!) {
                clientDocument(pk: $id) {
                    id
                    file {
                        name
                    }
                    attachmentType
                    originalFilename
                    namespace
                }
            }
        """
        variables = {"id": self.client_profile_1_document_1["id"]}
        response = self.execute_graphql(query, variables)

        self.assertEqual(
            response["data"]["clientDocument"],
            self.client_profile_1_document_1,
        )

    def test_client_documents_query(self) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)
        query = """
            query ViewClientDocuments {
                clientDocuments {
                    id
                    file {
                        name
                    }
                    attachmentType
                    originalFilename
                    namespace
                }
            }
        """
        response = self.execute_graphql(query)

        self.assertEqual(
            response["data"]["clientDocuments"],
            [
                self.client_profile_1_document_1,
                self.client_profile_1_document_2,
                self.client_profile_1_document_3,
                self.client_profile_1_document_4,
            ],
        )
