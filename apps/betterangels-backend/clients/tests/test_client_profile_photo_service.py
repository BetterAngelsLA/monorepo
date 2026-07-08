from typing import Any
from unittest.mock import MagicMock, patch

from clients.services.client_profile_photo import (
    CLIENT_PROFILE_PHOTO_CONFIG,
    create_presigned_upload,
    resolve_upload,
)
from common.services.attachment_upload import GenerateUploadItem, ResolveUploadItem
from common.services.exceptions import InvalidContentTypeError
from common.services.types import AuthorizedPresignedUpload, AuthorizedPresignedUploadBatch
from django.test import TestCase
from model_bakery import baker


class ValidateContentTypeTest(TestCase):
    def test_allows_valid_content_types(self) -> None:
        for content_type in CLIENT_PROFILE_PHOTO_CONFIG.allowed_content_types:
            self.assertIn(content_type, CLIENT_PROFILE_PHOTO_CONFIG.allowed_content_types)

    def test_rejects_invalid_content_type(self) -> None:
        # The generic pipeline raises InvalidContentTypeError, tested via
        # create_presigned_upload with an invalid type.
        upload = GenerateUploadItem(
            ref_id="ref-1",
            filename="doc.pdf",
            mime_type="application/pdf",
        )
        with self.assertRaises(InvalidContentTypeError):
            create_presigned_upload(user=MagicMock(), upload=upload)

    def test_rejects_empty_content_type(self) -> None:
        upload = GenerateUploadItem(
            ref_id="ref-1",
            filename="photo.jpg",
            mime_type="",
        )
        with self.assertRaises(InvalidContentTypeError):
            create_presigned_upload(user=MagicMock(), upload=upload)


class CreatePresignedUploadTest(TestCase):
    def setUp(self) -> None:
        self.user: Any = baker.make("accounts.User")
        self.upload = GenerateUploadItem(
            ref_id="ref-123",
            filename="photo.jpg",
            mime_type="image/jpeg",
        )

    @patch("common.services.attachment_upload.create_presigned_uploads")
    def test_returns_first_item_from_batch(self, mock_generic: MagicMock) -> None:
        mock_generic.return_value = AuthorizedPresignedUploadBatch(
            uploads=[
                AuthorizedPresignedUpload(
                    ref_id="ref-123",
                    presigned_key="media/client_profile_photos/abc.jpg",
                    url="https://s3.example.com/upload",
                    fields={"Policy": "xyz", "X-Amz-Signature": "sig"},
                    upload_token="token-abc",
                )
            ]
        )

        result = create_presigned_upload(user=self.user, upload=self.upload)

        self.assertEqual(result.ref_id, "ref-123")
        self.assertEqual(result.presigned_key, "media/client_profile_photos/abc.jpg")
        self.assertEqual(result.url, "https://s3.example.com/upload")
        self.assertEqual(result.fields, {"Policy": "xyz", "X-Amz-Signature": "sig"})
        self.assertEqual(result.upload_token, "token-abc")

    @patch("common.services.attachment_upload.create_presigned_uploads")
    def test_delegates_to_generic_with_config(self, mock_generic: MagicMock) -> None:
        mock_generic.return_value = AuthorizedPresignedUploadBatch(
            uploads=[AuthorizedPresignedUpload(ref_id="x", presigned_key="k", url="u", fields={}, upload_token="t")]
        )

        create_presigned_upload(user=self.user, upload=self.upload)

        mock_generic.assert_called_once_with(
            user=self.user,
            uploads=[self.upload],
            config=CLIENT_PROFILE_PHOTO_CONFIG,
        )

    def test_rejects_invalid_content_type(self) -> None:
        bad_upload = GenerateUploadItem(
            ref_id="ref-1",
            filename="doc.pdf",
            mime_type="application/pdf",
        )

        with self.assertRaises(InvalidContentTypeError):
            create_presigned_upload(user=self.user, upload=bad_upload)

    @patch("common.services.attachment_upload.create_presigned_uploads")
    def test_uses_service_name_as_token_scope(self, mock_generic: MagicMock) -> None:
        mock_generic.return_value = AuthorizedPresignedUploadBatch(
            uploads=[AuthorizedPresignedUpload(ref_id="x", presigned_key="k", url="u", fields={}, upload_token="t")]
        )

        create_presigned_upload(user=self.user, upload=self.upload)

        # The generic pipeline passes config to create_upload_token internally;
        # verify our config has the right service_name.
        self.assertEqual(CLIENT_PROFILE_PHOTO_CONFIG.service_name, "client_profile_photo")


class ResolveUploadTest(TestCase):
    def setUp(self) -> None:
        self.user: Any = baker.make("accounts.User")
        self.client_profile: Any = baker.make("clients.ClientProfile")
        self.presigned_key = "media/client_profile_photos/abc.jpg"
        self.upload_token = "valid-token"

    def _validated_item(self, file_path: str = "client_profile_photos/abc.jpg") -> MagicMock:
        item = MagicMock()
        item.file_path = file_path
        return item

    @patch("clients.services.client_profile_photo.validate_upload_batch")
    def test_saves_profile_photo_path(self, mock_validate_batch: MagicMock) -> None:
        mock_validate_batch.return_value = [self._validated_item()]

        result = resolve_upload(
            user=self.user,
            client_profile=self.client_profile,
            presigned_key=self.presigned_key,
            upload_token=self.upload_token,
            filename="photo.jpg",
            content_type="image/jpeg",
        )

        result.refresh_from_db()
        self.assertEqual(result.profile_photo.name, "client_profile_photos/abc.jpg")

    @patch("clients.services.client_profile_photo.validate_upload_batch")
    def test_returns_client_profile(self, mock_validate_batch: MagicMock) -> None:
        mock_validate_batch.return_value = [self._validated_item()]

        result = resolve_upload(
            user=self.user,
            client_profile=self.client_profile,
            presigned_key=self.presigned_key,
            upload_token=self.upload_token,
            filename="photo.jpg",
            content_type="image/jpeg",
        )

        self.assertEqual(result.pk, self.client_profile.pk)

    @patch("clients.services.client_profile_photo.validate_upload_batch")
    def test_validates_token_with_correct_params(self, mock_validate_batch: MagicMock) -> None:
        mock_validate_batch.return_value = [self._validated_item()]

        resolve_upload(
            user=self.user,
            client_profile=self.client_profile,
            presigned_key=self.presigned_key,
            upload_token=self.upload_token,
            filename="photo.jpg",
            content_type="image/jpeg",
        )

        mock_validate_batch.assert_called_once_with(
            user=self.user,
            uploads=[
                ResolveUploadItem(
                    presigned_key=self.presigned_key,
                    upload_token=self.upload_token,
                    filename="photo.jpg",
                    mime_type="image/jpeg",
                )
            ],
            config=CLIENT_PROFILE_PHOTO_CONFIG,
        )

    @patch("clients.services.client_profile_photo.validate_upload_batch")
    def test_raises_on_invalid_token(self, mock_validate_batch: MagicMock) -> None:
        from common.services.exceptions import InvalidUploadTokenError

        mock_validate_batch.side_effect = InvalidUploadTokenError("Invalid or expired upload signature")

        with self.assertRaises(InvalidUploadTokenError, msg="Invalid or expired upload signature"):
            resolve_upload(
                user=self.user,
                client_profile=self.client_profile,
                presigned_key=self.presigned_key,
                upload_token="bad-token",
                filename="photo.jpg",
                content_type="image/jpeg",
            )

    @patch("clients.services.client_profile_photo.validate_upload_batch")
    def test_strips_storage_dir_prefix(self, mock_validate_batch: MagicMock) -> None:
        mock_validate_batch.return_value = [self._validated_item(file_path="some_other_path/photo.png")]

        resolve_upload(
            user=self.user,
            client_profile=self.client_profile,
            presigned_key="media/some_other_path/photo.png",
            upload_token=self.upload_token,
            filename="photo.png",
            content_type="image/png",
        )

        self.client_profile.refresh_from_db()
        self.assertEqual(self.client_profile.profile_photo.name, "some_other_path/photo.png")

    @patch("clients.services.client_profile_photo.validate_upload_batch")
    def test_raises_when_file_not_in_s3(self, mock_validate_batch: MagicMock) -> None:
        from common.services.exceptions import S3KeyNotFoundError

        mock_validate_batch.side_effect = S3KeyNotFoundError("File not found in storage")

        with self.assertRaises(S3KeyNotFoundError, msg="File not found in storage"):
            resolve_upload(
                user=self.user,
                client_profile=self.client_profile,
                presigned_key=self.presigned_key,
                upload_token=self.upload_token,
                filename="photo.jpg",
                content_type="image/jpeg",
            )

        self.client_profile.refresh_from_db()
        self.assertFalse(self.client_profile.profile_photo)

    @patch("clients.services.client_profile_photo.validate_upload_batch")
    def test_does_not_save_on_invalid_token(self, mock_validate_batch: MagicMock) -> None:
        from common.services.exceptions import InvalidUploadTokenError

        mock_validate_batch.side_effect = InvalidUploadTokenError("Invalid or expired upload signature")

        with self.assertRaises(InvalidUploadTokenError):
            resolve_upload(
                user=self.user,
                client_profile=self.client_profile,
                presigned_key=self.presigned_key,
                upload_token="bad-token",
                filename="photo.jpg",
                content_type="image/jpeg",
            )

        self.client_profile.refresh_from_db()
        self.assertFalse(self.client_profile.profile_photo)
