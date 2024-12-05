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
        self.shelter_related_objects: List[ShelterRelatedObject] = [
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

        self.setup_shelters()
        self.setup_related_objects()

    def setup_shelters(self) -> None:
        shelter_location = Places("123 Main Street", "34.0549", "-118.2426")

        self.shelters = baker.make(
            Shelter,
            bed_fees="bed_fees",
            description="description",
            entry_info="entry_info",
            location=shelter_location,
            other_rules="other_rules",
            other_services="other_services",
            phone="2125551212",
            program_fees="program_fees",
            _quantity=self.shelter_count,
        )

    def setup_related_objects(self) -> None:
        for i in self.shelter_related_objects:
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
            "bedFees": shelter.bed_fees,
            "cityCouncilDistrict": shelter.city_council_district,
            "curfew": shelter.curfew,
            "demographicsOther": shelter.demographics_other,
            "description": shelter.description,
            "email": shelter.email,
            "entryInfo": shelter.entry_info,
            "fundersOther": shelter.funders_other,
            "maxStay": shelter.max_stay,
            "name": shelter.name,
            "onSiteSecurity": shelter.on_site_security,
            "otherRules": shelter.other_rules,
            "otherServices": shelter.other_services,
            "overallRating": shelter.overall_rating,
            "phone": str(shelter.phone.national_number),
            "programFees": shelter.program_fees,
            "roomStylesOther": shelter.room_styles_other,
            "shelterProgramsOther": shelter.shelter_programs_other,
            "shelterTypesOther": shelter.shelter_types_other,
            "status": shelter.status.name,
            "subjectiveReview": shelter.subjective_review,
            "supervisorialDistrict": shelter.supervisorial_district,
            "totalBeds": shelter.total_beds,
            "website": shelter.website,
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
                "latitude": float(shelter.location.latitude),
                "longitude": float(shelter.location.longitude),
                "place": shelter.location.place,
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

        self.assertIsNotNone(response["data"])
        self.assertEqual(len(response["data"]["shelters"]["results"]), self.shelter_count)
