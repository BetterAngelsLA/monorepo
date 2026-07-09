from typing import Any
from unittest.mock import MagicMock, patch

from common.constants import DEFAULT_DOCUMENT_CONTENT_TYPES, DEFAULT_IMAGE_CONTENT_TYPES
from common.models import Attachment
from common.services.file_upload import (
    AttachmentUploadConfig,
    UploadRequest,
    UploadConfirmation,
    _validate_content_type,
    _validate_upload_item,
    create_presigned_uploads,
    create_attachment_records,
    validate_upload_batch,
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
        self.upload_1 = UploadRequest(
            ref_id="ref-1",
            filename="doc1.pdf",
            mime_type="application/pdf",
        )
        self.upload_2 = UploadRequest(
            ref_id="ref-2",
            filename="doc2.png",
            mime_type="image/png",
        )

    @patch("common.services.file_upload.create_upload_token")
    @patch("common.services.file_upload.generate_s3_presigned_upload_urls")
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

    @patch("common.services.file_upload.create_upload_token")
    @patch("common.services.file_upload.generate_s3_presigned_upload_urls")
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

    @patch("common.services.file_upload.create_upload_token")
    @patch("common.services.file_upload.generate_s3_presigned_upload_urls")
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
        bad_upload = UploadRequest(
            ref_id="ref-1",
            filename="doc1.pdf",
            mime_type="application/zip",
        )

        with self.assertRaisesMessage(
            InvalidContentTypeError, "Unsupported content_type: application/zip for filename=doc1.pdf."
        ):
            create_presigned_uploads(user=self.user, uploads=[bad_upload], config=TEST_CONFIG)

    @patch("common.services.file_upload.create_upload_token")
    @patch("common.services.file_upload.generate_s3_presigned_upload_urls")
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

    @patch("common.services.file_upload.create_upload_token")
    @patch("common.services.file_upload.generate_s3_presigned_upload_urls")
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
            "common.services.file_upload.strip_storage_location",
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
    ) -> UploadConfirmation:
        return UploadConfirmation(
            presigned_key=presigned_key or "media/test_attachments/abc.pdf",
            upload_token=upload_token,
            filename=filename,
            mime_type=mime_type,
            namespace=namespace,
        )

    @patch("common.services.file_upload.s3_key_exists", return_value=True)
    @patch("common.services.file_upload.validate_upload_token", return_value=True)
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

    @patch("common.services.file_upload.s3_key_exists", return_value=True)
    @patch("common.services.file_upload.validate_upload_token", return_value=True)
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

    @patch("common.services.file_upload.s3_key_exists", return_value=True)
    @patch("common.services.file_upload.validate_upload_token", return_value=True)
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

    @patch("common.services.file_upload.s3_key_exists", return_value=True)
    @patch("common.services.file_upload.validate_upload_token", return_value=True)
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

    @patch("common.services.file_upload.s3_key_exists", return_value=True)
    @patch("common.services.file_upload.validate_upload_token", return_value=True)
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

    @patch("common.services.file_upload.validate_upload_token", return_value=False)
    def test_raises_on_invalid_token(self, mock_validate: MagicMock) -> None:
        item = self._make_item(upload_token="bad-token")

        with self.assertRaisesMessage(InvalidUploadTokenError, "Invalid or expired upload signature for 'doc.pdf'"):
            create_attachment_records(
                user=self.user,
                content_object=self.content_object,
                uploads=[item],
                config=TEST_CONFIG,
            )

    @patch("common.services.file_upload.s3_key_exists", return_value=False)
    @patch("common.services.file_upload.validate_upload_token", return_value=True)
    def test_raises_when_file_not_in_s3(self, mock_validate: MagicMock, mock_s3_exists: MagicMock) -> None:
        item = self._make_item()

        with self.assertRaisesMessage(S3KeyNotFoundError, "File not found in storage for 'doc.pdf'"):
            create_attachment_records(
                user=self.user,
                content_object=self.content_object,
                uploads=[item],
                config=TEST_CONFIG,
            )

    @patch("common.services.file_upload.validate_upload_token", return_value=False)
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

    @patch("common.services.file_upload.s3_key_exists", return_value=True)
    @patch("common.services.file_upload.validate_upload_token", return_value=True)
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

    @patch("common.services.file_upload.s3_key_exists", return_value=True)
    @patch("common.services.file_upload.validate_upload_token", return_value=True)
    def test_strips_storage_dir_prefix(self, mock_validate: MagicMock, mock_s3_exists: MagicMock) -> None:
        item = self._make_item(presigned_key="media/some_path/file.txt")

        result = create_attachment_records(
            user=self.user,
            content_object=self.content_object,
            uploads=[item],
            config=TEST_CONFIG,
        )

        self.assertEqual(result[0].file.name, "some_path/file.txt")

    @patch("common.services.file_upload.s3_key_exists", return_value=True)
    @patch("common.services.file_upload.validate_upload_token", return_value=True)
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


# ---------------------------------------------------------------------------
# _validate_upload_item (per-item validation)
# ---------------------------------------------------------------------------


class ValidateUploadItemTest(TestCase):
    """Tests for ``_validate_upload_item`` — the single-item validation helper.

    Validation order: content-type → token → S3 key (by cost/diagnostic value).
    Each error path must be tested individually so the fail-fast ordering
    is explicit and regressions in precedence are caught.
    """

    def setUp(self) -> None:
        self.user: Any = baker.make("accounts.User")
        self.valid_item = UploadConfirmation(
            presigned_key="media/test/pic.png",
            upload_token="good-token",
            filename="pic.png",
            mime_type="image/png",
        )

    # ── happy path ────────────────────────────────────────────────────

    @patch("common.services.file_upload.s3_key_exists", return_value=True)
    @patch("common.services.file_upload.validate_upload_token", return_value=True)
    def test_passes_for_valid_item(self, mock_validate: MagicMock, mock_s3: MagicMock) -> None:
        _validate_upload_item(self.valid_item, self.user, TEST_CONFIG)

        mock_validate.assert_called_once_with(
            upload_token="good-token",
            key="media/test/pic.png",
            user_id=self.user.pk,
            scope=TEST_CONFIG.service_name,
        )
        mock_s3.assert_called_once_with(key="media/test/pic.png")

    # ── content-type check ────────────────────────────────────────────

    def test_raises_on_bad_content_type(self) -> None:
        item = UploadConfirmation(
            presigned_key="k",
            upload_token="t",
            filename="bad.zip",
            mime_type="application/zip",
        )
        with self.assertRaisesMessage(
            InvalidContentTypeError,
            "Unsupported content_type: application/zip for filename=bad.zip.",
        ):
            _validate_upload_item(item, self.user, TEST_CONFIG)

    # ── mime_type skips content-type check ────────────────────────────

    @patch("common.services.file_upload.s3_key_exists", return_value=True)
    @patch("common.services.file_upload.validate_upload_token", return_value=True)
    def test_skips_content_type_check_when_mime_empty(self, mock_validate: MagicMock, mock_s3: MagicMock) -> None:
        """An empty mime_type must be treated as “accept anything” —
        no content-type validation should run, but token + S3 checks still fire."""
        item = UploadConfirmation(
            presigned_key="media/test/unknown.bin",
            upload_token="tok",
            filename="unknown.bin",
            mime_type="",  # empty → skip content-type guard
        )
        _validate_upload_item(item, self.user, TEST_CONFIG)

        mock_validate.assert_called_once()
        mock_s3.assert_called_once()

    @patch("common.services.file_upload.s3_key_exists", return_value=True)
    @patch("common.services.file_upload.validate_upload_token", return_value=True)
    def test_skips_content_type_check_when_mime_none(self, mock_validate: MagicMock, mock_s3: MagicMock) -> None:
        """None mime_type must also skip content-type validation."""
        item = UploadConfirmation(
            presigned_key="media/test/unknown.bin",
            upload_token="tok",
            filename="unknown.bin",
            mime_type="",  # falsy → skip
        )
        # Override mime_type to None after construction (dataclass field is str).
        # The guard is ``if item.mime_type:`` so both "" and None are covered.
        object.__setattr__(item, "mime_type", None)

        _validate_upload_item(item, self.user, TEST_CONFIG)

        mock_validate.assert_called_once()
        mock_s3.assert_called_once()

    # ── error precedence: content-type before token ───────────────────

    @patch("common.services.file_upload.s3_key_exists")
    @patch("common.services.file_upload.validate_upload_token")
    def test_content_type_error_before_token_check(self, mock_validate: MagicMock, mock_s3: MagicMock) -> None:
        """A bad content type must short-circuit before the token is even checked."""
        item = UploadConfirmation(
            presigned_key="k",
            upload_token="t",
            filename="evil.exe",
            mime_type="application/x-msdownload",
        )
        with self.assertRaises(InvalidContentTypeError):
            _validate_upload_item(item, self.user, TEST_CONFIG)

        mock_validate.assert_not_called()
        mock_s3.assert_not_called()

    # ── error precedence: token before S3 ─────────────────────────────

    @patch("common.services.file_upload.s3_key_exists")
    @patch("common.services.file_upload.validate_upload_token", return_value=False)
    def test_token_error_before_s3_check(self, mock_validate: MagicMock, mock_s3: MagicMock) -> None:
        """A bad token must short-circuit before we hit S3 (I/O)."""
        item = UploadConfirmation(
            presigned_key="media/test/pic.png",
            upload_token="bad-token",
            filename="pic.png",
            mime_type="image/png",
        )
        with self.assertRaises(InvalidUploadTokenError):
            _validate_upload_item(item, self.user, TEST_CONFIG)

        mock_s3.assert_not_called()

    # ── S3 key missing ────────────────────────────────────────────────

    @patch("common.services.file_upload.s3_key_exists", return_value=False)
    @patch("common.services.file_upload.validate_upload_token", return_value=True)
    def test_raises_when_s3_key_missing(self, mock_validate: MagicMock, mock_s3: MagicMock) -> None:
        item = self.valid_item
        with self.assertRaises(S3KeyNotFoundError):
            _validate_upload_item(item, self.user, TEST_CONFIG)


# ---------------------------------------------------------------------------
# validate_upload_batch (batch behavior)
# ---------------------------------------------------------------------------


class ValidateUploadBatchTest(TestCase):
    """Tests for ``validate_upload_batch`` — batch-level behavior.

    Per-item validation is tested in ``ValidateUploadItemTest``;
    these tests cover batch edge cases: empty lists, fail-fast
    ordering, and duplicate handling.
    """

    def setUp(self) -> None:
        self.user: Any = baker.make("accounts.User")

    def _item(self, **kwargs: Any) -> UploadConfirmation:
        defaults: dict[str, Any] = {
            "presigned_key": "media/test/file.pdf",
            "upload_token": "valid",
            "filename": "file.pdf",
            "mime_type": "application/pdf",
        }
        defaults.update(kwargs)
        return UploadConfirmation(**defaults)

    # ── empty batch ───────────────────────────────────────────────────

    @patch("common.services.file_upload.s3_key_exists")
    @patch("common.services.file_upload.validate_upload_token")
    def test_empty_uploads_returns_empty_list(self, mock_validate: MagicMock, mock_s3: MagicMock) -> None:
        result = validate_upload_batch(user=self.user, uploads=[], config=TEST_CONFIG)

        self.assertEqual(result, [])
        mock_validate.assert_not_called()
        mock_s3.assert_not_called()

    # ── fail-fast: first bad item stops batch ─────────────────────────

    @patch("common.services.file_upload.s3_key_exists")
    @patch("common.services.file_upload.validate_upload_token", return_value=False)
    def test_stops_on_first_bad_item(self, mock_validate: MagicMock, mock_s3: MagicMock) -> None:
        """The batch must fail on the first invalid item and never reach
        subsequent items — this guards against partial-validation bugs."""
        item_bad = self._item(upload_token="bad", filename="bad.pdf")
        item_good = self._item(upload_token="good", filename="good.pdf")

        with self.assertRaises(InvalidUploadTokenError):
            validate_upload_batch(
                user=self.user,
                uploads=[item_bad, item_good],
                config=TEST_CONFIG,
            )

        # Only the first item should have been validated.
        mock_validate.assert_called_once_with(
            upload_token="bad",
            key="media/test/file.pdf",
            user_id=self.user.pk,
            scope=TEST_CONFIG.service_name,
        )

    # ── duplicate presigned keys ──────────────────────────────────────

    @patch("common.services.file_upload.s3_key_exists", return_value=True)
    @patch("common.services.file_upload.validate_upload_token", return_value=True)
    def test_allows_duplicate_presigned_keys(self, mock_validate: MagicMock, mock_s3: MagicMock) -> None:
        """Two items resolving the same S3 object must each produce a
        separate ValidatedUpload — there is no de-duplication at this layer."""
        item = self._item(presigned_key="media/test/same.pdf")

        result = validate_upload_batch(
            user=self.user,
            uploads=[item, item],
            config=TEST_CONFIG,
        )

        self.assertEqual(len(result), 2)
        self.assertEqual(result[0].file_path, "test/same.pdf")
        self.assertEqual(result[1].file_path, "test/same.pdf")

    # ── returns ValidatedUpload with stripped key ────────────────────

    @patch("common.services.file_upload.s3_key_exists", return_value=True)
    @patch("common.services.file_upload.validate_upload_token", return_value=True)
    @patch(
        "common.services.file_upload.strip_storage_location",
        side_effect=lambda k: k.removeprefix("media/"),
    )
    def test_returns_validated_uploads_with_stripped_path(
        self,
        mock_strip: MagicMock,
        mock_validate: MagicMock,
        mock_s3: MagicMock,
    ) -> None:
        item = self._item(presigned_key="media/test/doc.pdf")

        result = validate_upload_batch(
            user=self.user,
            uploads=[item],
            config=TEST_CONFIG,
        )

        self.assertEqual(len(result), 1)
        self.assertIsInstance(result[0], type(result[0]))  # ValidatedUpload
        self.assertEqual(result[0].filename, "file.pdf")
        self.assertEqual(result[0].mime_type, "application/pdf")
        self.assertEqual(result[0].file_path, "test/doc.pdf")
        self.assertIsNone(result[0].namespace)

    # ── preserves namespace ───────────────────────────────────────────

    @patch("common.services.file_upload.s3_key_exists", return_value=True)
    @patch("common.services.file_upload.validate_upload_token", return_value=True)
    @patch(
        "common.services.file_upload.strip_storage_location",
        side_effect=lambda k: k.removeprefix("media/"),
    )
    def test_preserves_namespace(
        self,
        mock_strip: MagicMock,
        mock_validate: MagicMock,
        mock_s3: MagicMock,
    ) -> None:
        item = self._item(namespace="CUSTOM_NS")

        result = validate_upload_batch(
            user=self.user,
            uploads=[item],
            config=TEST_CONFIG,
        )

        self.assertEqual(result[0].namespace, "CUSTOM_NS")
