from typing import Optional

import strawberry
import strawberry_django
from django.db.models import Q
from strawberry import auto

from .models import Client, ClientProfile, User


@strawberry_django.filters.filter(Client)
class ClientFilter:
    @strawberry_django.filter_field
    def search(self, value: str, prefix: str) -> Q:
        return Q(
            Q(first_name__icontains=value) | Q(last_name__icontains=value) | Q(client_profile__hmis_id__icontains=value)
        )


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
