from datetime import timedelta
from typing import Optional, Tuple

import strawberry
import strawberry_django
from django.db.models import Q, QuerySet
from django.utils import timezone
from strawberry import Info, auto
from strawberry_django.filters import filter

from .models import Client, ClientProfile, User


ACTIVE_CLIENT_THRESHOLD_DAYS = 90


@filter(Client)
class ClientFilter:
    @strawberry_django.filter_field
    def active(self, queryset: QuerySet, info: Info, value: Optional[bool], prefix: str) -> Tuple[QuerySet[Client], Q]:
        if value is True:
            active_client_threshold = timezone.now() - timedelta(days=ACTIVE_CLIENT_THRESHOLD_DAYS)

            return queryset.filter(notes__interacted_at__lte=active_client_threshold), Q()

        return queryset, Q()

    @strawberry_django.filter_field
    def search(self, queryset: QuerySet, info: Info, value: Optional[str], prefix: str) -> Tuple[QuerySet[Client], Q]:
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
