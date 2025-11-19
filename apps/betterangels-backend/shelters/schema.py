from datetime import time
from typing import Dict, List, Optional, cast

import strawberry
import strawberry_django
from django.core.exceptions import ValidationError
from django.db import transaction
from graphql import GraphQLError
from places import Places
from shelters.enums import (
    AccessibilityChoices,
    CityChoices,
    DemographicChoices,
    EntryRequirementChoices,
    ExitPolicyChoices,
    FunderChoices,
    GeneralServiceChoices,
    HealthServiceChoices,
    ImmediateNeedChoices,
    MealServiceChoices,
    ParkingChoices,
    PetChoices,
    ReferralRequirementChoices,
    RoomStyleChoices,
    ShelterChoices as ShelterTypeChoices,
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
    ExitPolicy,
    Funder,
    GeneralService,
    HealthService,
    ImmediateNeed,
    MealService,
    Parking,
    Pet,
    ReferralRequirement,
    RoomStyle,
    Shelter,
    ShelterProgram,
    ShelterType as ShelterKind,
    SpecialSituationRestriction,
    Storage,
    TrainingService,
)
from django.db.models import QuerySet
from shelters.enums import StatusChoices
from shelters.models import Shelter
from shelters.types import ShelterType
from strawberry import ID, UNSET
from strawberry.types import Info
from strawberry_django.mutations import resolvers
from strawberry_django.pagination import OffsetPaginated


def format_validation_errors(exc: ValidationError) -> List[Dict[str, object]]:
    if hasattr(exc, "message_dict"):
        return [{"field": field, "messages": messages} for field, messages in exc.message_dict.items()]

    return [{"field": None, "messages": exc.messages}]


@strawberry.type
class Query:
    shelter: ShelterType = strawberry_django.field()

    @strawberry_django.offset_paginated(OffsetPaginated[ShelterType])
    def shelters(self) -> QuerySet:
        return Shelter.objects.filter(status=StatusChoices.APPROVED)


@strawberry.input
class ShelterLocationInput:
    place: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


@strawberry.input
class TimeRangeInput:
    start: Optional[time] = None
    end: Optional[time] = None


@strawberry.input
class CreateShelterInput:
    name: str
    description: str
    organization: Optional[ID] = None
    location: Optional[ShelterLocationInput] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    instagram: Optional[str] = None
    accessibility: List[AccessibilityChoices]
    demographics: List[DemographicChoices]
    special_situation_restrictions: List[SpecialSituationRestrictionChoices]
    shelter_types: List[ShelterTypeChoices]
    room_styles: List[RoomStyleChoices]
    storage: List[StorageChoices]
    pets: List[PetChoices]
    parking: List[ParkingChoices]
    immediate_needs: List[ImmediateNeedChoices]
    general_services: List[GeneralServiceChoices]
    health_services: List[HealthServiceChoices]
    training_services: List[TrainingServiceChoices]
    meal_services: List[MealServiceChoices]
    entry_requirements: List[EntryRequirementChoices]
    referral_requirement: List[ReferralRequirementChoices]
    exit_policy: List[ExitPolicyChoices]
    cities: List[CityChoices]
    spa: List[SPAChoices]
    shelter_programs: List[ShelterProgramChoices]
    funders: List[FunderChoices]
    status: Optional[StatusChoices] = None
    demographics_other: Optional[str] = None
    shelter_types_other: Optional[str] = None
    total_beds: Optional[int] = None
    room_styles_other: Optional[str] = None
    add_notes_sleeping_details: Optional[str] = None
    add_notes_shelter_details: Optional[str] = None
    max_stay: Optional[int] = None
    curfew: Optional[time] = None
    on_site_security: Optional[bool] = None
    visitors_allowed: Optional[bool] = None
    exit_policy_other: Optional[str] = None
    emergency_surge: Optional[bool] = None
    other_rules: Optional[str] = None
    other_services: Optional[str] = None
    entry_info: Optional[str] = None
    bed_fees: Optional[str] = None
    program_fees: Optional[str] = None
    shelter_programs_other: Optional[str] = None
    funders_other: Optional[str] = None
    subjective_review: Optional[str] = None
    city_council_district: Optional[int] = None
    supervisorial_district: Optional[int] = None
    overall_rating: Optional[int] = None
    operating_hours: Optional[List[TimeRangeInput]] = None
    intake_hours: Optional[List[TimeRangeInput]] = None


@strawberry.type
class Mutation:
    @strawberry_django.mutation
    def create_shelter(self, info: Info, input: CreateShelterInput) -> ShelterType:
        enum_field_model_map = {
            "accessibility": Accessibility,
            "demographics": Demographic,
            "special_situation_restrictions": SpecialSituationRestriction,
            "shelter_types": ShelterKind,
            "room_styles": RoomStyle,
            "storage": Storage,
            "pets": Pet,
            "parking": Parking,
            "immediate_needs": ImmediateNeed,
            "general_services": GeneralService,
            "health_services": HealthService,
            "training_services": TrainingService,
            "meal_services": MealService,
            "entry_requirements": EntryRequirement,
            "referral_requirement": ReferralRequirement,
            "exit_policy": ExitPolicy,
            "cities": City,
            "spa": SPA,
            "shelter_programs": ShelterProgram,
            "funders": Funder,
        }

        data = {key: value for key, value in strawberry.asdict(input).items() if value is not UNSET}

        m2m_values = {
            field: [getattr(option, "value", option) for option in data.pop(field, []) or []]
            for field in enum_field_model_map
        }

        organization = data.pop("organization", None)
        if organization is not None:
            data["organization_id"] = organization

        if "status" in data:
            if data["status"] is not None:
                data["status"] = getattr(data["status"], "value", data["status"])
            else:
                del data["status"]
        operating_hours = data.pop("operating_hours", None)
        if operating_hours is not None:
            try:
                data["operating_hours"] = [
                    (slot.get("start"), slot.get("end")) for slot in operating_hours if slot is not None
                ]
            except Exception as exc:
                raise GraphQLError(
                    "Invalid operating hours data.",
                    extensions={"errors": [{"field": "operating_hours", "messages": [str(exc) or "Invalid format"]}]},
                ) from exc
        intake_hours = data.pop("intake_hours", None)
        if intake_hours is not None:
            try:
                data["intake_hours"] = [(slot.get("start"), slot.get("end")) for slot in intake_hours if slot is not None]
            except Exception as exc:
                raise GraphQLError(
                    "Invalid intake hours data.",
                    extensions={"errors": [{"field": "intake_hours", "messages": [str(exc) or "Invalid format"]}]},
                ) from exc
        location = data.pop("location", None)
        if location:
            try:
                latitude = location.get("latitude")
                longitude = location.get("longitude")
                data["location"] = Places(
                    place=location.get("place"),
                    latitude=str(latitude) if latitude is not None else None,
                    longitude=str(longitude) if longitude is not None else None,
                )
            except (TypeError, ValueError) as exc:
                message = str(exc) or "Invalid location provided."
                raise GraphQLError(
                    "Invalid location data.",
                    extensions={"errors": [{"field": "location", "messages": [message]}]},
                ) from exc

        try:
            with transaction.atomic():
                shelter = resolvers.create(info, Shelter, data)

                for field, model_cls in enum_field_model_map.items():
                    try:
                        instances = [model_cls.objects.get_or_create(name=value)[0] for value in m2m_values[field]]
                    except ValidationError as exc:
                        raise GraphQLError(
                            "Validation Errors",
                            extensions={
                                "errors": [
                                    {
                                        "field": field,
                                        "messages": exc.messages,
                                    }
                                ]
                            },
                        ) from exc

                    getattr(shelter, field).set(instances)

        except ValidationError as exc:
            raise GraphQLError(
                "Validation Errors",
                extensions={"errors": format_validation_errors(exc)},
            ) from exc

        return cast(ShelterType, shelter)
