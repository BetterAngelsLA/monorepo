from typing import Any, Dict, List, Optional, cast

import phonenumber_field
import strawberry
import strawberry_django
from accounts.models import User
from accounts.utils import get_user_permission_group
from clients.enums import HmisAgencyEnum
from clients.models import ClientContact, ClientProfile, HmisProfile
from clients.permissions import ClientProfilePermissions
from common.graphql.types import DeleteDjangoObjectInput, DeletedObjectType
from common.models import Attachment, PhoneNumber
from common.permissions.enums import AttachmentPermissions
from common.permissions.utils import IsAuthenticated
from django.contrib.contenttypes.fields import GenericRel
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import ForeignKey, Prefetch
from graphql import GraphQLError
from guardian.shortcuts import assign_perm
from strawberry.types import Info
from strawberry_django import mutations
from strawberry_django.auth.utils import get_current_user
from strawberry_django.mutations import resolvers
from strawberry_django.pagination import OffsetPaginated
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


def _validate_user_email(user_data: dict, user: Optional[User] = None) -> list[dict[str, Any]]:
    errors: list = []

    if user_data["email"] is strawberry.UNSET or None:
        return errors

    email = user_data["email"].lower()

    if user and user.email and user.email == email:
        return errors

    if User.objects.filter(email=email).exists():
        errors.append({"field": "email", "message": "This email is already in use"})

    return errors


def _validate_user_name(user_data: dict, nickname: str, user: Optional[User] = None) -> list[dict[str, Any]]:
    errors: list = []

    user_name_dict = {
        f"{name_field}": user_data.get(name_field) for name_field in ["first_name", "last_name", "middle_name"]
    }
    user_name_dict["nickname"] = nickname

    user_name_untouched = all((v is strawberry.UNSET for v in user_name_dict.values()))
    user_name_cleared = all((v == "" for v in user_name_dict.values()))

    if user and user.has_name and user_name_untouched:
        return errors

    if user_name_cleared or user_name_untouched:
        errors.append({"field": "full_name", "message": "At least one name field is required"})

    return errors


def _validate_phone_numbers(phone_numbers: list[dict[str, Any]]) -> list[dict[str, Any]]:
    errors = []

    for idx, phone_number in enumerate(phone_numbers):
        try:
            phonenumber_field.validators.validate_international_phonenumber(phone_number["number"])
        except ValidationError:
            errors.append(
                {"field": f"phone_numbers__{idx}__number", "message": "The phone number entered is not valid"}
            )

    return errors


def _validate_hmis_profiles(hmis_profiles: list[dict[str, Any]]) -> list[dict[str, Any]]:
    errors = []

    for idx, hmis_profile in enumerate(hmis_profiles):
        hmis_profile_id = {"id": hmis_profile["id"]} if hmis_profile.get("id") is not strawberry.UNSET else {}

        if (
            HmisProfile.objects.exclude(**hmis_profile_id)
            .filter(
                agency=hmis_profile["agency"],
                hmis_id=hmis_profile["hmis_id"],
            )
            .exists()
        ):
            errors.append(
                {
                    "field": f"hmis_profiles__{idx}",
                    "message": f"This {HmisAgencyEnum(hmis_profile["agency"]).label} HMIS ID is already in use",
                }
            )

    return errors


def _validate_contacts(contacts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    errors = []

    for idx, contact in enumerate(contacts):
        try:
            phonenumber_field.validators.validate_international_phonenumber(contact["phone_number"])
        except ValidationError:
            errors.append(
                {"field": f"contacts__{idx}__phone_number", "message": "The phone number entered is not valid"}
            )

    return errors


def _validate_client_profile_data(data: dict) -> None:
    """Validates the data for creating or updating a client profile."""
    errors = []

    if data["user"] is not strawberry.UNSET:
        user_id = data["user"].get("id", None)
        user = User.objects.filter(id=user_id).first() if user_id else None

        errors += _validate_user_name(data["user"], data["nickname"], user)
        errors += _validate_user_email(data["user"], user)

    if data["contacts"] is not strawberry.UNSET:
        errors += _validate_contacts(data["contacts"])

    if data["hmis_profiles"] is not strawberry.UNSET:
        errors += _validate_hmis_profiles(data["hmis_profiles"])

    if data["phone_numbers"] is not strawberry.UNSET:
        errors += _validate_phone_numbers(data["phone_numbers"])

    if errors:
        raise GraphQLError("Validation Errors", extensions={"errors": errors})


def upsert_or_delete_client_related_object(
    info: Info,
    related_cls: Any,
    data: List[Dict[str, Any]],
    client_profile: ClientProfile,
) -> None:
    """Creates, updates, or deletes a client's related objects.

    Expects a list of related objects. Missing elements will be deleted.
    """
    model_cls = related_cls.related_model

    item_updates_by_id = {item["id"]: item for item in data if item.get("id")}
    items_to_create = [item for item in data if not item.get("id")]
    items_to_update = model_cls.objects.filter(id__in=item_updates_by_id.keys())
    args: dict[str, Any]

    if isinstance(related_cls.remote_field, ForeignKey):
        args = {"client_profile": client_profile}

    elif isinstance(related_cls.remote_field, GenericRel):
        args = {
            "content_type": ContentType.objects.get_for_model(ClientProfile),
            "object_id": client_profile.pk,
        }

    model_cls.objects.filter(**args).exclude(id__in=item_updates_by_id).delete()

    for item in items_to_create:
        resolvers.create(
            info,
            model_cls,
            {
                **item,
                **args,
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

    client_profiles_paginated: OffsetPaginated[ClientProfileType] = strawberry_django.offset_paginated(
        extensions=[HasRetvalPerm(perms=[ClientProfilePermissions.VIEW])],
    )

    client_document: ClientDocumentType = strawberry_django.field(
        extensions=[HasRetvalPerm(AttachmentPermissions.VIEW)],
    )

    client_documents: List[ClientDocumentType] = strawberry_django.field(
        extensions=[HasRetvalPerm(AttachmentPermissions.VIEW)],
    )

    client_documents_paginated: OffsetPaginated[ClientDocumentType] = strawberry_django.offset_paginated(
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
            get_user_permission_group(user)
            client_profile_data: dict = strawberry.asdict(data)
            _validate_client_profile_data(client_profile_data)

            user_data = client_profile_data.pop("user")
            client_user = User.objects.create_client(**user_data)
            phone_numbers = client_profile_data.pop("phone_numbers", []) or []

            client_profile = resolvers.create(
                info,
                ClientProfile,
                {
                    **client_profile_data,
                    "user": client_user,
                },
            )

            content_type = ContentType.objects.get_for_model(ClientProfile)

            for phone_number in phone_numbers:
                PhoneNumber.objects.create(
                    content_type=content_type,
                    object_id=client_profile.id,
                    number=phone_number["number"],
                    is_primary=phone_number["is_primary"],
                )

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

            _validate_client_profile_data(client_profile_data)

            if user_data := client_profile_data.pop("user", {}):
                if email := user_data.get("email", ""):
                    user_data["email"] = email.lower()

                client_user = resolvers.update(
                    info,
                    client_user,
                    {
                        **user_data,
                        "id": client_profile.user.id,
                    },
                )

            related_classes = [
                field
                for field in ClientProfile._meta.get_fields()
                if hasattr(field, "remote_field")
                and (isinstance(field.remote_field, ForeignKey) or isinstance(field.remote_field, GenericRel))
            ]

            for related_cls in related_classes:
                related_name = related_cls.name
                if (
                    related_name in client_profile_data.keys()
                    and client_profile_data[related_name] is not strawberry.UNSET
                ):
                    upsert_or_delete_client_related_object(
                        info,
                        related_cls,
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
