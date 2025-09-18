from typing import Any, Optional, cast

import strawberry
from accounts.types import UserType
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth import login as django_login
from hmis.enums import HmisGenderEnum, HmisRaceEnum, HmisVeteranStatusEnum
from strawberry.types import Info

from .api_bridge import HmisApiBridge
from .types import (
    HmisClientDataType,
    HmisClientFilterInput,
    HmisClientListType,
    HmisClientType,
    HmisCreateClientError,
    HmisCreateClientInput,
    HmisCreateClientResult,
    HmisCreateClientSubItemsInput,
    HmisGetClientError,
    HmisGetClientResult,
    HmisListClientsError,
    HmisListClientsResult,
    HmisListMetaType,
    HmisLoginError,
    HmisLoginResult,
    HmisPaginationInput,
)

User = get_user_model()


def get_client_from_response(client_response: dict[str, Any]) -> HmisClientType:
    data_response = client_response.get("data")

    if data_response:
        race_ethnicity_data = data_response.get("raceEthnicity") or []
        gender_data = data_response.get("gender") or []

        data = HmisClientDataType(
            middle_name=data_response.get("middleName", None),
            name_suffix=data_response.get("nameSuffix", None),
            alias=data_response.get("alias", None),
            race_ethnicity=[HmisRaceEnum(r) for r in race_ethnicity_data],
            additional_race_ethnicity=data_response.get("additionalRaceEthnicity", None),
            gender=[HmisGenderEnum(g) for g in gender_data],
            different_identity_text=data_response.get("differentIdentityText", None),
            veteran_status=HmisVeteranStatusEnum(
                data_response.get("veteranStatus") or HmisVeteranStatusEnum.NOT_COLLECTED
            ),
        )

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
        data=data,
    )


@strawberry.type
class Query:
    @strawberry.field()
    def hmis_get_client(self, info: Info, personal_id: strawberry.ID) -> HmisGetClientResult:
        request = info.context["request"]
        hmis_api_bridge = HmisApiBridge(request=request)

        client_response = hmis_api_bridge.get_client(personal_id)

        if not client_response:
            return HmisGetClientError(message="Something went wrong")

        if errors := client_response.get("errors"):
            return HmisGetClientError(message=errors[0]["message"])

        client = get_client_from_response(client_response)

        return client

    @strawberry.field()
    def hmis_list_clients(
        self,
        info: Info,
        pagination: Optional[HmisPaginationInput] = None,
        filter: Optional[HmisClientFilterInput] = None,
    ) -> HmisListClientsResult:
        request = info.context["request"]
        hmis_api_bridge = HmisApiBridge(request=request)

        response = hmis_api_bridge.list_clients(pagination, filter)

        if not response:
            return HmisListClientsError(message="Something went wrong")

        if errors := response.get("errors"):
            return HmisListClientsError(message=errors[0]["message"])

        client_items = response.get("items", []) or []
        client_meta = response.get("meta", {}) or {}

        clients = [get_client_from_response(c) for c in client_items]

        # if client_meta:
        pagination_info = HmisListMetaType(
            current_page=client_meta.get("current_page"),
            per_page=client_meta.get("per_page"),
            page_count=client_meta.get("page_count"),
            total_count=client_meta.get("total_count"),
        )

        return HmisClientListType(items=clients, meta=pagination_info)


@strawberry.type
class Mutation:
    @strawberry.mutation
    def hmis_login(self, info: Info, email: str, password: str) -> HmisLoginResult:
        request = info.context["request"]
        hmis_api_bridge = HmisApiBridge(request=request)

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
        hmis_api_bridge = HmisApiBridge(request=request)

        response = hmis_api_bridge.create_client(
            client_input=strawberry.asdict(client_input),
            client_sub_items_input=strawberry.asdict(client_sub_items_input),
        )

        if not response:
            return HmisCreateClientError(message="Something went wrong")

        if errors := response.get("errors"):
            return HmisCreateClientError(message=errors[0]["message"])

        client = get_client_from_response(response)

        return client
