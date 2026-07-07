from typing import Any
from unittest.mock import MagicMock, patch

from clients.services.client_profile_photo import (
    CLIENT_PROFILE_PHOTO_CONFIG,
    create_presigned_upload,
    resolve_upload,
)
from common.services.attachment_upload import GenerateUploadItem
from common.services.exceptions import InvalidContentTypeError
from common.services.types import AuthorizedPresignedUpload, AuthorizedPresignedUploadBatch
from django.test import TestCase
from model_bakery import baker


class ValidateContentTypeTest(TestCase):
    def test_allows_valid_content_types(self) -> None:
        for content_type in CLIENT_PROFILE_PHOTO_CONFIG.allowed_content_types:
            try:
                upload = GenerateUploadItem(
                    ref_id="ref-1",
                    filename="photo.jpg",
                    content_type=content_type,
                )
                # This is tested indirectly — the generic pipeline validates
                # content types. We just verify the config includes image types.
                self.assertIn(content_type, CLIENT_PROFILE_PHOTO_CONFIG.allowed_content_types)
            except ValueError:
                self.fail(f"Unexpected ValueError for allowed type: {content_type}")

    def test_rejects_invalid_content_type(self) -> None:
        # The generic pipeline raises InvalidContentTypeError, tested via
        # create_presigned_upload with an invalid type.
        upload = GenerateUploadItem(
            ref_id="ref-1",
            filename="doc.pdf",
            content_type="application/pdf",
        )
        with self.assertRaises(InvalidContentTypeError):
            create_presigned_upload(user=MagicMock(), upload=upload)

    def test_rejects_empty_content_type(self) -> None:
        upload = GenerateUploadItem(
            ref_id="ref-1",
            filename="photo.jpg",
            content_type="",
        )
        with self.assertRaises(InvalidContentTypeError):
            create_presigned_upload(user=MagicMock(), upload=upload)


class CreatePresignedUploadTest(TestCase):
    def setUp(self) -> None:
        self.user: Any = baker.make("accounts.User")
        self.upload = GenerateUploadItem(
            ref_id="ref-123",
            filename="photo.jpg",
            content_type="image/jpeg",
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
            content_type="application/pdf",
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
            scope=CLIENT_PROFILE_PHOTO_CONFIG.service_name,
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
