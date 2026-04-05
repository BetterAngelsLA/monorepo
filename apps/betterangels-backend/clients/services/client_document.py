# apps/betterangels-backend/clients/services/client_document.py

from typing import Iterable

from accounts.models import User
from accounts.utils import get_user_permission_group
from clients.models import ClientProfile
from clients.types import ClientDocumentFromUploadsInput, ClientDocumentUploadsInputItem
from common.models import Attachment
from common.permissions.enums import AttachmentPermissions
from common.permissions.utils import assign_object_permissions
from common.services.s3 import (
    DEFAULT_UPLOAD_EXPIRATION_SECONDS,
    PresignedS3UploadInput,
    generate_s3_presigned_upload_urls,
)
from common.services.upload_signature import create_upload_signature, validate_upload_signature
from django.contrib.contenttypes.models import ContentType

STORAGE_DIR = "media"
CLIENT_DOCUMENT_RELATIVE_PATH = "attachments"
S3_CLIENT_DOCUMENT_PREFIX = f"{STORAGE_DIR}/{CLIENT_DOCUMENT_RELATIVE_PATH}"


class SecurePresignedS3UploadResult:
    def __init__(self, ref_id: str, url: str, fields: dict, key: str, signature_key: str):
        self.ref_id = ref_id
        self.url = url
        self.fields = fields
        self.key = key
        self.signature_key = signature_key


class SecurePresignedS3UploadBatchResult:
    def __init__(self, uploads: list[SecurePresignedS3UploadResult]):
        self.uploads = uploads


def create_presigned_uploads(
    *,
    user: User,
    uploads: Iterable[ClientDocumentUploadsInputItem],
) -> SecurePresignedS3UploadBatchResult:
    mapped_uploads: list[PresignedS3UploadInput] = []

    for upload in uploads:
        mapped_uploads.append(
            {
                "ref_id": upload.ref_id,
                "filename": upload.filename,
                "content_type": upload.content_type,
                "upload_path": S3_CLIENT_DOCUMENT_PREFIX,
            }
        )

    presigned_batch = generate_s3_presigned_upload_urls(uploads=mapped_uploads)

    secure_uploads: list[SecurePresignedS3UploadResult] = []

    for item in presigned_batch["uploads"]:
        signature_key = create_upload_signature(
            key=item["key"],
            user_id=user.pk,
            expires_in_seconds=DEFAULT_UPLOAD_EXPIRATION_SECONDS,
        )
        secure_uploads.append(
            SecurePresignedS3UploadResult(
                ref_id=item["ref_id"],
                url=item["url"],
                fields=item["fields"],
                key=item["key"],
                signature_key=signature_key,
            )
        )

    return SecurePresignedS3UploadBatchResult(uploads=secure_uploads)


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
        if not doc.key.startswith(S3_CLIENT_DOCUMENT_PREFIX):
            raise ValueError(f"Invalid key: {doc.key}")

        if not validate_upload_signature(signature_key=doc.signature_key, key=doc.key, user_id=user.pk):
            raise ValueError("Invalid or expired upload signature")

        file_path = doc.key[len(STORAGE_DIR) + 1 :]  # strip "media/"

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
