from typing import List

import strawberry
import strawberry_django
from accounts.services import send_magic_link
from django.contrib.auth import get_user_model
from strawberry.types import Info
from strawberry_django import auth
from strawberry_django.utils.requests import get_request

from .types import MagicLinkInput, MagicLinkResponse, UserType


@strawberry.type
class Query:
    current_user: UserType = auth.current_user()  # type: ignore

    client: UserType = strawberry_django.field()

    @strawberry.field
    def clients(self) -> List[UserType]:
        User = get_user_model()

        clients: List[UserType] = User.objects.filter(client_profile__isnull=False)  # type: ignore

        return clients


@strawberry.type
class Mutation:
    logout = auth.logout()

    @strawberry.mutation
    def generate_magic_link(self, info: Info, data: MagicLinkInput) -> MagicLinkResponse:
        request = get_request(info)
        base_url = request.build_absolute_uri()
        send_magic_link(data.email, base_url)
        return MagicLinkResponse(message="Email link sent.")
