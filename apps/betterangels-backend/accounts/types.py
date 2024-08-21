from datetime import timedelta
from functools import reduce
from operator import and_, or_
from typing import List, Optional, Tuple, Union

import strawberry
import strawberry_django
from accounts.enums import LanguageEnum
from django.db.models import Max, Q, QuerySet
from django.utils import timezone
from organizations.models import Organization
from phonenumber_field.modelfields import PhoneNumber
from phonenumbers import parse
from strawberry import ID, Info, auto
from strawberry_django.filters import filter

from .models import (
    ClientContact,
    ClientHouseholdMember,
    ClientProfile,
    HmisProfile,
    User,
)

MIN_INTERACTED_AGO_FOR_ACTIVE_STATUS = dict(days=90)


@strawberry.input
class AuthInput:
    code: Optional[str] = strawberry.field(name="code")
    code_verifier: Optional[str] = strawberry.field(name="code_verifier")
    id_token: Optional[str] = strawberry.field(name="id_token")
    redirect_uri: Optional[str] = strawberry.field(name="redirect_uri")


@strawberry.type
class AuthResponse:
    status_code: str = strawberry.field(name="status_code")


@strawberry_django.ordering.order(ClientProfile)
class ClientProfileOrder:
    user__first_name: auto
    user__last_name: auto


@filter(ClientProfile)
class ClientProfileFilter:
    @strawberry_django.filter_field
    def is_active(
        self, queryset: QuerySet, info: Info, value: Optional[bool], prefix: str
    ) -> Tuple[QuerySet[ClientProfile], Q]:
        if value is None:
            return queryset, Q()

        earliest_interaction_threshold = timezone.now().date() - timedelta(**MIN_INTERACTED_AGO_FOR_ACTIVE_STATUS)
        # Filter profiles based on the maximum interacted_at date being within the threshold
        comparison = "gte" if value else "lt"

        return (
            queryset.alias(last_interacted_at=Max("user__client_notes__interacted_at")),
            Q(**{f"last_interacted_at__{comparison}": earliest_interaction_threshold}),
        )

    @strawberry_django.filter_field
    def search(
        self,
        queryset: QuerySet,
        info: Info,
        value: Optional[str],
        prefix: str,
    ) -> Tuple[QuerySet[ClientProfile], Q]:
        if value is None:
            return queryset, Q()

        search_terms = value.split(" ")

        q_objects = []
        combined_q_search = []
        searchable_fields = [
            "hmis_id",
            "nickname",
            "user__first_name",
            "user__last_name",
            "user__middle_name",
        ]

        for term in search_terms:
            q_search = [Q(**{f"{field}__icontains": term}) for field in searchable_fields]
            combined_q_search.append(reduce(or_, q_search))
            q_objects.append(Q(*combined_q_search))

        queryset = queryset.filter(reduce(and_, q_objects))

        return (
            queryset,
            Q(),
        )


@strawberry.input
class LoginInput:
    username: str
    password: str


@strawberry_django.type(HmisProfile)
class HmisProfileType:
    id: auto
    hmis_id: auto
    agency: auto


@strawberry_django.input(HmisProfile)
class HmisProfileInput(HmisProfileType):
    "See parent"


@strawberry_django.type(Organization)
class OrganizationType:
    id: ID
    name: auto


@strawberry_django.type(User)
class UserBaseType:
    first_name: auto
    last_name: auto
    middle_name: auto
    email: auto


@strawberry_django.type(User)
class UserType(UserBaseType):
    id: ID
    username: auto
    is_outreach_authorized: Optional[bool]
    organizations_organization: Optional[List[OrganizationType]]
    has_accepted_tos: auto
    has_accepted_privacy_policy: auto


@strawberry_django.input(User, partial=True)
class CreateUserInput(UserBaseType):
    "See parent"


@strawberry_django.input(User, partial=True)
class UpdateUserInput(UserBaseType):
    id: ID
    has_accepted_tos: auto = False
    has_accepted_privacy_policy: auto = False


PhoneNumberScalar: Union[PhoneNumber, str] = strawberry.scalar(
    PhoneNumber,
    serialize=lambda v: str(v.national_number),
    parse_value=lambda v: parse(v, "US"),
)


@strawberry_django.type(ClientProfile)
class ClientProfileBaseType:
    address: auto
    age: auto
    place_of_birth: auto
    date_of_birth: auto
    eye_color: auto
    gender: auto
    hair_color: auto
    height_in_inches: auto
    hmis_id: auto
    marital_status: auto
    nickname: auto
    phone_number: Optional[PhoneNumberScalar]  # type: ignore
    physical_description: auto
    preferred_language: auto
    pronouns: auto
    pronouns_other: auto
    race: auto
    spoken_languages: Optional[List[Optional[LanguageEnum]]]
    veteran_status: auto


@strawberry_django.type(ClientContact)
class ClientContactBaseType:
    name: auto
    email: auto
    phone_number: Optional[PhoneNumberScalar]  # type: ignore
    mailing_address: auto
    relationship_to_client: auto
    relationship_to_client_other: auto


@strawberry_django.type(ClientContact)
class ClientContactType(ClientContactBaseType):
    id: ID
    client_profile: auto


@strawberry_django.input(ClientContact, partial=True)
class ClientContactInput(ClientContactBaseType):
    id: auto


@strawberry_django.type(ClientHouseholdMember)
class ClientHouseholdMemberBaseType:
    name: auto
    date_of_birth: auto
    gender: auto
    relationship_to_client: auto
    relationship_to_client_other: auto


@strawberry_django.type(ClientHouseholdMember)
class ClientHouseholdMemberType(ClientHouseholdMemberBaseType):
    id: ID
    client_profile: auto


@strawberry_django.input(ClientHouseholdMember, partial=True)
class ClientHouseholdMemberInput(ClientHouseholdMemberBaseType):
    id: auto


@strawberry_django.type(ClientProfile, filters=ClientProfileFilter, order=ClientProfileOrder, pagination=True)  # type: ignore[literal-required]
class ClientProfileType(ClientProfileBaseType):
    id: ID
    user: UserType
    contacts: Optional[List[ClientContactType]]
    display_pronouns: auto
    hmis_profiles: Optional[List[Optional[HmisProfileType]]] = strawberry_django.field()
    household_members: Optional[List[ClientHouseholdMemberType]]

    @strawberry.field
    def display_case_manager(self, info: Info) -> str:
        if case_managers := getattr(self, "case_managers", None):
            return str(case_managers[-1].name)

        return "Not Assigned"


@strawberry_django.input(ClientProfile, partial=True)
class CreateClientProfileInput(ClientProfileBaseType):
    user: CreateUserInput
    contacts: Optional[List[ClientContactInput]]
    hmis_profiles: Optional[List[HmisProfileInput]]
    household_members: Optional[List[ClientHouseholdMemberInput]]


@strawberry_django.input(ClientProfile, partial=True)
class UpdateClientProfileInput(ClientProfileBaseType):
    id: ID
    user: Optional[UpdateUserInput]
    contacts: Optional[List[ClientContactInput]]
    hmis_profiles: Optional[List[HmisProfileInput]]
    household_members: Optional[List[ClientHouseholdMemberInput]]


@strawberry.input
class MagicLinkInput:
    email: str


@strawberry.type
class MagicLinkResponse:
    message: str
