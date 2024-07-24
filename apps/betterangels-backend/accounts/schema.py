from typing import List, cast

import strawberry
import strawberry_django
from accounts.models import ClientContact, ClientProfile, User
from accounts.permissions import ClientProfilePermissions
from accounts.services import send_magic_link
from accounts.utils import get_user_permission_group
from common.graphql.types import DeleteDjangoObjectInput, DeletedObjectType
from common.permissions.utils import IsAuthenticated
from django.db import transaction
from guardian.shortcuts import assign_perm
from strawberry.types import Info
from strawberry_django import auth
from strawberry_django.auth.utils import get_current_user
from strawberry_django.mutations import resolvers
from strawberry_django.permissions import HasPerm, HasRetvalPerm
from strawberry_django.utils.query import filter_for_user
from strawberry_django.utils.requests import get_request

from .types import (
    AuthInput,
    AuthResponse,
    ClientProfileType,
    CreateClientProfileInput,
    LoginInput,
    MagicLinkInput,
    MagicLinkResponse,
    UpdateClientProfileInput,
    UserType,
)


@strawberry.type
class Query:
    current_user: UserType = auth.current_user()  # type: ignore

    client_profile: ClientProfileType = strawberry_django.field(
        extensions=[HasRetvalPerm(perms=[ClientProfilePermissions.VIEW])],
    )

    client_profiles: List[ClientProfileType] = strawberry_django.field(
        extensions=[HasRetvalPerm(perms=[ClientProfilePermissions.VIEW])],
    )


@strawberry.type
class Mutation:
    logout = auth.logout()

    @strawberry.mutation
    def login(self, input: LoginInput) -> AuthResponse:
        # The is a stub and logic is handled client-side by Apollo
        return AuthResponse(status_code="")

    @strawberry.mutation
    def google_auth(self, input: AuthInput) -> AuthResponse:
        # The is a stub and logic is handled client-side by Apollo
        return AuthResponse(status_code="")

    @strawberry.mutation
    def apple_auth(self, input: AuthInput) -> AuthResponse:
        # The is a stub and logic is handled client-side by Apollo
        return AuthResponse(status_code="")

    @strawberry.mutation
    def generate_magic_link(self, info: Info, data: MagicLinkInput) -> MagicLinkResponse:
        request = get_request(info)
        base_url = request.build_absolute_uri()
        send_magic_link(data.email, base_url)
        return MagicLinkResponse(message="Email link sent.")

    @strawberry_django.mutation(extensions=[HasPerm(perms=[ClientProfilePermissions.ADD])])
    def create_client_profile(self, info: Info, data: CreateClientProfileInput) -> ClientProfileType:
        with transaction.atomic():
            user = get_current_user(info)
            permission_group = get_user_permission_group(user)

            client_profile_data: dict = strawberry.asdict(data)
            user_data = client_profile_data.pop("user", {})
            contacts_data = client_profile_data.pop("contacts", [])

            client_user = User.objects.create_client(**user_data)

            client_profile = resolvers.create(
                info,
                ClientProfile,
                {
                    **client_profile_data,
                    "user": client_user,
                },
            )

            if contacts_data:
                contacts_to_create = [
                    ClientContact(
                        client_profile=client_profile,
                        name=contact.get("name", None),
                        email=contact.get("email", None),
                        phone_number=contact.get("phone_number", None),
                        mailing_address=contact.get("mailing_address", None),
                        relationship_to_client=contact.get("relationship_to_client", None),
                        relationship_to_client_other=contact.get("relationship_to_client_other", None),
                    )
                    for contact in contacts_data
                ]

                ClientContact.objects.bulk_create(contacts_to_create)

            permissions = [
                ClientProfilePermissions.VIEW,
                ClientProfilePermissions.CHANGE,
                ClientProfilePermissions.DELETE,
            ]
            for perm in permissions:
                assign_perm(perm, permission_group.group, client_profile)

            return cast(ClientProfileType, client_profile)

    @strawberry_django.mutation(extensions=[HasRetvalPerm(perms=[ClientProfilePermissions.CHANGE])])
    def update_client_profile(self, info: Info, data: UpdateClientProfileInput) -> ClientProfileType:
        with transaction.atomic():
            user = get_current_user(info)
            try:
                client_profile = filter_for_user(
                    ClientProfile.objects.all(),
                    user,
                    [ClientProfilePermissions.CHANGE],
                ).get(id=data.id)
                client_user = client_profile.user
            except ClientProfile.DoesNotExist:
                raise PermissionError("You do not have permission to modify this client.")

            client_profile_data: dict = strawberry.asdict(data)
            user_data = client_profile_data.pop("user", {})
            contacts_data = client_profile_data.pop("contacts", [])

            client_user = resolvers.update(
                info,
                client_user,
                {
                    **user_data,
                    "id": client_profile.user.id,
                },
            )

            if contacts_data:
                contact_updates_by_id = {c["id"]: c for c in contacts_data if c.get("id")}
                contacts_to_create = [c for c in contacts_data if not c.get("id")]
                contacts_to_update = ClientContact.objects.filter(
                    id__in=contact_updates_by_id.keys(), client_profile=client_profile
                )

                for contact in contacts_to_create:
                    resolvers.create(
                        info,
                        ClientContact,
                        {
                            **contact,
                            "client_profile": client_profile,
                        },
                    )

                for contact in contacts_to_update:
                    resolvers.update(
                        info,
                        contact,
                        contact_updates_by_id[str(contact.id)],
                    )

            client_profile = resolvers.update(
                info,
                client_profile,
                {
                    **client_profile_data,
                },
            )

            return cast(ClientProfileType, client_profile)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def delete_client_profile(self, info: Info, data: DeleteDjangoObjectInput) -> DeletedObjectType:
        with transaction.atomic():
            user = get_current_user(info)

            try:
                client_profile = filter_for_user(
                    ClientProfile.objects.all(),
                    user,
                    [ClientProfilePermissions.DELETE],
                ).get(id=data.id)

                client_profile_id = client_profile.pk

                # Deleting the underlying user will cascade and delete the client profile
                client_profile.user.delete()

            except ClientProfile.DoesNotExist:
                raise PermissionError("No user deleted; profile may not exist or lacks proper permissions")

            return DeletedObjectType(id=client_profile_id)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def delete_current_user(self, info: Info) -> DeletedObjectType:
        with transaction.atomic():
            user = get_current_user(info)
            user_id = user.pk
            user.delete()

            return DeletedObjectType(id=user_id)
