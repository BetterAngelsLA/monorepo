import re
from typing import Any, Dict, List, Optional, cast

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
    ClientContactPermissions,
    ClientHouseholdMemberPermissions,
    ClientProfileImportRecordPermissions,
    ClientProfilePermissions,
    HmisProfilePermissions,
    SocialMediaProfilePermissions,
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
from phonenumber_field.validators import validate_international_phonenumber
from strawberry.types import Info
from strawberry_django import mutations
from strawberry_django.auth.utils import get_current_user
from strawberry_django.mutations import resolvers
from strawberry_django.pagination import OffsetPaginated
from strawberry_django.permissions import HasPerm, HasRetvalPerm
from strawberry_django.utils.query import filter_for_user

from .enums import RelationshipTypeEnum
from .types import (
    ClientContactInput,
    ClientContactType,
    ClientDocumentType,
    ClientHouseholdMemberInput,
    ClientHouseholdMemberType,
    ClientProfileDataImportType,
    ClientProfileImportRecordsBulkInput,
    ClientProfileImportRecordType,
    ClientProfilePhotoInput,
    ClientProfileType,
    CreateClientDocumentInput,
    CreateClientProfileInput,
    CreateProfileDataImportInput,
    HmisProfileInput,
    HmisProfileType,
    ImportClientProfileInput,
    SocialMediaProfileInput,
    SocialMediaProfileType,
    UpdateClientDocumentInput,
    UpdateClientProfileInput,
)


def _format_graphql_error(error: Exception) -> str:
    # Use error.message if available; otherwise, fallback to error.args[0] or str(error)
    message = getattr(error, "message", None) or (error.args[0] if error.args else str(error))

    # Attempt to get custom error details from the extensions attribute.
    extensions = getattr(error, "extensions", {})
    error_list = extensions.get("errors", [])

    if error_list and isinstance(error_list, list):
        details = "; ".join(
            f"{err.get('field', 'unknown')}: {err.get('errorCode', 'N/A')}"
            + (f" at {err.get('location')}" if err.get("location") else "")
            for err in error_list
        )
        return f"{message}: {details}"

    return message


def value_exists(value: Optional[str]) -> bool:
    return value is not strawberry.UNSET and value is not None and value.strip() != ""


def _payload_has_name(data: dict) -> bool:
    return (
        value_exists(data.get("first_name"))
        or value_exists(data.get("last_name"))
        or value_exists(data.get("middle_name"))
        or value_exists(data.get("nickname"))
    )


def validate_name(
    data: dict,
) -> list[dict[str, Any]]:
    """Verify that either:
    1. The incoming data contains at least one name field OR
    2. The existing client profile has at least one name field and the incoming data isn't clearing it.
    """

    if _payload_has_name(data):
        return []

    client_profile = ClientProfile.objects.filter(id=data["id"]).first() if data.get("id") else None

    if client_profile:
        if (
            (client_profile.first_name and data.get("first_name") is strawberry.UNSET)
            or (client_profile.last_name and data.get("last_name") is strawberry.UNSET)
            or (client_profile.middle_name and data.get("middle_name") is strawberry.UNSET)
            or (client_profile.nickname and data.get("nickname") is strawberry.UNSET)
        ):
            return []

    return [{"field": "client_name", "location": None, "errorCode": ErrorCodeEnum.NAME_NOT_PROVIDED.name}]


def validate_email(
    email: Optional[str],
    client_profile_id: Optional[str] = None,
) -> list[dict[str, Any]]:
    if email in [strawberry.UNSET, None, ""]:
        return []

    email: str
    if not re.search(EMAIL_REGEX, email):
        return [{"field": "email", "location": None, "errorCode": ErrorCodeEnum.EMAIL_INVALID.name}]

    # exclude the client_profile being updated from the unique check
    exclude_arg = {"id": client_profile_id} if client_profile_id else {}

    if ClientProfile.objects.exclude(**exclude_arg).filter(email__iexact=email).exists():
        return [{"field": "email", "location": None, "errorCode": ErrorCodeEnum.EMAIL_IN_USE.name}]

    return []


def validate_california_id(
    california_id: Optional[str], client_profile_id: Optional[str] = None
) -> list[dict[str, Any]]:
    if california_id in [strawberry.UNSET, None, ""]:
        return []

    california_id: str
    if not re.search(CALIFORNIA_ID_REGEX, california_id):
        return [{"field": "californiaId", "location": None, "errorCode": ErrorCodeEnum.CA_ID_INVALID.name}]

    # exclude the client profile being updated from the unique check
    exclude_arg = {"id": client_profile_id} if client_profile_id else {}

    if ClientProfile.objects.exclude(**exclude_arg).filter(california_id__iexact=california_id).exists():
        return [{"field": "californiaId", "location": None, "errorCode": ErrorCodeEnum.CA_ID_IN_USE.name}]

    return []


def validate_phone_numbers(phone_numbers: list[dict[str, Any]]) -> list[dict[str, Any]]:
    errors = []

    for idx, phone_number in enumerate(phone_numbers):
        if not phone_number.get("number"):
            continue

        try:
            validate_international_phonenumber(phone_number["number"])
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

        if not value_exists(hmis_id):
            errors.append(
                {
                    "field": "hmisProfiles",
                    "location": f"{idx}__hmisId",
                    "errorCode": ErrorCodeEnum.HMIS_ID_NOT_PROVIDED.name,
                }
            )

            continue

        # exclude the hmis profile being updated from the unique check
        exclude_arg = {"id": hmis_profile["id"]} if hmis_profile.get("id") else {}

        if (
            HmisProfile.objects.exclude(**exclude_arg)
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
            validate_international_phonenumber(contact["phone_number"])
        except ValidationError:
            errors.append(
                {
                    "field": "contacts",
                    "location": f"{idx}__phoneNumber",
                    "errorCode": ErrorCodeEnum.PHONE_NUMBER_INVALID.name,
                }
            )

    return errors


def validate_client_profile_data(data: dict) -> None:
    """Validates the data for creating or updating a client profile."""
    errors: list = []

    errors += validate_name(data)

    if email := data.get("email"):
        errors += validate_email(email, data.get("id"))

    if california_id := data.get("california_id"):
        errors += validate_california_id(california_id, data.get("id"))

    if data.get("contacts"):
        errors += validate_contacts(data["contacts"])

    if data.get("hmis_profiles"):
        errors += validate_hmis_profiles(data["hmis_profiles"])

    if data.get("phone_numbers"):
        errors += validate_phone_numbers(data["phone_numbers"])

    if errors:
        raise GraphQLError("Validation Errors", extensions={"errors": errors})

    return None


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

    client_profiles: OffsetPaginated[ClientProfileType] = strawberry_django.offset_paginated(
        extensions=[HasRetvalPerm(perms=[ClientProfilePermissions.VIEW])],
    )

    client_document: ClientDocumentType = strawberry_django.field(
        extensions=[HasRetvalPerm(AttachmentPermissions.VIEW)],
    )

    client_documents: OffsetPaginated[ClientDocumentType] = strawberry_django.offset_paginated(
        extensions=[HasRetvalPerm(AttachmentPermissions.VIEW)],
    )

    client_contact: ClientContactType = strawberry_django.field(
        extensions=[HasRetvalPerm(ClientContactPermissions.VIEW)],
    )

    client_contacts: OffsetPaginated[ClientContactType] = strawberry_django.offset_paginated(
        extensions=[HasRetvalPerm(ClientContactPermissions.VIEW)],
    )

    client_household_member: ClientHouseholdMemberType = strawberry_django.field(
        extensions=[HasRetvalPerm(ClientHouseholdMemberPermissions.VIEW)],
    )

    client_household_members: OffsetPaginated[ClientHouseholdMemberType] = strawberry_django.offset_paginated(
        extensions=[HasRetvalPerm(ClientHouseholdMemberPermissions.VIEW)],
    )

    hmis_profile: HmisProfileType = strawberry_django.field(
        extensions=[HasRetvalPerm(HmisProfilePermissions.VIEW)],
    )

    hmis_profiles: OffsetPaginated[HmisProfileType] = strawberry_django.offset_paginated(
        extensions=[HasRetvalPerm(HmisProfilePermissions.VIEW)],
    )

    social_media_profile: SocialMediaProfileType = strawberry_django.field(
        extensions=[HasRetvalPerm(SocialMediaProfilePermissions.VIEW)],
    )

    social_media_profiles: OffsetPaginated[SocialMediaProfileType] = strawberry_django.offset_paginated(
        extensions=[HasRetvalPerm(SocialMediaProfilePermissions.VIEW)],
    )

    # Data Import
    @strawberry_django.offset_paginated(extensions=[HasPerm(ClientProfileImportRecordPermissions.VIEW)])
    def bulk_client_profile_import_records(
        self, info: Info, data: ClientProfileImportRecordsBulkInput
    ) -> OffsetPaginated[ClientProfileImportRecordType]:
        """
        Given input data containing a source (e.g. "SELAH") and a list of sourceIds,
        return the matching records.
        Note: Only records that exist in the database will be returned.
        """

        qs = ClientProfileImportRecord.objects.filter(
            source_name=data.source,
            source_id__in=data.sourceIds,
            success=True,
        )
        return cast(OffsetPaginated[ClientProfileImportRecordType], qs)


@strawberry.type
class Mutation:
    @strawberry_django.mutation(extensions=[HasPerm(perms=[ClientProfilePermissions.ADD])])
    def create_client_profile(self, info: Info, data: CreateClientProfileInput) -> ClientProfileType:
        with transaction.atomic():
            client_profile_data: dict = strawberry.asdict(data)
            validate_client_profile_data(client_profile_data)

            phone_numbers = client_profile_data.pop("phone_numbers", []) or []

            client_profile = resolvers.create(
                info,
                ClientProfile,
                client_profile_data,
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
            except ClientProfile.DoesNotExist:
                raise PermissionError("You do not have permission to modify this client.")

            client_profile_data: dict = strawberry.asdict(data)
            validate_client_profile_data(client_profile_data)

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

                client_profile.delete()

            except ClientProfile.DoesNotExist:
                raise PermissionError("No profile deleted; profile may not exist or lacks proper permissions")

            return DeletedObjectType(id=client_profile_id)

    create_client_contact: ClientContactType = mutations.create(
        ClientContactInput,
        extensions=[HasPerm(perms=ClientContactPermissions.ADD)],
    )

    update_client_contact: ClientContactType = mutations.update(
        ClientContactInput,
        extensions=[HasRetvalPerm(perms=ClientContactPermissions.CHANGE)],
    )

    delete_client_contact: ClientContactType = mutations.delete(
        DeleteDjangoObjectInput,
        extensions=[HasRetvalPerm(perms=ClientContactPermissions.DELETE)],
    )

    create_client_household_member: ClientHouseholdMemberType = mutations.create(
        ClientHouseholdMemberInput,
        extensions=[HasPerm(perms=ClientHouseholdMemberPermissions.ADD)],
    )

    update_client_household_member: ClientHouseholdMemberType = mutations.update(
        ClientHouseholdMemberInput,
        extensions=[HasRetvalPerm(perms=ClientHouseholdMemberPermissions.CHANGE)],
    )

    delete_client_household_member: ClientHouseholdMemberType = mutations.delete(
        DeleteDjangoObjectInput,
        extensions=[HasRetvalPerm(perms=ClientHouseholdMemberPermissions.DELETE)],
    )

    create_hmis_profile: HmisProfileType = mutations.create(
        HmisProfileInput,
        extensions=[HasPerm(perms=HmisProfilePermissions.ADD)],
    )

    update_hmis_profile: HmisProfileType = mutations.update(
        HmisProfileInput,
        extensions=[HasRetvalPerm(perms=HmisProfilePermissions.CHANGE)],
    )

    delete_hmis_profile: HmisProfileType = mutations.delete(
        DeleteDjangoObjectInput,
        extensions=[HasRetvalPerm(perms=HmisProfilePermissions.DELETE)],
    )

    create_social_media_profile: SocialMediaProfileType = mutations.create(
        SocialMediaProfileInput,
        extensions=[HasPerm(perms=SocialMediaProfilePermissions.ADD)],
    )

    update_social_media_profile: SocialMediaProfileType = mutations.update(
        SocialMediaProfileInput,
        extensions=[HasRetvalPerm(perms=SocialMediaProfilePermissions.CHANGE)],
    )

    delete_social_media_profile: SocialMediaProfileType = mutations.delete(
        DeleteDjangoObjectInput,
        extensions=[HasRetvalPerm(perms=SocialMediaProfilePermissions.DELETE)],
    )

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
            )

            permissions = [
                AttachmentPermissions.DELETE,
                AttachmentPermissions.CHANGE,
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

    @strawberry_django.mutation(extensions=[HasPerm(ClientProfileImportRecordPermissions.ADD)])
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

    update_client_document: ClientDocumentType = mutations.update(
        UpdateClientDocumentInput,
        extensions=[HasRetvalPerm(perms=AttachmentPermissions.CHANGE)],
    )
