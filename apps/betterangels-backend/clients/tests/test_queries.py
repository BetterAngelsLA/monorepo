from datetime import datetime, timedelta
from typing import Optional

import time_machine
from accounts.tests.baker_recipes import organization_recipe
from clients.enums import (
    AccommodationEnum,
    EyeColorEnum,
    GenderEnum,
    HairColorEnum,
    LanguageEnum,
    LivingSituationEnum,
    MaritalStatusEnum,
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
        expected_query_count = 10

        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables)

        client_profile = response["data"]["clientProfile"]
        expected_client_profile = {
            "id": str(client_profile_id),
            "adaAccommodation": [AccommodationEnum.HEARING.name],
            "address": self.client_profile_1["address"],
            "age": self.EXPECTED_CLIENT_AGE,
            "consentFormDocuments": [self.client_profile_1_document_3],
            "contacts": self.client_profile_1["contacts"],
            "dateOfBirth": self.date_of_birth.strftime("%Y-%m-%d"),
            "displayCaseManager": self.client_profile_1_contact_2["name"],
            "displayPronouns": "He/Him/His",
            "docReadyDocuments": [self.client_profile_1_document_1, self.client_profile_1_document_2],
            "eyeColor": EyeColorEnum.BROWN.name,
            "gender": GenderEnum.MALE.name,
            "hairColor": HairColorEnum.BROWN.name,
            "heightInInches": 71.75,
            "hmisId": self.client_profile_1["hmisId"],
            "hmisProfiles": self.client_profile_1["hmisProfiles"],
            "householdMembers": self.client_profile_1["householdMembers"],
            "livingSituation": LivingSituationEnum.VEHICLE.name,
            "maritalStatus": MaritalStatusEnum.SINGLE.name,
            "nickname": self.client_profile_1["nickname"],
            "otherDocuments": [self.client_profile_1_document_4],
            "phoneNumber": self.client_profile_1["phoneNumber"],
            "physicalDescription": "A human",
            "placeOfBirth": self.client_profile_1["placeOfBirth"],
            "preferredLanguage": LanguageEnum.ENGLISH.name,
            "profilePhoto": {"name": self.client_profile_1_photo_name},
            "pronouns": PronounEnum.HE_HIM_HIS.name,
            "pronounsOther": None,
            "race": RaceEnum.WHITE_CAUCASIAN.name,
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
        expected_query_count = 6
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
