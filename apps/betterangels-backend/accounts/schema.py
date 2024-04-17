from typing import List

import strawberry
import strawberry_django
from accounts.services import send_magic_link
from django.contrib.auth import get_user_model
from strawberry.types import Info
from strawberry_django import auth
from strawberry_django.utils.requests import get_request

from .types import ClientType, MagicLinkInput, MagicLinkResponse, UserType


@strawberry.type
class Query:
    current_user: UserType = auth.current_user()  # type: ignore

    client: ClientType = strawberry_django.field()

    clients: List[ClientType] = strawberry_django.field()


@strawberry.type
class Mutation:
    logout = auth.logout()

    @strawberry.mutation
    def generate_magic_link(self, info: Info, data: MagicLinkInput) -> MagicLinkResponse:
        request = get_request(info)
        base_url = request.build_absolute_uri()
        send_magic_link(data.email, base_url)
        return MagicLinkResponse(message="Email link sent.")
