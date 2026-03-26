# apps/betterangels-backend/clients/services/upload.py

from common.services.s3 import PresignedPostResult, generate_s3_presigned_post

CLIENT_ATTACHMENT_PATH = "media/attachments_test"
CLIENT_PROFILE_PHOTO_PATH = "media/client_profile_photos"


def generate_client_document_presigned_upload(
    *,
    filename: str,
    content_type: str,
) -> PresignedPostResult:
    return generate_s3_presigned_post(
        filename=filename,
        content_type=content_type,
        upload_path=CLIENT_ATTACHMENT_PATH,
    )


# def generate_client_profile_photo_presigned_upload(...)
