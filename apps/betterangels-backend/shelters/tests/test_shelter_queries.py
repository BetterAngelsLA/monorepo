import datetime
from unittest.mock import ANY, Mock, patch

import waffle
from accounts.tests.baker_recipes import organization_recipe
from common.imgproxy import IMGPROXY_SWITCH
from common.tests.utils import GraphQLBaseTestCase
from django.test import override_settings
from model_bakery.recipe import seq
from places import Places
from shelters.enums import (
    AccessibilityChoices,
    DemographicChoices,
    EntryRequirementChoices,
    ExitPolicyChoices,
    FunderChoices,
    ParkingChoices,
    PetChoices,
    ReferralRequirementChoices,
    RoomStyleChoices,
    ShelterChoices,
    ShelterProgramChoices,
    SPAChoices,
    SpecialSituationRestrictionChoices,
    StatusChoices,
    StorageChoices,
)
from shelters.models import (
    SPA,
    Accessibility,
    City,
    Demographic,
    EntryRequirement,
    ExitPolicy,
    ExteriorPhoto,
    Funder,
    InteriorPhoto,
    Parking,
    Pet,
    ReferralRequirement,
    RoomStyle,
    Service,
    ServiceCategory,
    Shelter,
    ShelterProgram,
    ShelterType,
    SpecialSituationRestriction,
    Storage,
)
from shelters.tests.baker_recipes import shelter_contact_recipe, shelter_recipe
from shelters.tests.graphql_helpers import ShelterGraphQLFixtureMixin
from waffle.testutils import override_switch


@override_settings(IS_LOCAL_DEV=True, STORAGES={"default": {"BACKEND": "django.core.files.storage.InMemoryStorage"}})
@override_switch(IMGPROXY_SWITCH, active=True)
class ShelterQueryTestCase(ShelterGraphQLFixtureMixin, GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.setup_shelter_graphql_fixtures()
        waffle.switch_is_active(IMGPROXY_SWITCH)

    @patch("common.graphql.types.build_imgproxy_url")
    def test_shelter_query(self, mock_build_imgproxy_url: Mock) -> None:
        mock_build_imgproxy_url.side_effect = lambda file, preset=None, processing_options=None: getattr(
            file, "url", None
        )
        shelter_location = Places("123 Main Street", "34.0549", "-118.2426")
        shelter_organization = organization_recipe.make()
        service_category, _ = ServiceCategory.objects.get_or_create(
            name="general",
            defaults={"display_name": "General Services", "priority": 0},
        )
        case_management, _ = Service.objects.get_or_create(
            category=service_category,
            name="case_management",
            defaults={"display_name": "Case Management", "priority": 0},
        )

        new_shelter = shelter_recipe.make(
            add_notes_sleeping_details="sleeping details notes",
            add_notes_shelter_details="shelter details notes",
            bed_fees="bed fees",
            city_council_district=1,
            curfew=datetime.time(22, 00),
            demographics_other="demographics other",
            description="description",
            email="shelter@example.com",
            emergency_surge=True,
            entry_info="entry info",
            exit_policy=[ExitPolicy.objects.get_or_create(name=ExitPolicyChoices.OTHER)[0]],
            exit_policy_other="exit policy other",
            funders_other="funders other",
            max_stay=7,
            name="name",
            on_site_security=True,
            organization=shelter_organization,
            other_rules="other rules",
            other_services="other services",
            overall_rating=3,
            phone="2125551212",
            program_fees="program fees",
            room_styles_other="room styles other",
            shelter_programs_other="shelter programs other",
            shelter_types_other="shelter types other",
            status=StatusChoices.APPROVED,
            subjective_review="subjective review",
            supervisorial_district=1,
            total_beds=1,
            website="shelter.com",
            location=shelter_location,
            accessibility=[Accessibility.objects.get_or_create(name=AccessibilityChoices.WHEELCHAIR_ACCESSIBLE)[0]],
            cities=[
                City.objects.get_or_create(
                    name="Agoura Hills",
                )[0]
            ],
            demographics=[Demographic.objects.get_or_create(name=DemographicChoices.ALL)[0]],
            entry_requirements=[EntryRequirement.objects.get_or_create(name=EntryRequirementChoices.PHOTO_ID)[0]],
            referral_requirement=[
                ReferralRequirement.objects.get_or_create(name=ReferralRequirementChoices.REFERRAL_MATCHED)[0]
            ],
            visitors_allowed=True,
            funders=[Funder.objects.get_or_create(name=FunderChoices.CITY_OF_LOS_ANGELES)[0]],
            services=[case_management],
            parking=[Parking.objects.get_or_create(name=ParkingChoices.BICYCLE)[0]],
            pets=[Pet.objects.get_or_create(name=PetChoices.CATS)[0]],
            room_styles=[RoomStyle.objects.get_or_create(name=RoomStyleChoices.CONGREGATE)[0]],
            shelter_programs=[ShelterProgram.objects.get_or_create(name=ShelterProgramChoices.BRIDGE_HOME)[0]],
            shelter_types=[ShelterType.objects.get_or_create(name=ShelterChoices.BUILDING)[0]],
            spa=[SPA.objects.get_or_create(name=SPAChoices.ONE)[0]],
            special_situation_restrictions=[
                SpecialSituationRestriction.objects.get_or_create(
                    name=SpecialSituationRestrictionChoices.NONE,
                )[0]
            ],
            storage=[Storage.objects.get_or_create(name=StorageChoices.AMNESTY_LOCKERS)[0]],
        )

        shelter = Shelter.objects.get(pk=new_shelter.pk)

        shelter_contacts = shelter_contact_recipe.make(
            contact_number=seq("212555121"),  # type: ignore
            shelter=shelter,
            _quantity=2,
        )
        shelter.additional_contacts.set(shelter_contacts)

        exterior_photo = ExteriorPhoto.objects.create(shelter=shelter, file=self.file)
        interior_photo = InteriorPhoto.objects.create(shelter=shelter, file=self.file)

        query = f"""
            query ($id: ID!) {{
                shelter(pk: $id) {{
                    {self.shelter_fields}
                    exteriorPhotos {{
                        id
                        createdAt
                        file {{
                            name
                            url (preset: ORIGINAL)
                        }}
                    }}
                    interiorPhotos {{
                        id
                        createdAt
                        file {{
                            name
                            url
                        }}
                    }}
                }}
            }}
        """
        variables = {"id": shelter.pk}
        expected_query_count = 20

        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables)

        response_shelter = response["data"]["shelter"]
        expected_shelter = {
            "id": str(shelter.pk),
            "addNotesSleepingDetails": "sleeping details notes",
            "addNotesShelterDetails": "shelter details notes",
            "bedFees": "bed fees",
            "cityCouncilDistrict": 1,
            "curfew": "22:00:00",
            "demographicsOther": "demographics other",
            "description": "description",
            "distanceInMiles": None,
            "email": "shelter@example.com",
            "emergencySurge": True,
            "entryInfo": "entry info",
            "exitPolicy": [{"name": ExitPolicyChoices.OTHER.name}],
            "exitPolicyOther": "exit policy other",
            "fundersOther": "funders other",
            "maxStay": 7,
            "name": "name",
            "onSiteSecurity": True,
            "otherRules": "other rules",
            "otherServices": "other services",
            "overallRating": 3,
            "phone": "2125551212",
            "programFees": "program fees",
            "roomStylesOther": "room styles other",
            "shelterProgramsOther": "shelter programs other",
            "shelterTypesOther": "shelter types other",
            "status": StatusChoices.APPROVED.name,
            "subjectiveReview": "subjective review",
            "supervisorialDistrict": 1,
            "totalBeds": 1,
            "website": "shelter.com",
            "accessibility": [{"name": AccessibilityChoices.WHEELCHAIR_ACCESSIBLE.name}],
            "cities": [{"name": "Agoura Hills"}],
            "demographics": [{"name": DemographicChoices.ALL.name}],
            "entryRequirements": [{"name": EntryRequirementChoices.PHOTO_ID.name}],
            "funders": [{"name": FunderChoices.CITY_OF_LOS_ANGELES.name}],
            "parking": [{"name": ParkingChoices.BICYCLE.name}],
            "pets": [{"name": PetChoices.CATS.name}],
            "referralRequirement": [{"name": ReferralRequirementChoices.REFERRAL_MATCHED.name}],
            "roomStyles": [{"name": RoomStyleChoices.CONGREGATE.name}],
            "services": [
                {
                    "name": "case_management",
                    "displayName": "Case Management",
                    "category": {
                        "name": "general",
                        "displayName": "General Services",
                    },
                }
            ],
            "shelterPrograms": [{"name": ShelterProgramChoices.BRIDGE_HOME.name}],
            "shelterTypes": [{"name": ShelterChoices.BUILDING.name}],
            "spa": [{"name": SPAChoices.ONE.name}],
            "specialSituationRestrictions": [{"name": SpecialSituationRestrictionChoices.NONE.name}],
            "storage": [{"name": StorageChoices.AMNESTY_LOCKERS.name}],
            "visitorsAllowed": True,
            "additionalContacts": [
                {"id": ANY, "contactName": "shelter contact 1", "contactNumber": "2125551211"},
                {"id": ANY, "contactName": "shelter contact 2", "contactNumber": "2125551212"},
            ],
            "exteriorPhotos": [
                {
                    "id": ANY,
                    "createdAt": ANY,
                    "file": {
                        "name": exterior_photo.file.name,
                        "url": exterior_photo.file.url,
                    },
                }
            ],
            "interiorPhotos": [
                {
                    "id": ANY,
                    "createdAt": ANY,
                    "file": {
                        "name": interior_photo.file.name,
                        "url": interior_photo.file.url,
                    },
                }
            ],
            "location": {
                "latitude": 34.0549,
                "longitude": -118.2426,
                "place": "123 Main Street",
            },
            "organization": {"id": ANY, "name": shelter_organization.name},
            "updatedAt": ANY,
        }
        self.assertEqual(response_shelter, expected_shelter)

    def test_shelter_service_categories_query(self) -> None:
        # Use a unique test category to avoid collisions with seeded data.
        category = ServiceCategory.objects.create(
            name="test_query_category",
            display_name="Test Query Category",
            priority=999,
        )
        Service.objects.create(
            category=category,
            name="case_management_test",
            display_name="Case Management",
            is_other=False,
            priority=0,
        )
        Service.objects.create(
            category=category,
            name="showers_test",
            display_name="Showers",
            is_other=True,
            priority=1,
        )

        self.graphql_client.force_login(self.org_1_case_manager_1)

        query = """
            query {
                shelterServiceCategories {
                    totalCount
                    results {
                        id
                        displayName
                        services {
                            id
                            displayName
                            isOther
                        }
                    }
                }
            }
        """

        response = self.execute_graphql(query)

        self.assertIsNone(response.get("errors"))
        categories = response["data"]["shelterServiceCategories"]["results"]
        self.assertGreaterEqual(len(categories), 1)
        test_category = next(c for c in categories if c["displayName"] == "Test Query Category")
        self.assertEqual(
            test_category["services"],
            [
                {"id": ANY, "displayName": "Case Management", "isOther": False},
                {"id": ANY, "displayName": "Showers", "isOther": True},
            ],
        )

    @patch("shelters.types.outputs.build_imgproxy_url")
    def test_shelters_query(self, mock_build_imgproxy_url: Mock) -> None:
        mock_build_imgproxy_url.side_effect = lambda file, preset=None, processing_options=None: getattr(
            file, "url", None
        )

        shelter_count = 2
        shelters = shelter_recipe.make(_quantity=shelter_count, status=StatusChoices.APPROVED)

        # create shelter in draft state that should not be included in query results
        shelter_recipe.make(status=StatusChoices.DRAFT)

        exterior_photo_0 = ExteriorPhoto.objects.create(shelter=shelters[0], file=self.file)
        InteriorPhoto.objects.create(shelter=shelters[0], file=self.file)
        interior_photo_1 = InteriorPhoto.objects.create(shelter=shelters[1], file=self.file)

        query = f"""
            query ($offset: Int, $limit: Int, $ordering: [ShelterOrder!]! = []) {{
                shelters(pagination: {{offset: $offset, limit: $limit}}, ordering: $ordering) {{
                    totalCount
                    pageInfo {{
                        limit
                        offset
                    }}
                    results {{
                        {self.shelter_fields}
                        heroImage
                    }}
                }}
            }}
        """

        expected_query_count = 21

        variables = {"ordering": {"name": "ASC"}}

        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables)

        shelters = response["data"]["shelters"]["results"]
        self.assertEqual(len(shelters), shelter_count)
        self.assertEqual(Shelter.objects.count(), shelter_count + 1)
        self.assertEqual(shelters[0]["heroImage"], exterior_photo_0.file.url)
        self.assertEqual(shelters[1]["heroImage"], interior_photo_1.file.url)
