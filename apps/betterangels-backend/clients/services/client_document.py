# apps/betterangels-backend/clients/services/client_document.py

from typing import Iterable

from clients.types import ClientDocumentUploadsInputItem
from common.services.s3 import PresignedS3UploadBatchResult, PresignedS3UploadInput, generate_s3_presigned_upload_urls

STORAGE_DIR = "media"
CLIENT_DOCUMENT_PATH = f"{STORAGE_DIR}/attachments_test"


def create_client_document_presigned_uploads(
    *,
    uploads: Iterable[ClientDocumentUploadsInputItem],  # ← change this
) -> PresignedS3UploadBatchResult:
    mapped_uploads: list[PresignedS3UploadInput] = []

    for upload in uploads:
        mapped_uploads.append(
            {
                "upload_ref": upload.upload_ref,
                "filename": upload.filename,
                "content_type": upload.content_type,
                "upload_path": CLIENT_DOCUMENT_PATH,
            }
        )

    return generate_s3_presigned_upload_urls(uploads=mapped_uploads)
