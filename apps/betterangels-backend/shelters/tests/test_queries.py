import datetime
from dataclasses import dataclass
from enum import IntEnum, StrEnum
from typing import List

from django.apps import apps
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
from shelters.models import Shelter
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
            location {
                latitude
                longitude
                place
            }
        """

        self._setup_shelter()
        self._setup_shelter_related_objects()

    def _setup_shelter(self) -> None:
        self.shelter_location = Places("123 Main Street", "34.0549", "-118.2426")
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

    def test_shelter_query(self) -> None:
        shelter = Shelter.objects.get(pk=self.shelters[0].pk)
        query = f"""
            query ViewShelter($id: ID!) {{
                shelter(pk: $id) {{
                    {self.shelter_fields}
                }}
            }}
        """
        variables = {"id": shelter.pk}
        expected_query_count = 18

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
            "location": {
                "latitude": 34.0549,
                "longitude": -118.2426,
                "place": "123 Main Street",
            },
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
                    }}
                }}
            }}
        """

        expected_query_count = 19

        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query)

        self.assertEqual(len(response["data"]["shelters"]["results"]), self.shelter_count)
