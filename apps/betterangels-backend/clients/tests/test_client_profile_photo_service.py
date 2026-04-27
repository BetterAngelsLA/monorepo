from typing import Any
from unittest.mock import MagicMock, patch

from clients.services.client_profile_photo import (
    ALLOWED_CONTENT_TYPES,
    SERVICE_NAME,
    UPLOAD_PATH,
    _validate_content_type,
    create_presigned_upload,
    resolve_upload,
)
from common.services.s3 import DEFAULT_UPLOAD_EXPIRATION_SECONDS
from django.test import TestCase
from model_bakery import baker


class ValidateContentTypeTest(TestCase):
    def test_allows_valid_content_types(self) -> None:
        for content_type in ALLOWED_CONTENT_TYPES:
            try:
                _validate_content_type(content_type)
            except ValueError:
                self.fail(f"_validate_content_type raised ValueError for allowed type: {content_type}")

    def test_rejects_invalid_content_type(self) -> None:
        with self.assertRaises(ValueError, msg="Content type not allowed: application/pdf"):
            _validate_content_type("application/pdf")

    def test_rejects_empty_content_type(self) -> None:
        with self.assertRaises(ValueError, msg="Content type not allowed: "):
            _validate_content_type("")


class CreatePresignedUploadTest(TestCase):
    def setUp(self) -> None:
        self.user: Any = baker.make("accounts.User")
        self.upload = MagicMock()
        self.upload.ref_id = "ref-123"
        self.upload.filename = "photo.jpg"
        self.upload.content_type = "image/jpeg"

    @patch("clients.services.client_profile_photo.create_upload_token")
    @patch("clients.services.client_profile_photo.generate_s3_presigned_upload_urls")
    def test_returns_presigned_upload_dict(self, mock_s3: MagicMock, mock_token: MagicMock) -> None:
        mock_s3.return_value = {
            "uploads": [
                {
                    "ref_id": "ref-123",
                    "key": "media/client_profile_photos/abc.jpg",
                    "url": "https://s3.example.com/upload",
                    "fields": {"Policy": "xyz", "X-Amz-Signature": "sig"},
                }
            ]
        }
        mock_token.return_value = "token-abc"

        result = create_presigned_upload(user=self.user, upload=self.upload)

        self.assertEqual(result["ref_id"], "ref-123")
        self.assertEqual(result["presigned_key"], "media/client_profile_photos/abc.jpg")
        self.assertEqual(result["url"], "https://s3.example.com/upload")
        self.assertEqual(result["fields"], {"Policy": "xyz", "X-Amz-Signature": "sig"})
        self.assertEqual(result["upload_token"], "token-abc")

    @patch("clients.services.client_profile_photo.create_upload_token")
    @patch("clients.services.client_profile_photo.generate_s3_presigned_upload_urls")
    def test_passes_correct_upload_path_to_s3(self, mock_s3: MagicMock, mock_token: MagicMock) -> None:
        mock_s3.return_value = {"uploads": [{"ref_id": "ref-123", "key": "k", "url": "u", "fields": {}}]}
        mock_token.return_value = "t"

        create_presigned_upload(user=self.user, upload=self.upload)

        mock_s3.assert_called_once_with(
            uploads=[
                {
                    "ref_id": "ref-123",
                    "filename": "photo.jpg",
                    "content_type": "image/jpeg",
                    "upload_path": UPLOAD_PATH,
                }
            ]
        )

    def test_rejects_invalid_content_type(self) -> None:
        self.upload.content_type = "application/pdf"

        with self.assertRaises(ValueError, msg="Content type not allowed: application/pdf"):
            create_presigned_upload(user=self.user, upload=self.upload)

    @patch("clients.services.client_profile_photo.create_upload_token")
    @patch("clients.services.client_profile_photo.generate_s3_presigned_upload_urls")
    def test_creates_token_with_correct_params(self, mock_s3: MagicMock, mock_token: MagicMock) -> None:
        mock_s3.return_value = {
            "uploads": [{"ref_id": "ref-123", "key": "media/client_profile_photos/abc.jpg", "url": "u", "fields": {}}]
        }
        mock_token.return_value = "t"

        create_presigned_upload(user=self.user, upload=self.upload)

        mock_token.assert_called_once_with(
            key="media/client_profile_photos/abc.jpg",
            user_id=self.user.pk,
            expires_in_seconds=DEFAULT_UPLOAD_EXPIRATION_SECONDS,
            scope=SERVICE_NAME,
        )


class ResolveUploadTest(TestCase):
    def setUp(self) -> None:
        self.user: Any = baker.make("accounts.User")
        self.client_profile: Any = baker.make("clients.ClientProfile")
        self.presigned_key = "media/client_profile_photos/abc.jpg"
        self.upload_token = "valid-token"

        storage_location_patcher = patch(
            "clients.services.client_profile_photo.strip_storage_location",
            side_effect=lambda key: key.removeprefix("media/"),
        )
        storage_location_patcher.start()
        self.addCleanup(storage_location_patcher.stop)

    @patch("clients.services.client_profile_photo.s3_key_exists", return_value=True)
    @patch("clients.services.client_profile_photo.validate_upload_token", return_value=True)
    def test_saves_profile_photo_path(self, mock_validate: MagicMock, mock_s3_exists: MagicMock) -> None:
        result = resolve_upload(
            user=self.user,
            client_profile=self.client_profile,
            presigned_key=self.presigned_key,
            upload_token=self.upload_token,
        )

        result.refresh_from_db()
        self.assertEqual(result.profile_photo.name, "client_profile_photos/abc.jpg")

    @patch("clients.services.client_profile_photo.s3_key_exists", return_value=True)
    @patch("clients.services.client_profile_photo.validate_upload_token", return_value=True)
    def test_returns_client_profile(self, mock_validate: MagicMock, mock_s3_exists: MagicMock) -> None:
        result = resolve_upload(
            user=self.user,
            client_profile=self.client_profile,
            presigned_key=self.presigned_key,
            upload_token=self.upload_token,
        )

        self.assertEqual(result.pk, self.client_profile.pk)

    @patch("clients.services.client_profile_photo.s3_key_exists", return_value=True)
    @patch("clients.services.client_profile_photo.validate_upload_token", return_value=True)
    def test_validates_token_with_correct_params(self, mock_validate: MagicMock, mock_s3_exists: MagicMock) -> None:
        resolve_upload(
            user=self.user,
            client_profile=self.client_profile,
            presigned_key=self.presigned_key,
            upload_token=self.upload_token,
        )

        mock_validate.assert_called_once_with(
            upload_token=self.upload_token,
            key=self.presigned_key,
            user_id=self.user.pk,
            scope=SERVICE_NAME,
        )

    @patch("clients.services.client_profile_photo.validate_upload_token", return_value=False)
    def test_raises_on_invalid_token(self, mock_validate: MagicMock) -> None:
        with self.assertRaises(ValueError, msg="Invalid or expired upload signature"):
            resolve_upload(
                user=self.user,
                client_profile=self.client_profile,
                presigned_key=self.presigned_key,
                upload_token="bad-token",
            )

    @patch("clients.services.client_profile_photo.s3_key_exists", return_value=True)
    @patch("clients.services.client_profile_photo.validate_upload_token", return_value=True)
    def test_strips_storage_dir_prefix(self, mock_validate: MagicMock, mock_s3_exists: MagicMock) -> None:
        resolve_upload(
            user=self.user,
            client_profile=self.client_profile,
            presigned_key="media/some_other_path/photo.png",
            upload_token=self.upload_token,
        )

        self.client_profile.refresh_from_db()
        self.assertEqual(self.client_profile.profile_photo.name, "some_other_path/photo.png")

    @patch("clients.services.client_profile_photo.s3_key_exists", return_value=False)
    @patch("clients.services.client_profile_photo.validate_upload_token", return_value=True)
    def test_raises_when_file_not_in_s3(self, mock_validate: MagicMock, mock_s3_exists: MagicMock) -> None:
        with self.assertRaises(ValueError, msg="File not found in storage"):
            resolve_upload(
                user=self.user,
                client_profile=self.client_profile,
                presigned_key=self.presigned_key,
                upload_token=self.upload_token,
            )

        self.client_profile.refresh_from_db()
        self.assertFalse(self.client_profile.profile_photo)

    @patch("clients.services.client_profile_photo.validate_upload_token", return_value=False)
    def test_does_not_save_on_invalid_token(self, mock_validate: MagicMock) -> None:
        with self.assertRaises(ValueError):
            resolve_upload(
                user=self.user,
                client_profile=self.client_profile,
                presigned_key=self.presigned_key,
                upload_token="bad-token",
            )

        self.client_profile.refresh_from_db()
        self.assertFalse(self.client_profile.profile_photo)
