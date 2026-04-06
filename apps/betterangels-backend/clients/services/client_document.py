from typing import Iterable, TypedDict

from accounts.models import User
from accounts.utils import get_user_permission_group
from clients.models import ClientProfile
from clients.types import ClientDocumentFromUploadsInput, ClientDocumentUploadsInputItem
from common.models import Attachment
from common.permissions.enums import AttachmentPermissions
from common.permissions.utils import assign_object_permissions
from common.services.s3 import DEFAULT_UPLOAD_EXPIRATION_SECONDS, generate_s3_presigned_upload_urls
from common.services.upload_token import create_upload_token, validate_upload_token
from django.contrib.contenttypes.models import ContentType

STORAGE_DIR = "media"
CLIENT_DOCUMENT_RELATIVE_PATH = "attachments"
S3_CLIENT_DOCUMENT_PREFIX = f"{STORAGE_DIR}/{CLIENT_DOCUMENT_RELATIVE_PATH}"
SERVICE_NAME = "client_document"


class AuthorizedPresignedUpload(TypedDict):
    ref_id: str
    presigned_key: str
    url: str
    fields: dict[str, str]
    upload_token: str


class AuthorizedPresignedUploadBatch(TypedDict):
    uploads: list[AuthorizedPresignedUpload]


def create_presigned_uploads(
    *,
    user: User,
    uploads: Iterable[ClientDocumentUploadsInputItem],
) -> AuthorizedPresignedUploadBatch:
    mapped_uploads = [
        {
            "ref_id": upload.ref_id,
            "filename": upload.filename,
            "content_type": upload.content_type,
            "upload_path": S3_CLIENT_DOCUMENT_PREFIX,
        }
        for upload in uploads
    ]

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

    attachments: list[Attachment] = []

    for doc in documents:
        if not validate_upload_token(
            upload_token=doc.upload_token,
            key=doc.presigned_key,
            user_id=user.pk,
            scope=SERVICE_NAME,
        ):
            raise ValueError("Invalid or expired upload signature")

        storage_prefix = f"{STORAGE_DIR}/"

        if not doc.presigned_key.startswith(storage_prefix):
            raise ValueError("Invalid storage key")

        # strip "media/"
        file_path = doc.presigned_key[len(storage_prefix) :]

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

        attachments.append(attachment)

    return attachments
