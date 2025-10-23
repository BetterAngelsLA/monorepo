from typing import Optional, Union

import strawberry
from accounts.types import UserType
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


HmisCreateClientResult = Union[HmisClientType, HmisCreateClientError]
HmisGetClientNoteResult = Union[HmisClientNoteType, HmisGetClientNoteError]
HmisGetClientResult = Union[HmisClientType, HmisGetClientError]
HmisListClientNotesResult = Union[HmisClientNoteListType, HmisListClientNotesError]
HmisListClientsResult = Union[HmisClientListType, HmisListClientsError]
HmisListEnrollmentsResult = Union[HmisEnrollmentListType, HmisListEnrollmentsError]
HmisLoginResult = Union[UserType, HmisLoginError]
HmisUpdateClientResult = Union[HmisClientType, HmisUpdateClientError]
