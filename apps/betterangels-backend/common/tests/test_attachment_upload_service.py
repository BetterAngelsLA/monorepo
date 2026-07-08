from typing import Any
from unittest.mock import MagicMock, patch

from common.constants import DEFAULT_DOCUMENT_CONTENT_TYPES, DEFAULT_IMAGE_CONTENT_TYPES
from common.models import Attachment
from common.services.attachment_upload import (
    AttachmentUploadConfig,
    GenerateUploadItem,
    ResolveUploadItem,
    _validate_content_type,
    create_presigned_uploads,
    create_attachment_records,
)
from common.services.exceptions import (
    InvalidContentTypeError,
    InvalidUploadTokenError,
    S3KeyNotFoundError,
)
from common.services.s3 import PresignedS3UploadResult, PresignedS3UploadBatchResult, PresignedS3UploadInput
from django.conf import settings
from django.test import TestCase
from model_bakery import baker

# ---------------------------------------------------------------------------
# Shared test config
# ---------------------------------------------------------------------------

TEST_CONFIG = AttachmentUploadConfig(
    upload_path="test_attachments",
    service_name="test_service",
    allowed_content_types=frozenset({"application/pdf", "image/png", "image/jpeg"}),
    max_file_size=settings.S3_DEFAULT_PRESIGNED_MAX_FILE_SIZE,
)

COMBINED_CONTENT_TYPES = DEFAULT_DOCUMENT_CONTENT_TYPES | DEFAULT_IMAGE_CONTENT_TYPES

COMBINED_CONFIG = AttachmentUploadConfig(
    upload_path="note_attachments",
    service_name="note_attachment",
    allowed_content_types=COMBINED_CONTENT_TYPES,
    max_file_size=settings.S3_DEFAULT_PRESIGNED_MAX_FILE_SIZE,
)


# ---------------------------------------------------------------------------
# _validate_content_type
# ---------------------------------------------------------------------------


class ValidateContentTypeTest(TestCase):
    def test_allows_all_configured_types(self) -> None:
        for content_type in TEST_CONFIG.allowed_content_types:
            try:
                _validate_content_type(content_type, "test_file", TEST_CONFIG.allowed_content_types)
            except ValueError:
                self.fail(f"_validate_content_type raised ValueError for allowed type: {content_type}")

    def test_rejects_invalid_content_type(self) -> None:
        with self.assertRaisesMessage(
            InvalidContentTypeError, "Unsupported content_type: application/zip for filename=test_file.zip."
        ):
            _validate_content_type("application/zip", "test_file.zip", TEST_CONFIG.allowed_content_types)

    def test_rejects_empty_content_type(self) -> None:
        with self.assertRaisesMessage(InvalidContentTypeError, "Unsupported content_type:  for filename=test_file."):
            _validate_content_type("", "test_file", TEST_CONFIG.allowed_content_types)

    def test_allows_all_default_document_and_image_types(self) -> None:
        for content_type in COMBINED_CONTENT_TYPES:
            try:
                _validate_content_type(content_type, "test_file", COMBINED_CONFIG.allowed_content_types)
            except ValueError:
                self.fail(f"_validate_content_type raised ValueError for allowed type: {content_type}")


# ---------------------------------------------------------------------------
# create_presigned_uploads (Phase 1 — generic)
# ---------------------------------------------------------------------------


class CreatePresignedUploadsTest(TestCase):
    def setUp(self) -> None:
        self.user: Any = baker.make("accounts.User")
        self.upload_1 = GenerateUploadItem(
            ref_id="ref-1",
            filename="doc1.pdf",
            mime_type="application/pdf",
        )
        self.upload_2 = GenerateUploadItem(
            ref_id="ref-2",
            filename="doc2.png",
            mime_type="image/png",
        )

    @patch("common.services.attachment_upload.create_upload_token")
    @patch("common.services.attachment_upload.generate_s3_presigned_upload_urls")
    def test_returns_batch_with_all_uploads(self, mock_s3: MagicMock, mock_token: MagicMock) -> None:
        mock_s3.return_value = PresignedS3UploadBatchResult(
            uploads=[
                PresignedS3UploadResult(
                    ref_id="ref-1",
                    key="media/test_attachments/abc.pdf",
                    url="https://s3.example.com/upload1",
                    fields={"Policy": "p1"},
                ),
                PresignedS3UploadResult(
                    ref_id="ref-2",
                    key="media/test_attachments/def.png",
                    url="https://s3.example.com/upload2",
                    fields={"Policy": "p2"},
                ),
            ]
        )
        mock_token.side_effect = ["token-1", "token-2"]

        result = create_presigned_uploads(user=self.user, uploads=[self.upload_1, self.upload_2], config=TEST_CONFIG)

        self.assertEqual(len(result.uploads), 2)
        self.assertEqual(result.uploads[0].ref_id, "ref-1")
        self.assertEqual(result.uploads[0].presigned_key, "media/test_attachments/abc.pdf")
        self.assertEqual(result.uploads[0].url, "https://s3.example.com/upload1")
        self.assertEqual(result.uploads[0].fields, {"Policy": "p1"})
        self.assertEqual(result.uploads[0].upload_token, "token-1")
        self.assertEqual(result.uploads[1].ref_id, "ref-2")
        self.assertEqual(result.uploads[1].upload_token, "token-2")

    @patch("common.services.attachment_upload.create_upload_token")
    @patch("common.services.attachment_upload.generate_s3_presigned_upload_urls")
    def test_passes_config_to_s3(self, mock_s3: MagicMock, mock_token: MagicMock) -> None:
        mock_s3.return_value = PresignedS3UploadBatchResult(
            uploads=[PresignedS3UploadResult(ref_id="ref-1", key="k", url="u", fields={})]
        )
        mock_token.return_value = "t"

        create_presigned_uploads(user=self.user, uploads=[self.upload_1], config=TEST_CONFIG)

        mock_s3.assert_called_once_with(
            uploads=[
                PresignedS3UploadInput(
                    ref_id="ref-1",
                    filename="doc1.pdf",
                    mime_type="application/pdf",
                    upload_path=TEST_CONFIG.upload_path,
                    max_file_size=TEST_CONFIG.max_file_size,
                )
            ]
        )

    @patch("common.services.attachment_upload.create_upload_token")
    @patch("common.services.attachment_upload.generate_s3_presigned_upload_urls")
    def test_creates_token_per_upload_with_correct_scope(self, mock_s3: MagicMock, mock_token: MagicMock) -> None:
        mock_s3.return_value = PresignedS3UploadBatchResult(
            uploads=[
                PresignedS3UploadResult(ref_id="ref-1", key="media/test_attachments/abc.pdf", url="u", fields={}),
                PresignedS3UploadResult(ref_id="ref-2", key="media/test_attachments/def.png", url="u", fields={}),
            ]
        )
        mock_token.side_effect = ["t1", "t2"]

        create_presigned_uploads(user=self.user, uploads=[self.upload_1, self.upload_2], config=TEST_CONFIG)

        self.assertEqual(mock_token.call_count, 2)
        mock_token.assert_any_call(
            key="media/test_attachments/abc.pdf",
            user_id=self.user.pk,
            expires_in_seconds=settings.S3_DEFAULT_PRESIGNED_UPLOAD_EXPIRATION_SECONDS,
            scope=TEST_CONFIG.service_name,
        )
        mock_token.assert_any_call(
            key="media/test_attachments/def.png",
            user_id=self.user.pk,
            expires_in_seconds=settings.S3_DEFAULT_PRESIGNED_UPLOAD_EXPIRATION_SECONDS,
            scope=TEST_CONFIG.service_name,
        )

    def test_rejects_invalid_content_type(self) -> None:
        bad_upload = GenerateUploadItem(
            ref_id="ref-1",
            filename="doc1.pdf",
            mime_type="application/zip",
        )

        with self.assertRaisesMessage(
            InvalidContentTypeError, "Unsupported content_type: application/zip for filename=doc1.pdf."
        ):
            create_presigned_uploads(user=self.user, uploads=[bad_upload], config=TEST_CONFIG)

    @patch("common.services.attachment_upload.create_upload_token")
    @patch("common.services.attachment_upload.generate_s3_presigned_upload_urls")
    def test_single_upload(self, mock_s3: MagicMock, mock_token: MagicMock) -> None:
        mock_s3.return_value = PresignedS3UploadBatchResult(
            uploads=[
                PresignedS3UploadResult(
                    ref_id="ref-1",
                    key="media/test_attachments/abc.pdf",
                    url="https://s3.example.com/upload",
                    fields={"Policy": "xyz"},
                )
            ]
        )
        mock_token.return_value = "token-single"

        result = create_presigned_uploads(user=self.user, uploads=[self.upload_1], config=TEST_CONFIG)

        self.assertEqual(len(result.uploads), 1)
        self.assertEqual(result.uploads[0].upload_token, "token-single")

    @patch("common.services.attachment_upload.create_upload_token")
    @patch("common.services.attachment_upload.generate_s3_presigned_upload_urls")
    def test_empty_uploads_list(self, mock_s3: MagicMock, mock_token: MagicMock) -> None:
        mock_s3.return_value = PresignedS3UploadBatchResult(uploads=[])

        result = create_presigned_uploads(user=self.user, uploads=[], config=TEST_CONFIG)

        self.assertEqual(len(result.uploads), 0)
        mock_s3.assert_called_once_with(uploads=[])
        mock_token.assert_not_called()


# ---------------------------------------------------------------------------
# create_attachment_records (Phase 3 — generic)
# ---------------------------------------------------------------------------


class ResolveAttachmentsTest(TestCase):
    def setUp(self) -> None:
        self.user: Any = baker.make("accounts.User")
        self.content_object: Any = baker.make("clients.ClientProfile")

        # Mock strip_storage_location to strip "media/" prefix.
        strip_patcher = patch(
            "common.services.attachment_upload.strip_storage_location",
            side_effect=lambda key: key.removeprefix("media/"),
        )
        strip_patcher.start()
        self.addCleanup(strip_patcher.stop)

    def _make_item(
        self,
        presigned_key: str | None = None,
        upload_token: str = "valid-token",
        filename: str = "doc.pdf",
        mime_type: str = "application/pdf",
        namespace: str | None = None,
    ) -> ResolveUploadItem:
        return ResolveUploadItem(
            presigned_key=presigned_key or "media/test_attachments/abc.pdf",
            upload_token=upload_token,
            filename=filename,
            mime_type=mime_type,
            namespace=namespace,
        )

    @patch("common.services.attachment_upload.s3_key_exists", return_value=True)
    @patch("common.services.attachment_upload.validate_upload_token", return_value=True)
    def test_creates_attachment(self, mock_validate: MagicMock, mock_s3_exists: MagicMock) -> None:
        item = self._make_item()

        result = create_attachment_records(
            user=self.user,
            content_object=self.content_object,
            uploads=[item],
            config=TEST_CONFIG,
        )

        self.assertEqual(len(result), 1)
        attachment = result[0]
        self.assertIsInstance(attachment, Attachment)
        self.assertEqual(attachment.file.name, "test_attachments/abc.pdf")
        self.assertEqual(attachment.mime_type, "application/pdf")
        self.assertEqual(attachment.original_filename, "doc.pdf")
        self.assertEqual(attachment.namespace, None)
        self.assertEqual(attachment.object_id, self.content_object.id)
        self.assertEqual(attachment.uploaded_by, self.user)

    @patch("common.services.attachment_upload.s3_key_exists", return_value=True)
    @patch("common.services.attachment_upload.validate_upload_token", return_value=True)
    def test_creates_attachment_with_namespace(self, mock_validate: MagicMock, mock_s3_exists: MagicMock) -> None:
        item = self._make_item(namespace="CUSTOM_NAMESPACE")

        result = create_attachment_records(
            user=self.user,
            content_object=self.content_object,
            uploads=[item],
            config=TEST_CONFIG,
        )

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].namespace, "CUSTOM_NAMESPACE")

    @patch("common.services.attachment_upload.s3_key_exists", return_value=True)
    @patch("common.services.attachment_upload.validate_upload_token", return_value=True)
    def test_creates_multiple_attachments(self, mock_validate: MagicMock, mock_s3_exists: MagicMock) -> None:
        item1 = self._make_item(presigned_key="media/test_attachments/a.pdf", filename="a.pdf")
        item2 = self._make_item(presigned_key="media/test_attachments/b.png", filename="b.png", mime_type="image/png")

        result = create_attachment_records(
            user=self.user,
            content_object=self.content_object,
            uploads=[item1, item2],
            config=TEST_CONFIG,
        )

        self.assertEqual(len(result), 2)
        self.assertEqual(result[0].file.name, "test_attachments/a.pdf")
        self.assertEqual(result[1].file.name, "test_attachments/b.png")

    @patch("common.services.attachment_upload.s3_key_exists", return_value=True)
    @patch("common.services.attachment_upload.validate_upload_token", return_value=True)
    def test_validates_each_token(self, mock_validate: MagicMock, mock_s3_exists: MagicMock) -> None:
        item1 = self._make_item(presigned_key="media/test_attachments/a.pdf", upload_token="tok-1")
        item2 = self._make_item(presigned_key="media/test_attachments/b.pdf", upload_token="tok-2")

        create_attachment_records(
            user=self.user,
            content_object=self.content_object,
            uploads=[item1, item2],
            config=TEST_CONFIG,
        )

        self.assertEqual(mock_validate.call_count, 2)
        mock_validate.assert_any_call(
            upload_token="tok-1",
            key="media/test_attachments/a.pdf",
            user_id=self.user.pk,
            scope=TEST_CONFIG.service_name,
        )
        mock_validate.assert_any_call(
            upload_token="tok-2",
            key="media/test_attachments/b.pdf",
            user_id=self.user.pk,
            scope=TEST_CONFIG.service_name,
        )

    @patch("common.services.attachment_upload.s3_key_exists", return_value=True)
    @patch("common.services.attachment_upload.validate_upload_token", return_value=True)
    def test_validates_each_s3_key_exists(self, mock_validate: MagicMock, mock_s3_exists: MagicMock) -> None:
        item1 = self._make_item(presigned_key="media/test_attachments/a.pdf")
        item2 = self._make_item(presigned_key="media/test_attachments/b.pdf")

        create_attachment_records(
            user=self.user,
            content_object=self.content_object,
            uploads=[item1, item2],
            config=TEST_CONFIG,
        )

        self.assertEqual(mock_s3_exists.call_count, 2)
        mock_s3_exists.assert_any_call(key="media/test_attachments/a.pdf")
        mock_s3_exists.assert_any_call(key="media/test_attachments/b.pdf")

    def test_rejects_invalid_content_type(self) -> None:
        item = self._make_item(mime_type="application/zip")

        with self.assertRaisesMessage(
            InvalidContentTypeError, "Unsupported content_type: application/zip for filename=doc.pdf."
        ):
            create_attachment_records(
                user=self.user,
                content_object=self.content_object,
                uploads=[item],
                config=TEST_CONFIG,
            )

    @patch("common.services.attachment_upload.validate_upload_token", return_value=False)
    def test_raises_on_invalid_token(self, mock_validate: MagicMock) -> None:
        item = self._make_item(upload_token="bad-token")

        with self.assertRaisesMessage(InvalidUploadTokenError, "Invalid or expired upload signature for 'doc.pdf'"):
            create_attachment_records(
                user=self.user,
                content_object=self.content_object,
                uploads=[item],
                config=TEST_CONFIG,
            )

    @patch("common.services.attachment_upload.s3_key_exists", return_value=False)
    @patch("common.services.attachment_upload.validate_upload_token", return_value=True)
    def test_raises_when_file_not_in_s3(self, mock_validate: MagicMock, mock_s3_exists: MagicMock) -> None:
        item = self._make_item()

        with self.assertRaisesMessage(S3KeyNotFoundError, "File not found in storage for 'doc.pdf'"):
            create_attachment_records(
                user=self.user,
                content_object=self.content_object,
                uploads=[item],
                config=TEST_CONFIG,
            )

    @patch("common.services.attachment_upload.validate_upload_token", return_value=False)
    def test_does_not_create_attachment_on_invalid_token(self, mock_validate: MagicMock) -> None:
        initial_count = Attachment.objects.count()
        item = self._make_item(upload_token="bad-token")

        with self.assertRaises(InvalidUploadTokenError):
            create_attachment_records(
                user=self.user,
                content_object=self.content_object,
                uploads=[item],
                config=TEST_CONFIG,
            )

        self.assertEqual(Attachment.objects.count(), initial_count)

    @patch("common.services.attachment_upload.s3_key_exists", return_value=True)
    @patch("common.services.attachment_upload.validate_upload_token", return_value=True)
    def test_batch_rollback_on_second_item_failure(self, mock_validate: MagicMock, mock_s3_exists: MagicMock) -> None:
        """If the second item fails validation, no attachments should be created."""
        # First item is valid, second has an invalid token.
        mock_validate.side_effect = [True, False]
        item1 = self._make_item(presigned_key="media/test_attachments/a.pdf", upload_token="tok-1")
        item2 = self._make_item(presigned_key="media/test_attachments/b.pdf", upload_token="bad-tok")

        initial_count = Attachment.objects.count()

        with self.assertRaises(InvalidUploadTokenError):
            create_attachment_records(
                user=self.user,
                content_object=self.content_object,
                uploads=[item1, item2],
                config=TEST_CONFIG,
            )

        # Both items should be rolled back — neither persisted.
        self.assertEqual(Attachment.objects.count(), initial_count)

    @patch("common.services.attachment_upload.s3_key_exists", return_value=True)
    @patch("common.services.attachment_upload.validate_upload_token", return_value=True)
    def test_strips_storage_dir_prefix(self, mock_validate: MagicMock, mock_s3_exists: MagicMock) -> None:
        item = self._make_item(presigned_key="media/some_path/file.txt")

        result = create_attachment_records(
            user=self.user,
            content_object=self.content_object,
            uploads=[item],
            config=TEST_CONFIG,
        )

        self.assertEqual(result[0].file.name, "some_path/file.txt")

    @patch("common.services.attachment_upload.s3_key_exists", return_value=True)
    @patch("common.services.attachment_upload.validate_upload_token", return_value=True)
    def test_empty_uploads_returns_empty_list(self, mock_validate: MagicMock, mock_s3_exists: MagicMock) -> None:
        result = create_attachment_records(
            user=self.user,
            content_object=self.content_object,
            uploads=[],
            config=TEST_CONFIG,
        )

        self.assertEqual(result, [])
        mock_validate.assert_not_called()
        mock_s3_exists.assert_not_called()
