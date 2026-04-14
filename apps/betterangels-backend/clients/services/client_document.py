from typing import Iterable

from accounts.models import User
from accounts.utils import get_user_permission_group
from clients.models import ClientProfile
from clients.types import ClientDocumentFromUploadsInput, ClientDocumentUploadsInputItem
from common.constants import DEFAULT_DOCUMENT_CONTENT_TYPES, DEFAULT_IMAGE_CONTENT_TYPES
from common.models import Attachment
from common.permissions.enums import AttachmentPermissions
from common.permissions.utils import assign_object_permissions
from common.services.s3 import (
    DEFAULT_UPLOAD_EXPIRATION_SECONDS,
    PresignedS3UploadInput,
    generate_s3_presigned_upload_urls,
    s3_key_exists,
    strip_storage_location,
)
from common.services.types import AuthorizedPresignedUpload, AuthorizedPresignedUploadBatch
from common.services.upload_token import create_upload_token, validate_upload_token
from django.contrib.contenttypes.models import ContentType

UPLOAD_PATH = "attachments"
SERVICE_NAME = "client_document"

ALLOWED_CONTENT_TYPES = DEFAULT_DOCUMENT_CONTENT_TYPES | DEFAULT_IMAGE_CONTENT_TYPES


def _validate_content_type(content_type: str, filename: str) -> None:
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError(f"Unsupported content_type: {content_type} for filename={filename}.")


def create_presigned_uploads(
    *,
    user: User,
    uploads: Iterable[ClientDocumentUploadsInputItem],
) -> AuthorizedPresignedUploadBatch:
    mapped_uploads: list[PresignedS3UploadInput] = []

    for upload in uploads:
        _validate_content_type(upload.content_type, upload.filename)

        mapped_uploads.append(
            {
                "ref_id": upload.ref_id,
                "filename": upload.filename,
                "content_type": upload.content_type,
                "upload_path": UPLOAD_PATH,
            }
        )

    presigned_batch = generate_s3_presigned_upload_urls(uploads=mapped_uploads)

    authorized_uploads: list[AuthorizedPresignedUpload] = []

    for item in presigned_batch["uploads"]:
        upload_token = create_upload_token(
            key=item["key"],
            user_id=user.pk,
            expires_in_seconds=DEFAULT_UPLOAD_EXPIRATION_SECONDS,
            scope=SERVICE_NAME,
        )

        authorized_uploads.append(
            {
                "ref_id": item["ref_id"],
                "url": item["url"],
                "fields": item["fields"],
                "presigned_key": item["key"],
                "upload_token": upload_token,
            }
        )

    return AuthorizedPresignedUploadBatch(uploads=authorized_uploads)


def resolve_upload(
    *,
    user: User,
    client_profile: ClientProfile,
    documents: Iterable[ClientDocumentFromUploadsInput],
) -> list[Attachment]:
    permission_group = get_user_permission_group(user)
    content_type = ContentType.objects.get_for_model(ClientProfile)

    # Validate the entire batch before any DB writes.
    docs = list(documents)

    for doc in docs:
        _validate_content_type(doc.content_type, doc.filename)

        if not validate_upload_token(
            upload_token=doc.upload_token,
            key=doc.presigned_key,
            user_id=user.pk,
            scope=SERVICE_NAME,
        ):
            raise ValueError(f"Invalid or expired upload signature for '{doc.filename}'")

        if not s3_key_exists(key=doc.presigned_key):
            raise ValueError(f"File not found in storage for '{doc.filename}'")

    # Validations passed — persist attachments.
    attached: list[Attachment] = []

    for doc in docs:
        file_path = strip_storage_location(doc.presigned_key)

        attachment = Attachment(
            file=file_path,
            mime_type=doc.content_type,
            original_filename=doc.filename,
            namespace=doc.namespace,
            content_type=content_type,
            object_id=client_profile.id,
            uploaded_by=user,
        )

        attachment.save(direct_upload=True)

        assign_object_permissions(
            permission_group.group,
            attachment,
            [
                AttachmentPermissions.DELETE,
                AttachmentPermissions.CHANGE,
            ],
        )

        attached.append(attachment)

    return attached
