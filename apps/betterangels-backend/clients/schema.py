import re
from typing import Any, Dict, List, Optional, cast

import phonenumber_field
import strawberry
import strawberry_django
from accounts.models import User
from accounts.utils import get_user_permission_group
from clients.enums import ErrorCodeEnum
from clients.models import (
    ClientContact,
    ClientProfile,
    ClientProfileDataImport,
    ClientProfileImportRecord,
    HmisProfile,
)
from clients.permissions import (
    ClientProfileImportRecordPermissions,
    ClientProfilePermissions,
)
from common.constants import CALIFORNIA_ID_REGEX, EMAIL_REGEX
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
    ClientProfileDataImportType,
    ClientProfileImportRecordType,
    ClientProfilePhotoInput,
    ClientProfileType,
    CreateClientDocumentInput,
    CreateClientProfileInput,
    CreateProfileDataImportInput,
    ImportClientProfileInput,
    UpdateClientProfileInput,
)


def _format_graphql_error(error: Exception) -> str:
    if isinstance(error, GraphQLError) and hasattr(error, "extensions"):
        # Extract the custom error list if available.
        ext = error.extensions or {}
        error_list = ext.get("errors")
        if error_list:
            detailed_errors = "; ".join(f"{err.get('field')}: {err.get('message')}" for err in error_list)
            return f"{error.message} ({detailed_errors})"
    # Fallback: return the standard string representation.
    return str(error)


def value_is_set(value: Optional[str]) -> bool:
    return not (value is strawberry.UNSET or value is None or value.strip() == "")


def validate_client_name(user_data: dict, nickname: Optional[str], user: Optional[User] = None) -> list[dict[str, Any]]:
    errors: list = []

    payload_has_name = any(
        (
            value_is_set(user_data.get("first_name")),
            value_is_set(user_data.get("last_name")),
            value_is_set(user_data.get("middle_name")),
            value_is_set(nickname),
        )
    )

    # If the payload contains at least one name field, the data is valid
    if payload_has_name:
        return errors

    # If the payload isn't clearing all existing name fields, the data is valid
    if user:
        client_has_name = any(
            (
                user.first_name and user_data.get("first_name") is strawberry.UNSET,
                user.last_name and user_data.get("last_name") is strawberry.UNSET,
                user.middle_name and user_data.get("middle_name") is strawberry.UNSET,
                user.client_profile.nickname and nickname is strawberry.UNSET,
            )
        )

        if client_has_name:
            return errors

    errors.append({"field": "nickname", "location": None, "errorCode": ErrorCodeEnum.NAME_NOT_PROVIDED.name})

    return errors


def validate_user_email(email: Optional[str], user: Optional[User] = None) -> list[dict[str, Any]]:
    errors: list = []

    if email in [strawberry.UNSET, None, ""]:
        return errors

    email: str
    if not re.search(EMAIL_REGEX, email):
        errors.append({"field": "user", "location": "email", "errorCode": ErrorCodeEnum.EMAIL_INVALID.name})

        return errors

    exclude_arg = {"id": user.pk} if user else {}

    if User.objects.exclude(**exclude_arg).filter(email__iexact=email).exists():
        errors.append({"field": "user", "location": "email", "errorCode": ErrorCodeEnum.EMAIL_IN_USE.name})

    return errors


def validate_california_id(california_id: Optional[str], user: Optional[User] = None) -> list[dict[str, Any]]:
    errors: list = []

    if california_id in [strawberry.UNSET, None, ""]:
        return errors

    california_id: str
    if not re.search(CALIFORNIA_ID_REGEX, california_id):
        errors.append({"field": "californiaId", "location": None, "errorCode": ErrorCodeEnum.CA_ID_INVALID.name})

        return errors

    exclude_arg = {"user_id": user.pk} if user else {}

    if ClientProfile.objects.exclude(**exclude_arg).filter(california_id__iexact=california_id).exists():
        errors.append({"field": "californiaId", "location": None, "errorCode": ErrorCodeEnum.CA_ID_IN_USE.name})

    return errors


def validate_phone_numbers(phone_numbers: list[dict[str, Any]]) -> list[dict[str, Any]]:
    errors = []

    for idx, phone_number in enumerate(phone_numbers):
        if not phone_number.get("number"):
            continue

        try:
            phonenumber_field.validators.validate_international_phonenumber(phone_number["number"])
        except ValidationError:
            errors.append(
                {
                    "field": "phoneNumbers",
                    "location": f"{idx}__number",
                    "errorCode": ErrorCodeEnum.PHONE_NUMBER_INVALID.name,
                }
            )

    return errors


def validate_hmis_profiles(hmis_profiles: list[dict[str, Any]]) -> list[dict[str, Any]]:
    errors = []

    for idx, hmis_profile in enumerate(hmis_profiles):
        hmis_id = hmis_profile.get("hmis_id")

        if not value_is_set(hmis_id):
            errors.append(
                {
                    "field": "hmisProfiles",
                    "location": f"{idx}__hmisId",
                    "errorCode": ErrorCodeEnum.HMIS_ID_NOT_PROVIDED.name,
                }
            )

            continue

        hmis_profile_id = {"id": hmis_profile["id"]} if hmis_profile.get("id") else {}

        if (
            HmisProfile.objects.exclude(**hmis_profile_id)
            .filter(
                agency=hmis_profile["agency"],
                hmis_id__iexact=hmis_profile["hmis_id"],
            )
            .exists()
        ):
            errors.append(
                {
                    "field": "hmisProfiles",
                    "location": f"{idx}__hmisId",
                    "errorCode": ErrorCodeEnum.HMIS_ID_IN_USE.name,
                }
            )

    return errors


def validate_contacts(contacts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    errors = []

    for idx, contact in enumerate(contacts):
        if not contact.get("phone_number"):
            continue

        try:
            phonenumber_field.validators.validate_international_phonenumber(contact["phone_number"])
        except ValidationError:
            errors.append(
                {
                    "field": "contacts",
                    "location": f"{idx}__phoneNumber",
                    "errorCode": ErrorCodeEnum.PHONE_NUMBER_INVALID.name,
                }
            )

    return errors


def validate_client_profile_data(data: dict) -> dict[Any, Any]:
    """Validates the data for creating or updating a client profile."""
    errors: list = []

    user = None

    if value_is_set(data.get("id")):
        user = User.objects.filter(client_profile__id=data["id"]).first()

    if user_data := data.get("user"):
        errors += validate_client_name(user_data, user_data.get("nickname"), user)
        errors += validate_user_email(user_data.get("email"), user)

    if data.get("california_id"):
        errors += validate_california_id(data["california_id"], user)

    if data.get("contacts"):
        errors += validate_contacts(data["contacts"])

    if data.get("hmis_profiles"):
        errors += validate_hmis_profiles(data["hmis_profiles"])

    if data.get("phone_numbers"):
        errors += validate_phone_numbers(data["phone_numbers"])

    if errors:
        raise GraphQLError("Validation Errors", extensions={"errors": errors})

    return data


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

            validate_client_profile_data(client_profile_data)

            user_data = client_profile_data.pop("user")
            client_user = User.objects.create_client(**user_data)
            phone_numbers = client_profile_data.pop("phone_numbers", []) or []

            # TODO: remove after fe cutover to new field & type
            if client_profile_data.get("temp_veteran_status") != strawberry.UNSET:
                client_profile_data["veteran_status"] = client_profile_data["temp_veteran_status"]

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

            # TODO: remove after fe cutover to new field & type
            if client_profile_data.get("temp_veteran_status") != strawberry.UNSET:
                client_profile_data["veteran_status"] = client_profile_data["temp_veteran_status"]

            validate_client_profile_data(client_profile_data)

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

    # Data Import
    @strawberry_django.mutation(extensions=[HasPerm(ClientProfileImportRecordPermissions.ADD)])
    def create_client_profile_data_import(
        self, info: Info, data: CreateProfileDataImportInput
    ) -> "ClientProfileDataImportType":
        user = cast(User, get_current_user(info))
        record = ClientProfileDataImport.objects.create(
            source_file=data.source_file,
            imported_by=user,
            notes=data.notes,
        )
        return ClientProfileDataImportType(
            id=record.id,
            imported_at=record.imported_at,
            imported_by=record.imported_by,
            notes=record.notes,
            source_file=record.source_file,
        )

    @strawberry_django.mutation(extensions=[HasPerm([ClientProfileImportRecordPermissions.ADD])])
    def import_client_profile(self, info: Info, data: ImportClientProfileInput) -> ClientProfileImportRecordType:
        existing = ClientProfileImportRecord.objects.filter(
            source_id=data.source_id, source_name=data.source_name, success=True
        ).first()
        if existing:
            raise Exception(
                f"Source ID {data.source_id} with source name '{data.source_name}' has already been imported successfully."
            )

        import_job = ClientProfileDataImport.objects.get(id=data.import_job_id)
        try:
            with transaction.atomic():
                client_profile = Mutation.create_client_profile(self, info, data.client_profile)
                record = ClientProfileImportRecord.objects.create(
                    import_job=import_job,
                    source_id=data.source_id,
                    source_name=data.source_name,
                    client_profile=client_profile,
                    raw_data=data.raw_data,
                    success=True,
                )
        except Exception as e:
            record = ClientProfileImportRecord.objects.create(
                import_job=import_job,
                source_id=data.source_id,
                source_name=data.source_name,
                raw_data=data.raw_data,
                success=False,
                error_message=_format_graphql_error(e),
            )
        return cast(ClientProfileImportRecordType, record)


# trigger build
