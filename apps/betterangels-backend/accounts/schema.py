from typing import List, cast

import strawberry
import strawberry_django
from accounts.models import Client, ClientProfile
from accounts.permissions import ClientPermissions
from accounts.services import send_magic_link
from django.db import transaction
from guardian.shortcuts import assign_perm
from notes.utils import get_user_permission_group
from strawberry.types import Info
from strawberry_django import auth
from strawberry_django.auth.utils import get_current_user
from strawberry_django.mutations import resolvers
from strawberry_django.permissions import HasPerm, HasRetvalPerm
from strawberry_django.utils.requests import get_request

from .types import (
    AuthInput,
    AuthResponse,
    ClientType,
    CreateClientInput,
    MagicLinkInput,
    MagicLinkResponse,
    UserType,
)


@strawberry.type
class Query:
    current_user: UserType = auth.current_user()  # type: ignore

    client: ClientType = strawberry_django.field(
        extensions=[HasRetvalPerm(perms=[ClientPermissions.VIEW])],
    )

    clients: List[ClientType] = strawberry_django.field(
        extensions=[HasRetvalPerm(perms=[ClientPermissions.VIEW])],
    )


@strawberry.type
class Mutation:
    logout = auth.logout()

    @strawberry.mutation
    def idme_auth(self, input: AuthInput) -> AuthResponse:
        # The is a stub and logic is handled client-side by Apollo
        return AuthResponse(status_code="")

    @strawberry.mutation
    def google_auth(self, input: AuthInput) -> AuthResponse:
        # The is a stub and logic is handled client-side by Apollo
        return AuthResponse(status_code="")

    @strawberry.mutation
    def generate_magic_link(self, info: Info, data: MagicLinkInput) -> MagicLinkResponse:
        request = get_request(info)
        base_url = request.build_absolute_uri()
        send_magic_link(data.email, base_url)
        return MagicLinkResponse(message="Email link sent.")

    @strawberry_django.mutation(extensions=[HasPerm(perms=[ClientPermissions.ADD])])
    def create_client(self, info: Info, data: CreateClientInput) -> ClientType:
        with transaction.atomic():
            client_profile_data = strawberry.asdict(data)
            _ = client_profile_data.pop("client_profile")

            user = get_current_user(info)
            permission_group = get_user_permission_group(user)

            client = Client.objects.create_client(
                first_name=data.first_name,
                last_name=data.last_name,
                email=data.email,
            )
            resolvers.create(
                info,
                ClientProfile,
                {
                    **client_profile_data,
                    "user": client,
                },
            )

            permissions = [
                ClientPermissions.VIEW,
                ClientPermissions.CHANGE,
                ClientPermissions.DELETE,
            ]
            for perm in permissions:
                assign_perm(perm, permission_group.group, client)

            return cast(ClientType, client)
