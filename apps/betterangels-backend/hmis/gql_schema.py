from typing import Any, Optional, cast

import strawberry
from accounts.types import UserType
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth import login as django_login
from hmis.enums import HmisGenderEnum, HmisRaceEnum, HmisVeteranStatusEnum
from strawberry.types import Info

from .gql_api_bridge import HmisGraphQLApiBridge
from .types import (
    HmisClientDataType,
    HmisClientFilterInput,
    HmisClientListType,
    HmisClientNoteListType,
    HmisClientNoteType,
    HmisClientType,
    HmisCreateClientError,
    HmisCreateClientInput,
    HmisCreateClientNoteError,
    HmisCreateClientNoteInput,
    HmisCreateClientNoteResult,
    HmisCreateClientResult,
    HmisCreateClientSubItemsInput,
    HmisEnrollmentDataType,
    HmisEnrollmentHouseholdMemberType,
    HmisEnrollmentListType,
    HmisEnrollmentType,
    HmisGetClientError,
    HmisGetClientNoteError,
    HmisGetClientNoteResult,
    HmisGetClientResult,
    HmisListClientNotesError,
    HmisListClientNotesResult,
    HmisListClientsError,
    HmisListClientsResult,
    HmisListEnrollmentsError,
    HmisListEnrollmentsResult,
    HmisListMetaType,
    HmisLoginError,
    HmisLoginResult,
    HmisPaginationInput,
    HmisProjectType,
    HmisUpdateClientError,
    HmisUpdateClientInput,
    HmisUpdateClientNoteError,
    HmisUpdateClientNoteInput,
    HmisUpdateClientNoteResult,
    HmisUpdateClientResult,
    HmisUpdateClientSubItemsInput,
)

User = get_user_model()


def get_client_data_from_response(client_data_response: Optional[dict[str, Any]]) -> Optional[HmisClientDataType]:
    if not client_data_response:
        return None

    race_ethnicity_data = client_data_response.get("raceEthnicity") or []
    gender_data = client_data_response.get("gender") or []

    veteran_status_data = client_data_response.get("veteranStatus")
    veteran_status = (
        HmisVeteranStatusEnum(veteran_status_data)
        if veteran_status_data is not None
        else HmisVeteranStatusEnum.NOT_COLLECTED
    )

    return HmisClientDataType(
        middle_name=client_data_response.get("middleName", None),
        name_suffix=client_data_response.get("nameSuffix", None),
        alias=client_data_response.get("alias", None),
        race_ethnicity=[HmisRaceEnum(r) for r in race_ethnicity_data],
        additional_race_ethnicity=client_data_response.get("additionalRaceEthnicity", None),
        gender=[HmisGenderEnum(g) for g in gender_data],
        different_identity_text=client_data_response.get("differentIdentityText", None),
        veteran_status=veteran_status,
    )


def get_client_from_response(client_response: dict[str, Any]) -> HmisClientType:
    return HmisClientType(
        personal_id=client_response.get("personalId"),
        unique_identifier=client_response.get("uniqueIdentifier"),
        first_name=client_response.get("firstName"),
        last_name=client_response.get("lastName"),
        name_data_quality=client_response.get("nameDataQuality"),
        ssn1=client_response.get("ssn1"),
        ssn2=client_response.get("ssn2"),
        ssn3=client_response.get("ssn3"),
        ssn_data_quality=client_response.get("ssnDataQuality"),
        dob=client_response.get("dob"),
        dob_data_quality=client_response.get("dobDataQuality"),
        data=get_client_data_from_response(client_response.get("data")),
    )


def get_project_from_response(project_response: Optional[dict[str, Any]]) -> Optional[HmisProjectType]:
    if not project_response:
        return None

    return HmisProjectType(
        date_created=project_response.get("dateCreated"),
        date_updated=project_response.get("dateUpdated"),
        organization_id=project_response.get("organizationId"),
        project_id=project_response.get("projectId"),
        project_name=project_response.get("projectName"),
        project_type=project_response.get("projectType"),
    )


def get_enrollment_from_response(enrollment_response: dict[str, Any]) -> HmisEnrollmentType:
    data = []
    household_members = []

    if data_response := enrollment_response.get("data"):
        data = [
            HmisEnrollmentDataType(
                field=d.get("field", None),
                value=d.get("value", None),
            )
            for d in data_response
        ]

    if household_member_response := enrollment_response.get("enrollmentHouseholdMembers"):
        household_members = [
            HmisEnrollmentHouseholdMemberType(
                personal_id=m.get("personalId", None),
                enrollment_id=m.get("enrollmentId", None),
            )
            for m in household_member_response
        ]

    return HmisEnrollmentType(
        personal_id=enrollment_response.get("personalId"),
        date_created=enrollment_response.get("dateCreated"),
        date_updated=enrollment_response.get("dateUpdated"),
        enrollment_id=enrollment_response.get("enrollmentId"),
        entry_date=enrollment_response.get("entryDate"),
        exit_date=enrollment_response.get("exitDate"),
        household_id=enrollment_response.get("householdId"),
        project=get_project_from_response(enrollment_response.get("project")),
        enrollment_household_members=household_members,
        data=data,
    )


def get_client_note_from_response(client_note_response: dict[str, Any]) -> HmisClientNoteType:
    client = None
    enrollment = None

    if client_data := client_note_response.get("client"):
        client = get_client_from_response(client_data)

    if enrollment_data := client_note_response.get("enrollment"):
        enrollment = get_enrollment_from_response(enrollment_data)

    return HmisClientNoteType(
        id=client_note_response.get("id"),
        title=client_note_response.get("title"),
        note=client_note_response.get("note"),
        date=client_note_response.get("date"),
        category=client_note_response.get("category"),
        client=client,
        enrollment=enrollment,
    )


@strawberry.type
class Query:
    @strawberry.field()
    def hmis_get_client(self, info: Info, personal_id: strawberry.ID) -> HmisGetClientResult:
        request = info.context["request"]
        hmis_api_bridge = HmisGraphQLApiBridge(request=request)

        client_response = hmis_api_bridge.get_client(personal_id)

        if not client_response:
            return HmisGetClientError(message="Something went wrong")

        if errors := client_response.get("errors"):
            return HmisGetClientError(message=errors[0]["message"])

        return get_client_from_response(client_response)

    @strawberry.field()
    def hmis_list_clients(
        self,
        info: Info,
        pagination: Optional[HmisPaginationInput] = None,
        filter: Optional[HmisClientFilterInput] = None,
    ) -> HmisListClientsResult:
        request = info.context["request"]
        hmis_api_bridge = HmisGraphQLApiBridge(request=request)

        response = hmis_api_bridge.list_clients(pagination, filter)

        if not response:
            return HmisListClientsError(message="Something went wrong")

        if errors := response.get("errors"):
            return HmisListClientsError(message=errors[0]["message"])

        client_items = response.get("items", []) or []
        client_meta = response.get("meta", {}) or {}

        clients = [get_client_from_response(c) for c in client_items]

        pagination_info = HmisListMetaType(
            current_page=client_meta.get("current_page"),
            per_page=client_meta.get("per_page"),
            page_count=client_meta.get("page_count"),
            total_count=client_meta.get("total_count"),
        )

        return HmisClientListType(items=clients, meta=pagination_info)

    @strawberry.field()
    def hmis_get_client_note(
        self, info: Info, personal_id: strawberry.ID, enrollment_id: strawberry.ID, id: strawberry.ID
    ) -> HmisGetClientNoteResult:
        request = info.context["request"]
        hmis_api_bridge = HmisGraphQLApiBridge(request=request)

        response = hmis_api_bridge.get_client_note(personal_id=personal_id, enrollment_id=enrollment_id, id=id)

        if not response:
            return HmisGetClientNoteError(message="Something went wrong")

        if errors := response.get("errors"):
            return HmisGetClientNoteError(message=errors[0]["message"])

        return get_client_note_from_response(response)

    @strawberry.field()
    def hmis_list_client_notes(
        self,
        info: Info,
        personal_id: strawberry.ID,
        enrollment_id: strawberry.ID,
        pagination: Optional[HmisPaginationInput] = None,
    ) -> HmisListClientNotesResult:
        request = info.context["request"]
        hmis_api_bridge = HmisGraphQLApiBridge(request=request)

        response = hmis_api_bridge.list_client_notes(
            personal_id=personal_id,
            enrollment_id=enrollment_id,
            pagination=pagination,
        )

        if not response:
            return HmisListClientNotesError(message="Something went wrong")

        if errors := response.get("errors"):
            return HmisListClientNotesError(message=errors[0]["message"])

        client_note_items = response.get("items", []) or []
        client_note_meta = response.get("meta", {}) or {}

        client_notes = [get_client_note_from_response(e) for e in client_note_items]

        pagination_info = HmisListMetaType(
            current_page=client_note_meta.get("current_page"),
            per_page=client_note_meta.get("per_page"),
            page_count=client_note_meta.get("page_count"),
            total_count=client_note_meta.get("total_count"),
        )

        return HmisClientNoteListType(items=client_notes, meta=pagination_info)

    @strawberry.field()
    def hmis_list_enrollments(
        self,
        info: Info,
        dynamic_fields: list[Optional[str]],
        personal_id: strawberry.ID,
        pagination: Optional[HmisPaginationInput] = None,
    ) -> HmisListEnrollmentsResult:
        request = info.context["request"]
        hmis_api_bridge = HmisGraphQLApiBridge(request=request)

        response = hmis_api_bridge.list_enrollments(
            personal_id=personal_id, dynamic_fields=dynamic_fields, pagination=pagination
        )

        if not response:
            return HmisListEnrollmentsError(message="Something went wrong")

        if errors := response.get("errors"):
            return HmisListEnrollmentsError(message=errors[0]["message"])

        enrollment_items = response.get("items", []) or []
        enrollment_meta = response.get("meta", {}) or {}

        enrollments = [get_enrollment_from_response(e) for e in enrollment_items]

        pagination_info = HmisListMetaType(
            current_page=enrollment_meta.get("current_page"),
            per_page=enrollment_meta.get("per_page"),
            page_count=enrollment_meta.get("page_count"),
            total_count=enrollment_meta.get("total_count"),
        )

        return HmisEnrollmentListType(items=enrollments, meta=pagination_info)


@strawberry.type
class Mutation:
    @strawberry.mutation
    def hmis_login(self, info: Info, email: str, password: str) -> HmisLoginResult:
        request = info.context["request"]
        hmis_api_bridge = HmisGraphQLApiBridge(request=request)

        token = hmis_api_bridge.create_auth_token(email, password)
        if not token:
            return HmisLoginError(message="Invalid credentials or HMIS login failed")

        # Require an existing user record.
        # We never auto-create accounts here — users must be pre-invited
        # into an organization that is linked to HMIS.
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return HmisLoginError(message="Invalid credentials or HMIS login failed")

        backend = settings.AUTHENTICATION_BACKENDS[0]
        django_login(request, user, backend=backend)

        return cast(UserType, user)

    @strawberry.mutation
    def hmis_create_client(
        self,
        info: Info,
        client_input: HmisCreateClientInput,
        client_sub_items_input: HmisCreateClientSubItemsInput,
    ) -> HmisCreateClientResult:
        request = info.context["request"]
        hmis_api_bridge = HmisGraphQLApiBridge(request=request)

        response = hmis_api_bridge.create_client(
            client_input=strawberry.asdict(client_input),
            client_sub_items_input=strawberry.asdict(client_sub_items_input),
        )

        if not response:
            return HmisCreateClientError(message="Something went wrong")

        if errors := response.get("errors"):
            return HmisCreateClientError(message=errors[0]["message"])

        return get_client_from_response(response)

    @strawberry.mutation
    def hmis_update_client(
        self,
        info: Info,
        client_input: HmisUpdateClientInput,
        client_sub_items_input: HmisUpdateClientSubItemsInput,
    ) -> HmisUpdateClientResult:
        request = info.context["request"]
        hmis_api_bridge = HmisGraphQLApiBridge(request=request)

        response = hmis_api_bridge.update_client(
            client_input=strawberry.asdict(client_input),
            client_sub_items_input=strawberry.asdict(client_sub_items_input),
        )

        if not response:
            return HmisUpdateClientError(message="Something went wrong")

        if errors := response.get("errors"):
            return HmisUpdateClientError(message=errors[0]["message"])

        return get_client_from_response(response)

    @strawberry.mutation
    def hmis_create_client_note(
        self,
        info: Info,
        client_note_input: HmisCreateClientNoteInput,
    ) -> HmisCreateClientNoteResult:
        request = info.context["request"]
        hmis_api_bridge = HmisGraphQLApiBridge(request=request)

        response = hmis_api_bridge.create_client_note(
            client_note_input=strawberry.asdict(client_note_input),
        )

        if not response:
            return HmisCreateClientNoteError(message="Something went wrong")

        if errors := response.get("errors"):
            return HmisCreateClientNoteError(message=errors[0]["message"])

        return get_client_note_from_response(response)

    @strawberry.mutation
    def hmis_update_client_note(
        self,
        info: Info,
        client_note_input: HmisUpdateClientNoteInput,
    ) -> HmisUpdateClientNoteResult:
        request = info.context["request"]
        hmis_api_bridge = HmisGraphQLApiBridge(request=request)

        response = hmis_api_bridge.update_client_note(
            client_note_input=strawberry.asdict(client_note_input),
        )

        if not response:
            return HmisUpdateClientNoteError(message="Something went wrong")

        if errors := response.get("errors"):
            return HmisUpdateClientNoteError(message=errors[0]["message"])

        return get_client_note_from_response(response)
