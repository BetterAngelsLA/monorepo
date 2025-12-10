import datetime
from functools import reduce
from operator import and_, or_
from typing import Optional, Union

import strawberry
import strawberry_django
from accounts.types import UserType
from clients.enums import (
    AdaAccommodationEnum,
    LanguageEnum,
    LivingSituationEnum,
    PreferredCommunicationEnum,
)
from common.graphql.types import (
    LocationInput,
    LocationType,
    NonBlankString,
    PhoneNumberInput,
    PhoneNumberType,
    make_in_filter,
)
from django.db.models import Q, QuerySet
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
from notes.enums import ServiceRequestTypeEnum
from notes.models import ServiceRequest
from notes.types import ServiceRequestType
from strawberry import ID, Info, auto
from tasks.types import TaskType


@strawberry.type
class HmisLoginError:
    message: str
    field: Optional[str] = None


HmisLoginResult = Union[UserType, HmisLoginError]


@strawberry_django.filter_type(HmisClientProfile, lookups=True)
class HmisClientProfileFilter:
    @strawberry_django.filter_field
    def search(
        self,
        queryset: QuerySet,
        info: Info,
        value: Optional[str],
        prefix: str,
    ) -> tuple[QuerySet[HmisClientProfile], Q]:
        if value is None:
            return queryset, Q()

        search_terms = value.split()

        searchable_fields = [
            "alias",
            "first_name",
            "hmis_id",
            "last_name",
            "name_middle",
            "personal_id",
            "unique_identifier",
        ]

        # Build queries for direct fields
        direct_queries = [
            reduce(or_, [Q(**{f"{field}__istartswith": term}) for field in searchable_fields]) for term in search_terms
        ]
        direct_query = reduce(and_, direct_queries) if direct_queries else Q()

        combined_query = direct_query

        return queryset.filter(combined_query), Q()


@strawberry_django.order_type(HmisClientProfile, one_of=False)
class HmisClientProfileOrdering:
    id: auto
    first_name: auto
    last_name: auto
    added_date: auto
    last_updated: auto


@strawberry_django.type(HmisClientProfile)
class HmisClientProfileBaseType:
    # Client Fields
    alias: Optional[str]  # equivalent to BA `nickname``
    birth_date: Optional[datetime.date]  # equivalent to BA `date_of_birth`
    dob_quality: Optional[HmisDobQualityEnum]
    first_name: Optional[NonBlankString]
    last_name: Optional[NonBlankString]
    name_quality: Optional[HmisNameQualityEnum]
    ssn1: Optional[str]
    ssn2: Optional[str]
    ssn3: Optional[str]
    ssn_quality: Optional[HmisSsnQualityEnum]

    # Client Sub Fields
    gender: Optional[list[HmisGenderEnum]]  # different options from BA `gender`
    gender_identity_text: Optional[str]
    name_middle: Optional[NonBlankString]
    name_suffix: Optional[HmisSuffixEnum]
    race_ethnicity: Optional[list[HmisRaceEnum]]
    additional_race_ethnicity_detail: Optional[str]
    veteran: Optional[HmisVeteranStatusEnum]  # different options from BA `veteran_status`

    # BA Fields
    ada_accommodation: Optional[list[AdaAccommodationEnum]]
    address: auto
    california_id: auto
    email: Optional[NonBlankString]
    eye_color: auto
    hair_color: auto
    height_in_inches: auto
    important_notes: auto
    living_situation: Optional[LivingSituationEnum]
    mailing_address: auto
    marital_status: auto
    physical_description: auto
    place_of_birth: auto
    preferred_communication: Optional[list[PreferredCommunicationEnum]]
    preferred_language: auto
    profile_photo: auto
    pronouns: auto
    pronouns_other: auto
    residence_address: auto
    residence_geolocation: auto
    spoken_languages: Optional[list[LanguageEnum]]


@strawberry_django.type(
    HmisClientProfile,
    filters=HmisClientProfileFilter,
    ordering=HmisClientProfileOrdering,
    pagination=True,
)
class HmisClientProfileType(HmisClientProfileBaseType):
    id: ID
    # HMIS Fields
    hmis_id: Optional[str]
    personal_id: Optional[str]
    unique_identifier: Optional[str]
    added_date: Optional[datetime.datetime]
    last_updated: Optional[datetime.datetime]
    age: Optional[int]
    phone_numbers: Optional[list[PhoneNumberType]]  # type: ignore
    created_by: Optional[UserType]


@strawberry_django.input(HmisClientProfile, partial=True)
class CreateHmisClientProfileInput(HmisClientProfileBaseType):
    first_name: NonBlankString
    last_name: NonBlankString
    name_quality: HmisNameQualityEnum


@strawberry_django.input(HmisClientProfile, partial=True)
class UpdateHmisClientProfileInput(HmisClientProfileBaseType):
    id: ID
    gender: list[HmisGenderEnum]
    race_ethnicity: list[HmisRaceEnum]
    veteran: Optional[HmisVeteranStatusEnum]
    phone_numbers: Optional[list[PhoneNumberInput]]


@strawberry_django.filter_type(HmisNote, lookups=True)
class HmisNoteFilter:
    hmis_client_profile: Optional[ID]
    created_by: Optional[ID]
    authors = make_in_filter("created_by", ID)

    @strawberry_django.filter_field
    def search(self, queryset: QuerySet, info: Info, value: Optional[str], prefix: str) -> Q:
        if value is None:
            return Q()

        search_terms = value.split()
        query = Q()

        for term in search_terms:
            q_search = Q(
                Q(hmis_client_profile__first_name__icontains=term)
                | Q(hmis_client_profile__last_name__icontains=term)
                | Q(title__icontains=term)
                | Q(note__icontains=term)
            )

            query &= q_search

        return Q(query)


@strawberry_django.order_type(HmisNote, one_of=False)
class HmisNoteOrdering:
    id: auto
    added_date: auto
    last_updated: auto
    date: auto


@strawberry.type
class HmisProgramType:
    id: str
    name: str
    enable_notes: Optional[int] = 0


@strawberry.type
class HmisClientProgramType:
    id: str
    program: HmisProgramType


@strawberry_django.type(HmisNote, filters=HmisNoteFilter, ordering=HmisNoteOrdering)
class HmisNoteType:
    id: ID
    hmis_id: str
    hmis_client_profile: HmisClientProfileType

    added_date: Optional[datetime.datetime]
    last_updated: Optional[datetime.datetime]

    title: auto
    note: auto
    date: Optional[datetime.date]
    client_program: Optional[HmisClientProgramType]
    ref_client_program: Optional[str]

    tasks: Optional[list[TaskType]]
    created_by: Optional[UserType]
    location: Optional[LocationType]

    requested_services: Optional[list[ServiceRequestType]]
    provided_services: Optional[list[ServiceRequestType]]


@strawberry_django.input(ServiceRequest)
class CreateHmisNoteServiceRequestInput:
    hmis_note_id: ID
    service_id: Optional[ID]
    service_other: Optional[str]
    service_request_type: ServiceRequestTypeEnum


@strawberry.input
class RemoveHmisNoteServiceRequestInput:
    service_request_id: ID
    hmis_note_id: ID
    service_request_type: ServiceRequestTypeEnum


@strawberry_django.input(HmisNote)
class CreateHmisNoteInput:
    hmis_client_profile_id: str
    title: auto
    note: auto
    date: datetime.date
    ref_client_program: Optional[str]


@strawberry.type
class ProgramEnrollmentType:
    id: str
    client_id: str
    ref_client_program: str


@strawberry_django.input(HmisNote)
class UpdateHmisNoteInput:
    id: ID
    title: Optional[str]
    note: Optional[str]
    date: Optional[datetime.date]
    ref_client_program: Optional[str]


@strawberry_django.input(HmisNote)
class UpdateHmisNoteLocationInput:
    id: ID
    location: LocationInput
