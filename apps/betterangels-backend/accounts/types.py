from datetime import timedelta
from typing import Optional, Tuple

import strawberry
import strawberry_django
from django.db.models import Q, QuerySet
from django.utils import timezone
from strawberry import Info, auto
from strawberry_django.filters import filter

from .models import ClientProfile, User

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


@filter(ClientProfile)
class ClientFilter:
    @strawberry_django.filter_field
    def is_active(
        self,
        queryset: QuerySet,
        info: Info,
        value: Optional[bool],
        prefix: str,
    ) -> Tuple[QuerySet[ClientProfile], Q]:
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
    ) -> Tuple[QuerySet[ClientProfile], Q]:
        if value:
            return (
                queryset.filter(
                    Q(user__first_name__icontains=value)
                    | Q(user__last_name__icontains=value)
                    | Q(hmis_id__icontains=value)
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
    id: auto
    hmis_id: auto
    user: UserType


@strawberry_django.input(User)
class CreateUserInput:
    first_name: auto
    last_name: auto
    email: Optional[str]


@strawberry_django.input(ClientProfile, partial=True)
class CreateClientProfileInput:
    hmis_id: auto
    user: CreateUserInput


@strawberry.input
class MagicLinkInput:
    email: str


@strawberry.type
class MagicLinkResponse:
    message: str
