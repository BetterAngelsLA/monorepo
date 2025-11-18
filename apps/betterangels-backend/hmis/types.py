import datetime
from functools import reduce
from operator import and_, or_
from typing import List, Optional, Tuple, Union

import strawberry
import strawberry_django
from accounts.types import UserType
from clients.enums import (
    AdaAccommodationEnum,
    LanguageEnum,
    LivingSituationEnum,
    PreferredCommunicationEnum,
)
from common.graphql.types import NonBlankString, PhoneNumberInput, PhoneNumberType
from django.db.models import Exists, Max, OuterRef, Q, QuerySet
from hmis.enums import (
    HmisBranchEnum,
    HmisDischargeEnum,
    HmisDobQualityEnum,
    HmisGenderEnum,
    HmisNameQualityEnum,
    HmisRaceEnum,
    HmisSsnQualityEnum,
    HmisSuffixEnum,
    HmisVeteranStatusEnum,
    HmisVeteranTheaterEnum,
)
from hmis.models import HmisClientProfile, HmisNote
from strawberry import ID, Info, auto


@strawberry.type
class HmisLoginError:
    message: str
    field: Optional[str] = None


@strawberry.input
class HmisCreateClientInput:
    first_name: str
    last_name: str
    name_data_quality: Optional[int] = 99
    ssn1: Optional[str] = ""
    ssn2: Optional[str] = ""
    ssn3: Optional[str] = "xxxx"
    ssn_data_quality: Optional[int] = 99
    dob: Optional[str] = ""
    dob_data_quality: Optional[int] = 99


@strawberry.input
class HmisCreateClientNoteInput:
    personal_id: str
    enrollment_id: str
    title: str
    note: str
    date: str
    category: Optional[str] = "1"


@strawberry.input
class HmisUpdateClientNoteInput:
    id: str
    personal_id: str
    enrollment_id: str
    title: str
    note: str
    date: str
    category: Optional[str] = "1"


@strawberry.input
class HmisCreateClientSubItemsInput:
    middle_name: Optional[str] = ""
    name_suffix: Optional[int] = 9
    alias: Optional[str] = ""
    additional_race_ethnicity: Optional[str] = ""
    different_identity_text: Optional[str] = ""
    race_ethnicity: Optional[list[int]] = strawberry.field(default_factory=lambda: [99])
    gender: Optional[list[int]] = strawberry.field(default_factory=lambda: [99])
    veteran_status: Optional[int] = 99


@strawberry.input
class HmisUpdateClientInput:
    personal_id: str
    first_name: str
    last_name: str
    name_data_quality: int
    ssn1: str
    ssn2: str
    ssn3: str
    ssn_data_quality: int
    dob: str
    dob_data_quality: int


@strawberry.input
class HmisUpdateClientSubItemsInput:
    middle_name: str
    name_suffix: int
    alias: str
    additional_race_ethnicity: str
    different_identity_text: str
    race_ethnicity: list[int]
    gender: list[int]
    veteran_status: int


@strawberry.input
class HmisCreateReleaseOfInformationInput:
    permission: Optional[int]
    start_date: Optional[str]
    end_date: Optional[str]
    documentation: Optional[int]


@strawberry.input
class CreateClientInputVeteran:
    veteran_entered: str
    veteran_separated: str
    veteran_theater_ww2: HmisVeteranTheaterEnum
    veteran_theater_kw: HmisVeteranTheaterEnum
    veteran_theater_vw: HmisVeteranTheaterEnum
    veteran_theater_pg: HmisVeteranTheaterEnum
    veteran_theater_afg: HmisVeteranTheaterEnum
    veteran_theater_iraq1: HmisVeteranTheaterEnum
    veteran_theater_iraq2: HmisVeteranTheaterEnum
    veteran_theater_other: HmisVeteranTheaterEnum
    veteran_branch: HmisBranchEnum
    veteran_discharge: HmisDischargeEnum


@strawberry.type
class HmisOrganizationType:
    date_created: Optional[str]
    organization_name: Optional[str]
    coc_code: Optional[str]


@strawberry.type
class HmisClientInfoReleaseType:
    permission: Optional[int]
    start_date: Optional[str]
    end_date: Optional[str]
    documentation: Optional[int]


@strawberry.type
class HmisClientDataType:
    middle_name: Optional[str]
    name_suffix: Optional[HmisSuffixEnum]
    alias: Optional[str]
    race_ethnicity: list[HmisRaceEnum]
    additional_race_ethnicity: Optional[str]
    different_identity_text: Optional[str]
    gender: list[HmisGenderEnum]
    veteran_status: HmisVeteranStatusEnum


@strawberry.input
class HmisClientFilterInput:
    search: Optional[str] = None


@strawberry.input
class HmisPaginationInput:
    page: Optional[int] = None
    per_page: Optional[int] = 10


@strawberry.type
class HmisListMetaType:
    current_page: Optional[int]
    per_page: Optional[int]
    page_count: Optional[int]
    total_count: Optional[int]


@strawberry.type
class HmisClientType:
    personal_id: Optional[str]
    unique_identifier: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    name_data_quality: Optional[HmisNameQualityEnum]
    ssn1: Optional[str]
    ssn2: Optional[str]
    ssn3: Optional[str]
    ssn_data_quality: Optional[HmisSsnQualityEnum]
    dob: Optional[str]
    dob_data_quality: Optional[HmisDobQualityEnum]
    data: Optional[HmisClientDataType]


@strawberry.type
class HmisEnrollmentDataType:
    field: Optional[str]
    value: Optional[str]


@strawberry.type
class HmisEnrollmentHouseholdMemberType:
    personal_id: Optional[str]
    enrollment_id: Optional[str]


@strawberry.type
class HmisProjectType:
    date_created: Optional[str]
    date_updated: Optional[str]
    organization_id: Optional[str]
    project_id: Optional[str]
    project_name: Optional[str]
    project_type: Optional[str]


@strawberry.input
class HmisEnrollmentDynamicFieldsInput:
    dynamic_fields: Optional[list[str]]


@strawberry.type
class HmisEnrollmentType:
    personal_id: Optional[str]
    date_created: Optional[str]
    date_updated: Optional[str]
    enrollment_id: Optional[str]
    entry_date: Optional[str]
    exit_date: Optional[str]
    household_id: Optional[str]
    project: Optional[HmisProjectType]
    data: Optional[list[HmisEnrollmentDataType]]
    enrollment_household_members: Optional[list[HmisEnrollmentHouseholdMemberType]]


@strawberry.type
class HmisClientNoteType:
    id: Optional[str]
    title: Optional[str]
    note: Optional[str]
    date: Optional[str]
    category: Optional[str]
    client: Optional[HmisClientType]
    enrollment: Optional[HmisEnrollmentType]


@strawberry.type
class HmisClientListType:
    items: list[HmisClientType]
    meta: Optional[HmisListMetaType]


@strawberry.type
class HmisClientNoteListType:
    items: list[HmisClientNoteType]
    meta: Optional[HmisListMetaType]


@strawberry.type
class HmisEnrollmentListType:
    items: list[HmisEnrollmentType]
    meta: Optional[HmisListMetaType]


@strawberry.type
class HmisCreateClientError:
    message: str
    field: Optional[str] = None


@strawberry.type
class HmisCreateClientNoteError:
    message: str
    field: Optional[str] = None


@strawberry.type
class HmisUpdateClientNoteError:
    message: str
    field: Optional[str] = None


@strawberry.type
class HmisUpdateClientError:
    message: str
    field: Optional[str] = None


@strawberry.type
class HmisGetClientError:
    message: str
    field: Optional[str] = None


@strawberry.type
class HmisListClientsError:
    message: str
    field: Optional[str] = None


@strawberry.type
class HmisListClientNotesError:
    message: str
    field: Optional[str] = None


@strawberry.type
class HmisGetClientNoteError:
    message: str
    field: Optional[str] = None


@strawberry.type
class HmisListEnrollmentsError:
    message: str
    field: Optional[str] = None


HmisCreateClientNoteResult = Union[HmisClientNoteType, HmisCreateClientNoteError]
HmisCreateClientResult = Union[HmisClientType, HmisCreateClientError]
HmisGetClientNoteResult = Union[HmisClientNoteType, HmisGetClientNoteError]
HmisGetClientResult = Union[HmisClientType, HmisGetClientError]
HmisListClientNotesResult = Union[HmisClientNoteListType, HmisListClientNotesError]
HmisListClientsResult = Union[HmisClientListType, HmisListClientsError]
HmisListEnrollmentsResult = Union[HmisEnrollmentListType, HmisListEnrollmentsError]
HmisLoginResult = Union[UserType, HmisLoginError]
HmisUpdateClientNoteResult = Union[HmisClientNoteType, HmisUpdateClientNoteError]
HmisUpdateClientResult = Union[HmisClientType, HmisUpdateClientError]


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
    hmis_id: str
    gender: list[HmisGenderEnum]
    race_ethnicity: list[HmisRaceEnum]
    veteran: Optional[HmisVeteranStatusEnum]
    phone_numbers: Optional[list[PhoneNumberInput]]


@strawberry_django.type(HmisNote)
class HmisNoteType:
    id: ID
    hmis_id: str
    hmis_client_profile_id: str

    added_date: Optional[datetime.datetime]
    last_updated: Optional[datetime.datetime]

    title: auto
    note: auto
    date: Optional[datetime.date]
    ref_client_program: auto
    created_by: Optional[UserType]


@strawberry_django.input(HmisNote)
class CreateHmisNoteInput:
    hmis_client_profile_id: str
    title: auto
    note: auto
    date: datetime.date
    ref_client_program: auto


@strawberry_django.input(HmisNote)
class UpdateHmisNoteInput:
    id: ID
    hmis_client_profile_id: str

    title: Optional[str]
    note: Optional[str]
    date: Optional[datetime.date]
