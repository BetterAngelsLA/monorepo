from typing import Any

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


class ShelterQueryTestCase(GraphQLTestCaseMixin, ParametrizedTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.shelter_count = 3
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
        shelter_related_objects_map: dict[str, dict[str, Any]] = {
            "accessibility": {"model_name": "Accessibility", "choice": AccessibilityChoices.WHEELCHAIR_ACCESSIBLE},
            "cities": {"model_name": "City", "choice": CityChoices.AGOURA_HILLS},
            "demographics": {"model_name": "Demographic", "choice": DemographicChoices.ALL},
            "entry_requirements": {"model_name": "EntryRequirement", "choice": EntryRequirementChoices.PHOTO_ID},
            "funders": {"model_name": "Funder", "choice": FunderChoices.CITY_OF_LOS_ANGELES},
            "general_services": {"model_name": "GeneralService", "choice": GeneralServiceChoices.CASE_MANAGEMENT},
            "health_services": {"model_name": "HealthService", "choice": HealthServiceChoices.DENTAL},
            "immediate_needs": {"model_name": "ImmediateNeed", "choice": ImmediateNeedChoices.CLOTHING},
            "parking": {"model_name": "Parking", "choice": ParkingChoices.BICYCLE},
            "pets": {"model_name": "Pet", "choice": PetChoices.CATS},
            "room_styles": {"model_name": "RoomStyle", "choice": RoomStyleChoices.CONGREGANT},
            "shelter_programs": {"model_name": "ShelterProgram", "choice": ShelterProgramChoices.BRIDGE_HOME},
            "shelter_types": {"model_name": "ShelterType", "choice": ShelterChoices.BUILDING},
            "spa": {"model_name": "SPA", "choice": SPAChoices.ONE},
            "special_situation_restrictions": {
                "model_name": "SpecialSituationRestriction",
                "choice": SpecialSituationRestrictionChoices.NONE,
            },
            "storage": {"model_name": "Storage", "choice": StorageChoices.AMNESTY_LOCKERS},
            "training_services": {"model_name": "TrainingService", "choice": TrainingServiceChoices.JOB_TRAINING},
        }

        for related_name, related_object_info in shelter_related_objects_map.items():
            model_cls = apps.get_model("shelters", related_object_info["model_name"])
            related_object = baker.make(model_cls, name=related_object_info["choice"])

            for shelter in self.shelters:
                related_manager = getattr(shelter, related_name)
                related_manager.add(related_object)

    def test_shelter_query(self) -> None:
        shelter = self.shelters[0]
        query = f"""
            query ViewShelter($id: ID!) {{
                shelter(pk: $id) {{
                    {self.shelter_fields}
                }}
            }}
        """
        variables = {"id": shelter.pk}
        expected_query_count = 35

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
            "accessibility": {"name": shelter.accessibility.first().name.name},
            "cities": {"name": shelter.cities.first().name.name},
            "demographics": {"name": shelter.demographics.first().name.name},
            "entryRequirements": {"name": shelter.entry_requirements.first().name.name},
            "funders": {"name": shelter.funders.first().name.name},
            "generalServices": {"name": shelter.general_services.first().name.name},
            "healthServices": {"name": shelter.health_services.first().name.name},
            "immediateNeeds": {"name": shelter.immediate_needs.first().name.name},
            "parking": {"name": shelter.parking.first().name.name},
            "pets": {"name": shelter.pets.first().name.name},
            "roomStyles": {"name": shelter.room_styles.first().name.name},
            "shelterPrograms": {"name": shelter.shelter_programs.first().name.name},
            "shelterTypes": {"name": shelter.shelter_types.first().name.name},
            "spa": {"name": shelter.spa.first().name.name},
            "specialSituationRestrictions": {"name": shelter.special_situation_restrictions.first().name.name},
            "storage": {"name": shelter.storage.first().name.name},
            "trainingServices": {"name": shelter.training_services.first().name.name},
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

        expected_query_count = 2

        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query)

        self.assertIsNotNone(response["data"])
        self.assertEqual(len(response["data"]["shelters"]["results"]), self.shelter_count)
