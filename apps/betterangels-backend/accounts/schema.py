from typing import Optional

import strawberry
from accounts.services import send_magic_link
from strawberry.types import Info
from strawberry_django import auth
from strawberry_django.utils.requests import get_request

from .types import MagicLinkInput, MagicLinkResponse, UserType


@strawberry.type
class Query:
    current_user: Optional[UserType] = auth.current_user()


@strawberry.type
class Mutation:
    logout = auth.logout()

    @strawberry.mutation
    def generate_magic_link(
        self, info: Info, input: MagicLinkInput
    ) -> MagicLinkResponse:
        request = get_request(info)
        base_url = request.build_absolute_uri()
        send_magic_link(input.email, base_url)
        return MagicLinkResponse(message="Email link sent.")
