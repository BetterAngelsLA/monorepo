# apps/betterangels-backend/clients/services/client_document.py

from typing import Iterable

from accounts.models import User
from accounts.utils import get_user_permission_group
from clients.models import ClientProfile
from clients.types import ClientDocumentFromUploadsInput, ClientDocumentUploadsInputItem
from common.models import Attachment
from common.permissions.enums import AttachmentPermissions
from common.permissions.utils import assign_object_permissions
from common.services.s3 import PresignedS3UploadBatchResult, PresignedS3UploadInput, generate_s3_presigned_upload_urls
from django.contrib.contenttypes.models import ContentType

STORAGE_DIR = "media"
CLIENT_DOCUMENT_RELATIVE_PATH = "attachments_test"
S3_CLIENT_DOCUMENT_PREFIX = f"{STORAGE_DIR}/{CLIENT_DOCUMENT_RELATIVE_PATH}"


def create_client_document_presigned_uploads(
    *,
    uploads: Iterable[ClientDocumentUploadsInputItem],  # ← change this
) -> PresignedS3UploadBatchResult:
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

    return generate_s3_presigned_upload_urls(uploads=mapped_uploads)


def create_client_documents_from_s3_uploads(
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
