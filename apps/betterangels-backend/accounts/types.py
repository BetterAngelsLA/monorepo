from datetime import timedelta
from typing import Optional, Tuple

import strawberry
import strawberry_django
from django.db.models import Q, QuerySet
from django.utils import timezone
from strawberry import Info, auto
from strawberry_django.filters import filter

from .models import Client, ClientProfile, User

MIN_INTERACTED_AGO_FOR_ACTIVE_STATUS = dict(days=90)


@strawberry.input
class AuthInput:
    code: str = strawberry.field(name="code")
    code_verifier: str = strawberry.field(name="code_verifier")
    redirect_uri: str = strawberry.field(name="redirect_uri")


# TODO: I don't think this is the right response
# The code and code verifier is passed in
@strawberry.type
class AuthResponse:
    status_code: str = strawberry.field(name="status_code")


@filter(Client)
class ClientFilter:
    @strawberry_django.filter_field
    def is_active(
        self,
        queryset: QuerySet,
        info: Info,
        value: Optional[bool],
        prefix: str,
    ) -> Tuple[QuerySet[Client], Q]:
        if value:
            earliest_interaction_threshold = timezone.now().date() - timedelta(**MIN_INTERACTED_AGO_FOR_ACTIVE_STATUS)

            return queryset.filter(client_notes__interacted_at__gte=earliest_interaction_threshold), Q()

        return queryset, Q()

    @strawberry_django.filter_field
    def search(
        self,
        queryset: QuerySet,
        info: Info,
        value: Optional[str],
        prefix: str,
    ) -> Tuple[QuerySet[Client], Q]:
        if value:
            return (
                queryset.filter(
                    Q(first_name__icontains=value)
                    | Q(last_name__icontains=value)
                    | Q(client_profile__hmis_id__icontains=value)
                ),
                Q(),
            )

        return queryset, Q()


@strawberry_django.type(User)
class UserType:
    id: auto
    username: auto
    first_name: auto
    last_name: auto
    email: auto


@strawberry_django.type(ClientProfile)
class ClientProfileType:
    hmis_id: auto


@strawberry_django.type(Client, pagination=True, filters=ClientFilter)
class ClientType(UserType):
    client_profile: ClientProfileType


@strawberry_django.input(ClientProfile)
class ClientProfileInput:
    hmis_id: auto


@strawberry_django.input(Client)
class CreateClientInput:
    first_name: auto
    last_name: auto
    email: auto
    client_profile: Optional[ClientProfileInput]


@strawberry.input
class MagicLinkInput:
    email: str


@strawberry.type
class MagicLinkResponse:
    message: str
