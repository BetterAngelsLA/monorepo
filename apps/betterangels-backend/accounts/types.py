from datetime import timedelta
from functools import reduce
from operator import and_, or_
from typing import List, Optional, Tuple

import strawberry
import strawberry_django
from accounts.enums import LanguageEnum
from dateutil.relativedelta import relativedelta
from django.db.models import Max, Q, QuerySet
from django.utils import timezone
from organizations.models import Organization
from strawberry import ID, Info, auto
from strawberry_django.filters import filter

from .models import ClientContact, ClientProfile, User

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


@strawberry_django.input(User, partial=True)
class CreateUserInput(UserBaseType):
    pass


@strawberry_django.input(User, partial=True)
class UpdateUserInput(UserBaseType):
    id: ID


@strawberry_django.type(ClientProfile)
class ClientProfileBaseType:
    address: auto
    date_of_birth: auto
    gender: auto
    hmis_id: auto
    nickname: auto
    phone_number: auto
    preferred_language: auto
    pronouns: auto
    spoken_languages: Optional[List[Optional[LanguageEnum]]]
    veteran_status: auto


@strawberry_django.type(ClientContact)
class ClientContactBaseType:
    name: auto
    email: auto
    phone_number: auto
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


@strawberry_django.type(ClientProfile, filters=ClientProfileFilter, order=ClientProfileOrder, pagination=True)  # type: ignore[literal-required]
class ClientProfileType(ClientProfileBaseType):
    id: ID
    user: UserType
    contacts: Optional[List[ClientContactType]]

    @strawberry.field
    def age(self) -> Optional[int]:
        if not self.date_of_birth:
            return None

        today = timezone.now().date()
        age = relativedelta(today, self.date_of_birth).years
        return age


@strawberry_django.input(ClientProfile, partial=True)
class CreateClientProfileInput(ClientProfileBaseType):
    user: CreateUserInput
    contacts: Optional[List[ClientContactInput]]


@strawberry_django.input(ClientProfile, partial=True)
class UpdateClientProfileInput(ClientProfileBaseType):
    id: ID
    user: Optional[UpdateUserInput]
    contacts: Optional[List[ClientContactInput]]


@strawberry.input
class MagicLinkInput:
    email: str


@strawberry.type
class MagicLinkResponse:
    message: str
