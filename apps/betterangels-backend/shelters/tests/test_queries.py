import datetime
from typing import Any
from unittest.mock import ANY

from accounts.tests.baker_recipes import organization_recipe
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from model_bakery.recipe import seq
from places import Places
from shelters.enums import (
    AccessibilityChoices,
    CityChoices,
    DemographicChoices,
    EntryRequirementChoices,
    FunderChoices,
    GeneralServiceChoices,
    HealthServiceChoices,
    ImmediateNeedChoices,
    ParkingChoices,
    PetChoices,
    RoomStyleChoices,
    ShelterChoices,
    ShelterProgramChoices,
    SPAChoices,
    SpecialSituationRestrictionChoices,
    StatusChoices,
    StorageChoices,
    TrainingServiceChoices,
)
from shelters.models import (
    SPA,
    Accessibility,
    City,
    Demographic,
    EntryRequirement,
    ExteriorPhoto,
    Funder,
    GeneralService,
    HealthService,
    ImmediateNeed,
    InteriorPhoto,
    Parking,
    Pet,
    RoomStyle,
    Shelter,
    ShelterProgram,
    ShelterType,
    SpecialSituationRestriction,
    Storage,
    TrainingService,
)
from shelters.tests.baker_recipes import shelter_contact_recipe, shelter_recipe
from test_utils.mixins import GraphQLTestCaseMixin
from unittest_parametrize import ParametrizedTestCase


class ShelterQueryTestCase(GraphQLTestCaseMixin, ParametrizedTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        file_content = (
            b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x00\x00\x00\x21\xf9\x04\x01\x0a\x00"
            b"\x01\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x4c\x01\x00\x3b"
        )
        self.file = SimpleUploadedFile(name="file.jpg", content=file_content)

        self.shelter_fields = """
            id
            bedFees
            cityCouncilDistrict
            curfew
            demographicsOther
            description
            distanceInMiles
            email
            entryInfo
            fundersOther
            maxStay
            name
            onSiteSecurity
            otherRules
            otherServices
            overallRating
            phone
            programFees
            roomStylesOther
            shelterProgramsOther
            shelterTypesOther
            status
            subjectiveReview
            supervisorialDistrict
            totalBeds
            website
            accessibility {name}
            cities {name}
            demographics {name}
            entryRequirements {name}
            funders {name}
            generalServices {name}
            healthServices {name}
            immediateNeeds {name}
            parking {name}
            pets {name}
            roomStyles {name}
            shelterPrograms {name}
            shelterTypes {name}
            spa {name}
            specialSituationRestrictions {name}
            storage {name}
            trainingServices {name}
            additionalContacts {
                id
                contactName
                contactNumber
            }
            location {
                latitude
                longitude
                place
            }
            organization {
                id
                name
            }
        """

    def test_shelter_query(self) -> None:
        shelter_location = Places("123 Main Street", "34.0549", "-118.2426")
        shelter_organization = organization_recipe.make()

        new_shelter = shelter_recipe.make(
            bed_fees="bed fees",
            city_council_district=1,
            curfew=datetime.time(22, 00),
            demographics_other="demographics other",
            description="description",
            email="shelter@example.com",
            entry_info="entry info",
            funders_other="funders other",
            max_stay=7,
            name=seq("name "),  # type: ignore
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
            status=StatusChoices.DRAFT,
            subjective_review="subjective review",
            supervisorial_district=1,
            total_beds=1,
            website="shelter.com",
            location=shelter_location,
            accessibility=[Accessibility.objects.get_or_create(name=AccessibilityChoices.WHEELCHAIR_ACCESSIBLE)[0]],
            cities=[City.objects.get_or_create(name=CityChoices.AGOURA_HILLS)[0]],
            demographics=[Demographic.objects.get_or_create(name=DemographicChoices.ALL)[0]],
            entry_requirements=[EntryRequirement.objects.get_or_create(name=EntryRequirementChoices.PHOTO_ID)[0]],
            funders=[Funder.objects.get_or_create(name=FunderChoices.CITY_OF_LOS_ANGELES)[0]],
            general_services=[GeneralService.objects.get_or_create(name=GeneralServiceChoices.CASE_MANAGEMENT)[0]],
            health_services=[HealthService.objects.get_or_create(name=HealthServiceChoices.DENTAL)[0]],
            immediate_needs=[ImmediateNeed.objects.get_or_create(name=ImmediateNeedChoices.CLOTHING)[0]],
            parking=[Parking.objects.get_or_create(name=ParkingChoices.BICYCLE)[0]],
            pets=[Pet.objects.get_or_create(name=PetChoices.CATS)[0]],
            room_styles=[RoomStyle.objects.get_or_create(name=RoomStyleChoices.CONGREGANT)[0]],
            shelter_programs=[ShelterProgram.objects.get_or_create(name=ShelterProgramChoices.BRIDGE_HOME)[0]],
            shelter_types=[ShelterType.objects.get_or_create(name=ShelterChoices.BUILDING)[0]],
            spa=[SPA.objects.get_or_create(name=SPAChoices.ONE)[0]],
            special_situation_restrictions=[
                SpecialSituationRestriction.objects.get_or_create(
                    name=SpecialSituationRestrictionChoices.NONE,
                )[0]
            ],
            storage=[Storage.objects.get_or_create(name=StorageChoices.AMNESTY_LOCKERS)[0]],
            training_services=[TrainingService.objects.get_or_create(name=TrainingServiceChoices.JOB_TRAINING)[0]],
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
            query ViewShelter($id: ID!) {{
                shelter(pk: $id) {{
                    {self.shelter_fields}
                    exteriorPhotos {{
                        id
                        createdAt
                        file {{
                            name
                            url
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
        expected_query_count = 21

        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query, variables)

        response_shelter = response["data"]["shelter"]
        expected_shelter = {
            "id": str(shelter.pk),
            "bedFees": "bed fees",
            "cityCouncilDistrict": 1,
            "curfew": "22:00:00",
            "demographicsOther": "demographics other",
            "description": "description",
            "distanceInMiles": None,
            "email": "shelter@example.com",
            "entryInfo": "entry info",
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
            "status": StatusChoices.DRAFT.name,
            "subjectiveReview": "subjective review",
            "supervisorialDistrict": 1,
            "totalBeds": 1,
            "website": "shelter.com",
            "accessibility": [{"name": AccessibilityChoices.WHEELCHAIR_ACCESSIBLE.name}],
            "cities": [{"name": CityChoices.AGOURA_HILLS.name}],
            "demographics": [{"name": DemographicChoices.ALL.name}],
            "entryRequirements": [{"name": EntryRequirementChoices.PHOTO_ID.name}],
            "funders": [{"name": FunderChoices.CITY_OF_LOS_ANGELES.name}],
            "generalServices": [{"name": GeneralServiceChoices.CASE_MANAGEMENT.name}],
            "healthServices": [{"name": HealthServiceChoices.DENTAL.name}],
            "immediateNeeds": [{"name": ImmediateNeedChoices.CLOTHING.name}],
            "parking": [{"name": ParkingChoices.BICYCLE.name}],
            "pets": [{"name": PetChoices.CATS.name}],
            "roomStyles": [{"name": RoomStyleChoices.CONGREGANT.name}],
            "shelterPrograms": [{"name": ShelterProgramChoices.BRIDGE_HOME.name}],
            "shelterTypes": [{"name": ShelterChoices.BUILDING.name}],
            "spa": [{"name": SPAChoices.ONE.name}],
            "specialSituationRestrictions": [{"name": SpecialSituationRestrictionChoices.NONE.name}],
            "storage": [{"name": StorageChoices.AMNESTY_LOCKERS.name}],
            "trainingServices": [{"name": TrainingServiceChoices.JOB_TRAINING.name}],
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
        }
        self.assertEqual(response_shelter, expected_shelter)

    def test_shelters_query(self) -> None:
        shelter_count = 2
        shelters = shelter_recipe.make(_quantity=shelter_count)

        exterior_photo_0 = ExteriorPhoto.objects.create(shelter=shelters[0], file=self.file)
        InteriorPhoto.objects.create(shelter=shelters[0], file=self.file)
        interior_photo_1 = InteriorPhoto.objects.create(shelter=shelters[1], file=self.file)

        query = f"""
            query ViewShelters($offset: Int, $limit: Int, $order: ShelterOrder) {{
                shelters(pagination: {{offset: $offset, limit: $limit}}, order: $order) {{
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

        expected_query_count = 22
        variables = {"order": {"name": "ASC"}}

        variables = {"order": {"name": "ASC"}}

        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query, variables)

        shelters = response["data"]["shelters"]["results"]

        self.assertEqual(len(shelters), shelter_count)
        self.assertEqual(shelters[0]["heroImage"], exterior_photo_0.file.url)
        self.assertEqual(shelters[1]["heroImage"], interior_photo_1.file.url)

    def test_shelter_location_filter(self) -> None:
        reference_point = {
            "latitude": 34,
            "longitude": -118,
        }
        search_range_in_miles = 20

        s1, s2, s3 = [
            Shelter.objects.create(
                location=Places(
                    place=f"place {i}",
                    # Each subsequent shelter is ~9 miles further from the reference point.
                    latitude=f"{reference_point["latitude"]}.{i}",
                    longitude=f"{reference_point["longitude"]}.{i}",
                )
            )
            for i in range(3, 0, -1)
        ]

        query = """
            query ViewShelters($filters: ShelterLocationFilter) {
                shelters(filters: $filters) {
                    totalCount
                    results {
                        id
                        distanceInMiles
                    }
                }
            }
        """

        filters: dict[str, Any] = {}
        filters["geolocation"] = {
            "latitude": reference_point["latitude"],
            "longitude": reference_point["longitude"],
            "rangeInMiles": search_range_in_miles,
        }

        expected_query_count = 3
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query, variables={"filters": filters})

        results = response["data"]["shelters"]["results"]

        # exclude shelters generated outside the test
        filtered_results = [r["id"] for r in results if r["id"] in [str(s.pk) for s in [s1, s2, s3]]]
        # s1 is ~27 miles away from the reference point, so it was not included in the response payload
        self.assertEqual(filtered_results, [str(s3.pk), str(s2.pk)])
