from typing import Any, Dict, List, cast

import strawberry
import strawberry_django
from accounts.models import User
from accounts.utils import get_user_permission_group
from clients.models import ClientContact, ClientProfile
from clients.permissions import ClientProfilePermissions
from common.graphql.types import DeleteDjangoObjectInput, DeletedObjectType
from common.models import Attachment
from common.permissions.enums import AttachmentPermissions
from common.permissions.utils import IsAuthenticated
from django.apps import apps
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.db.models import Prefetch
from guardian.shortcuts import assign_perm
from strawberry.types import Info
from strawberry_django import mutations
from strawberry_django.auth.utils import get_current_user
from strawberry_django.mutations import resolvers
from strawberry_django.permissions import HasPerm, HasRetvalPerm
from strawberry_django.utils.query import filter_for_user

from .enums import RelationshipTypeEnum
from .types import (
    ClientDocumentType,
    ClientProfilePhotoInput,
    ClientProfileType,
    CreateClientDocumentInput,
    CreateClientProfileInput,
    UpdateClientProfileInput,
)

CLIENT_RELATED_CLS_NAME_BY_RELATED_NAME = {
    "contacts": "ClientContact",
    "hmis_profiles": "HmisProfile",
    "household_members": "ClientHouseholdMember",
    "social_media_profiles": "SocialMediaProfile",
}


def upsert_or_delete_client_related_object(
    info: Info,
    model_cls_name: str,
    data: List[Dict[str, Any]],
    client_profile: ClientProfile,
) -> None:
    """Creates, updates, or deletes a client's related objects.

    Expects a list of related objects. Missing elements will be deleted.
    """
    model_cls = apps.get_model("clients", model_cls_name)

    item_updates_by_id = {item["id"]: item for item in data if item.get("id")}
    items_to_create = [item for item in data if not item.get("id")]
    items_to_update = model_cls.objects.filter(id__in=item_updates_by_id.keys(), client_profile=client_profile)
    model_cls.objects.exclude(id__in=item_updates_by_id).delete()

    for item in items_to_create:
        resolvers.create(
            info,
            model_cls,
            {
                **item,
                "client_profile": client_profile,
            },
        )

    for item in items_to_update:
        resolvers.update(
            info,
            item,
            item_updates_by_id[str(item.id)],
        )


@strawberry.type
class Query:
    @strawberry_django.field(extensions=[HasRetvalPerm(perms=[ClientProfilePermissions.VIEW])])
    def client_profile(self, info: Info, pk: strawberry.ID) -> ClientProfileType:
        client_profile = ClientProfile.objects.prefetch_related(
            Prefetch(
                "contacts",
                queryset=ClientContact.objects.filter(
                    relationship_to_client=RelationshipTypeEnum.CURRENT_CASE_MANAGER
                ).order_by("created_at"),
                to_attr="case_managers",
            )
        )

        return cast(ClientProfileType, client_profile)

    client_profiles: List[ClientProfileType] = strawberry_django.field(
        extensions=[HasRetvalPerm(perms=[ClientProfilePermissions.VIEW])],
    )

    client_document: ClientDocumentType = strawberry_django.field(
        extensions=[HasRetvalPerm(AttachmentPermissions.VIEW)],
    )

    client_documents: List[ClientDocumentType] = strawberry_django.field(
        extensions=[HasRetvalPerm(AttachmentPermissions.VIEW)],
    )


@strawberry.type
class Mutation:
    @strawberry_django.mutation(extensions=[HasPerm(AttachmentPermissions.ADD)])
    def create_client_document(self, info: Info, data: CreateClientDocumentInput) -> ClientDocumentType:
        with transaction.atomic():
            user = cast(User, get_current_user(info))
            client_profile = filter_for_user(
                ClientProfile.objects.all(),
                user,
                [ClientProfilePermissions.CHANGE],
            ).get(id=data.client_profile)

            permission_group = get_user_permission_group(user)

            content_type = ContentType.objects.get_for_model(ClientProfile)
            client_document = Attachment.objects.create(
                file=data.file,
                namespace=data.namespace,
                content_type=content_type,
                object_id=client_profile.id,
                uploaded_by=user,
                associated_with=client_profile.user,
            )

            permissions = [
                AttachmentPermissions.VIEW,
                AttachmentPermissions.DELETE,
            ]
            for perm in permissions:
                assign_perm(perm, permission_group.group, client_document)

            return cast(ClientDocumentType, client_document)

    delete_client_document: ClientDocumentType = mutations.delete(
        DeleteDjangoObjectInput,
        extensions=[
            HasRetvalPerm(perms=AttachmentPermissions.DELETE),
        ],
    )

    @strawberry_django.mutation(extensions=[HasPerm(perms=[ClientProfilePermissions.ADD])])
    def create_client_profile(self, info: Info, data: CreateClientProfileInput) -> ClientProfileType:
        with transaction.atomic():
            user = get_current_user(info)
            permission_group = get_user_permission_group(user)
            client_profile_data: dict = strawberry.asdict(data)
            user_data = client_profile_data.pop("user")
            client_user = User.objects.create_client(**user_data)
            client_profile = resolvers.create(
                info,
                ClientProfile,
                {
                    **client_profile_data,
                    "user": client_user,
                },
            )

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

            if user_data := client_profile_data.pop("user", {}):
                client_user = resolvers.update(
                    info,
                    client_user,
                    {
                        **user_data,
                        "id": client_profile.user.id,
                    },
                )

            for related_name, related_cls_name in CLIENT_RELATED_CLS_NAME_BY_RELATED_NAME.items():
                if client_profile_data[related_name] is not strawberry.UNSET:
                    upsert_or_delete_client_related_object(
                        info,
                        related_cls_name,
                        client_profile_data.pop(related_name),
                        client_profile,
                    )

            client_profile = resolvers.update(
                info,
                client_profile,
                {
                    **client_profile_data,
                },
            )

            return cast(ClientProfileType, client_profile)

    @strawberry_django.mutation(extensions=[HasRetvalPerm(perms=[ClientProfilePermissions.CHANGE])])
    def update_client_profile_photo(self, info: Info, data: ClientProfilePhotoInput) -> ClientProfileType:
        with transaction.atomic():
            user = get_current_user(info)
            try:
                client_profile = filter_for_user(
                    ClientProfile.objects.all(),
                    user,
                    [ClientProfilePermissions.CHANGE],
                ).get(id=data.client_profile)

                client_profile.profile_photo = data.photo
                client_profile.save()

            except ClientProfile.DoesNotExist:
                raise PermissionError("You do not have permission to modify this client.")

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
