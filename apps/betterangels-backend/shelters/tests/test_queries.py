import datetime
from dataclasses import dataclass
from enum import IntEnum, StrEnum
from typing import Any, List
from unittest.mock import ANY

from accounts.tests.baker_recipes import organization_recipe
from django.apps import apps
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from model_bakery import baker
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
from shelters.models import ContactInfo, ExteriorPhoto, InteriorPhoto, Shelter
from test_utils.mixins import GraphQLTestCaseMixin
from unittest_parametrize import ParametrizedTestCase


@dataclass
class ShelterRelatedObject:
    field_name: str
    model_name: str
    value: StrEnum | IntEnum


class ShelterQueryTestCase(GraphQLTestCaseMixin, ParametrizedTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.maxDiff = None
        self.shelter_count = 2
        self.shelter_fields = """
            id
            bedFees
            cityCouncilDistrict
            curfew
            demographicsOther
            description
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
            shelterProgramsOther
            shelterTypesOther
            status
            subjectiveReview
            supervisorialDistrict
            totalBeds
            website
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

        self._setup_shelter()
        self._setup_shelter_related_objects()
        self._setup_shelter_contacts()
        self._setup_shelter_images()

    def _setup_shelter(self) -> None:
        self.shelter_location = Places("123 Main Street", "34.0549", "-118.2426")
        self.shelter_organization = organization_recipe.make()
        self.shelters = baker.make(
            Shelter,
            bed_fees="bed fees",
            city_council_district=1,
            curfew=datetime.time(22, 00),
            demographics_other="demographics other",
            description="description",
            email="shelter@example.com",
            entry_info="entry info",
            funders_other="funders other",
            location=self.shelter_location,
            max_stay=7,
            name="name",
            on_site_security=True,
            organization=self.shelter_organization,
            other_rules="other rules",
            other_services="other services",
            overall_rating=3,
            phone="2125551212",
            program_fees="program fees",
            room_styles_other="room styles other",
            shelter_programs_other="shelter programs other",
            shelter_types_other="shelter types other",
            subjective_review="subjective review",
            supervisorial_district=1,
            total_beds=1,
            website="shelter.com",
            _quantity=self.shelter_count,
        )

    def _setup_shelter_related_objects(self) -> None:
        shelter_related_objects: List[ShelterRelatedObject] = [
            ShelterRelatedObject(
                field_name="accessibility", model_name="Accessibility", value=AccessibilityChoices.WHEELCHAIR_ACCESSIBLE
            ),
            ShelterRelatedObject(field_name="cities", model_name="City", value=CityChoices.AGOURA_HILLS),
            ShelterRelatedObject(field_name="demographics", model_name="Demographic", value=DemographicChoices.ALL),
            ShelterRelatedObject(
                field_name="entry_requirements", model_name="EntryRequirement", value=EntryRequirementChoices.PHOTO_ID
            ),
            ShelterRelatedObject(field_name="funders", model_name="Funder", value=FunderChoices.CITY_OF_LOS_ANGELES),
            ShelterRelatedObject(
                field_name="general_services", model_name="GeneralService", value=GeneralServiceChoices.CASE_MANAGEMENT
            ),
            ShelterRelatedObject(
                field_name="health_services", model_name="HealthService", value=HealthServiceChoices.DENTAL
            ),
            ShelterRelatedObject(
                field_name="immediate_needs", model_name="ImmediateNeed", value=ImmediateNeedChoices.CLOTHING
            ),
            ShelterRelatedObject(field_name="parking", model_name="Parking", value=ParkingChoices.BICYCLE),
            ShelterRelatedObject(field_name="pets", model_name="Pet", value=PetChoices.CATS),
            ShelterRelatedObject(field_name="room_styles", model_name="RoomStyle", value=RoomStyleChoices.CONGREGANT),
            ShelterRelatedObject(
                field_name="shelter_programs", model_name="ShelterProgram", value=ShelterProgramChoices.BRIDGE_HOME
            ),
            ShelterRelatedObject(field_name="shelter_types", model_name="ShelterType", value=ShelterChoices.BUILDING),
            ShelterRelatedObject(field_name="spa", model_name="SPA", value=SPAChoices.ONE),
            ShelterRelatedObject(
                field_name="special_situation_restrictions",
                model_name="SpecialSituationRestriction",
                value=SpecialSituationRestrictionChoices.NONE,
            ),
            ShelterRelatedObject(field_name="storage", model_name="Storage", value=StorageChoices.AMNESTY_LOCKERS),
            ShelterRelatedObject(
                field_name="training_services", model_name="TrainingService", value=TrainingServiceChoices.JOB_TRAINING
            ),
        ]

        for i in shelter_related_objects:
            model_cls = apps.get_model("shelters", i.model_name)
            related_object = baker.make(model_cls, name=i.value)

            for shelter in self.shelters:
                related_manager = getattr(shelter, i.field_name)
                related_manager.add(related_object)

    def _setup_shelter_contacts(self) -> None:
        for i in range(2):
            baker.make(
                ContactInfo,
                contact_name=f"shelter contact {i}",
                contact_number=f"212555121{i}",
                shelter=self.shelters[0],
            )

    def _setup_shelter_images(self) -> None:
        file_content = (
            b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x00\x00\x00\x21\xf9\x04\x01\x0a\x00"
            b"\x01\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x4c\x01\x00\x3b"
        )
        file = SimpleUploadedFile(name="file.jpg", content=file_content)

        self.exterior_photo_0 = ExteriorPhoto.objects.create(shelter=self.shelters[0], file=file)
        self.interior_photo_0 = InteriorPhoto.objects.create(shelter=self.shelters[0], file=file)
        self.interior_photo_1 = InteriorPhoto.objects.create(shelter=self.shelters[1], file=file)

    def test_shelter_query(self) -> None:
        shelter = Shelter.objects.get(pk=self.shelters[0].pk)
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
                {"id": ANY, "contactName": "shelter contact 0", "contactNumber": "2125551210"},
                {"id": ANY, "contactName": "shelter contact 1", "contactNumber": "2125551211"},
            ],
            "exteriorPhotos": [
                {
                    "id": ANY,
                    "createdAt": ANY,
                    "file": {
                        "name": self.exterior_photo_0.file.name,
                        "url": self.exterior_photo_0.file.url,
                    },
                }
            ],
            "interiorPhotos": [
                {
                    "id": ANY,
                    "createdAt": ANY,
                    "file": {
                        "name": self.interior_photo_0.file.name,
                        "url": self.interior_photo_0.file.url,
                    },
                }
            ],
            "location": {
                "latitude": 34.0549,
                "longitude": -118.2426,
                "place": "123 Main Street",
            },
            "organization": {"id": ANY, "name": self.shelter_organization.name},
        }
        self.assertEqual(response_shelter, expected_shelter)

    def test_shelters_query(self) -> None:
        query = f"""
            query ViewShelters($offset: Int, $limit: Int) {{
                shelters(pagination: {{offset: $offset, limit: $limit}}) {{
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

        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query)

        shelters = response["data"]["shelters"]["results"]

        self.assertEqual(len(shelters), self.shelter_count)
        self.assertEqual(shelters[0]["heroImage"], self.exterior_photo_0.file.url)
        self.assertEqual(shelters[1]["heroImage"], self.interior_photo_1.file.url)

    def test_shelter_location_filter(self) -> None:
        user_location = {
            "latitude": 34.0549,
            "longitude": -118.2426,
        }

        s1, s2, s3 = [
            Shelter.objects.create(
                location=Places(
                    place=f"place {i}",
                    latitude=f"{user_location["latitude"]}{i}",
                    longitude=f"{user_location["longitude"]}{i}",
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
                    }
                }
            }
        """

        filters: dict[str, Any] = {}
        filters["geolocation"] = {
            "latitude": user_location["latitude"],
            "longitude": user_location["longitude"],
        }

        expected_query_count = 3
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query, variables={"filters": filters})

        results = response["data"]["shelters"]["results"]

        # exclude shelters generated outside the test
        filtered_results = [r["id"] for r in results if r["id"] in [str(s.pk) for s in [s1, s2, s3]]]
        self.assertEqual(filtered_results, [str(s3.pk), str(s2.pk), str(s1.pk)])
