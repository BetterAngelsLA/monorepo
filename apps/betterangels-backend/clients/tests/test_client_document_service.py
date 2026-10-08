from typing import Any
from unittest.mock import MagicMock, patch

from clients.services.client_document import (
    CLIENT_DOCUMENT_CONFIG,
    create_presigned_uploads,
    resolve_upload,
)
from common.services.file_upload import UploadRequest, UploadConfirmation
from common.services.exceptions import InvalidUploadTokenError
from common.services.types import AuthorizedPresignedUploadBatch, AuthorizedPresignedUpload
from django.test import TestCase
from model_bakery import baker


class ValidateContentTypeTest(TestCase):
    def test_allows_valid_content_types(self) -> None:
        for content_type in CLIENT_DOCUMENT_CONFIG.allowed_content_types:
            self.assertIn(content_type, CLIENT_DOCUMENT_CONFIG.allowed_content_types)

    def test_zip_not_in_allowlist(self) -> None:
        self.assertNotIn("application/zip", CLIENT_DOCUMENT_CONFIG.allowed_content_types)

    def test_empty_string_not_in_allowlist(self) -> None:
        self.assertNotIn("", CLIENT_DOCUMENT_CONFIG.allowed_content_types)


class CreatePresignedUploadsTest(TestCase):
    """Test that the client document wrapper delegates correctly to the generic service."""

    def setUp(self) -> None:
        self.user: Any = baker.make("accounts.User")

    @patch("common.services.file_upload.create_presigned_uploads")
    def test_delegates_to_generic_with_client_document_config(self, mock_generic: MagicMock) -> None:
        uploads = [
            UploadRequest(ref_id="ref-1", filename="doc1.pdf", mime_type="application/pdf"),
        ]
        mock_generic.return_value = {"uploads": []}

        create_presigned_uploads(user=self.user, uploads=uploads)

        mock_generic.assert_called_once_with(
            user=self.user,
            uploads=uploads,
            config=CLIENT_DOCUMENT_CONFIG,
        )

    @patch("common.services.file_upload.create_presigned_uploads")
    def test_returns_batch_from_generic(self, mock_generic: MagicMock) -> None:
        expected = AuthorizedPresignedUploadBatch(
            uploads=[
                AuthorizedPresignedUpload(
                    ref_id="ref-1",
                    url="https://s3.example.com/upload",
                    fields={"Policy": "xyz"},
                    presigned_key="media/attachments/abc.pdf",
                    upload_token="token-abc",
                )
            ]
        )
        mock_generic.return_value = expected

        result = create_presigned_uploads(
            user=self.user,
            uploads=[UploadRequest(ref_id="ref-1", filename="doc1.pdf", mime_type="application/pdf")],
        )

        self.assertEqual(result, expected)

    @patch("common.services.file_upload.create_presigned_uploads")
    def test_handles_multiple_uploads(self, mock_generic: MagicMock) -> None:
        expected = AuthorizedPresignedUploadBatch(
            uploads=[
                AuthorizedPresignedUpload(ref_id="ref-1", url="u1", fields={}, presigned_key="k1", upload_token="t1"),
                AuthorizedPresignedUpload(ref_id="ref-2", url="u2", fields={}, presigned_key="k2", upload_token="t2"),
            ]
        )
        mock_generic.return_value = expected

        result = create_presigned_uploads(
            user=self.user,
            uploads=[
                UploadRequest(ref_id="ref-1", filename="a.pdf", mime_type="application/pdf"),
                UploadRequest(ref_id="ref-2", filename="b.pdf", mime_type="application/pdf"),
            ],
        )

        self.assertEqual(len(result.uploads), 2)


class ResolveUploadTest(TestCase):
    """Test that the client document resolve wrapper delegates to generic
    and assigns object-level permissions."""

    def setUp(self) -> None:
        self.user: Any = baker.make("accounts.User")
        self.client_profile: Any = baker.make("clients.ClientProfile")

    @patch("common.services.file_upload.create_attachment_records")
    def test_delegates_to_generic_with_correct_params(
        self,
        mock_generic: MagicMock,
    ) -> None:
        attachment = MagicMock()
        mock_generic.return_value = [attachment]

        documents = [
            UploadConfirmation(
                presigned_key="media/attachments/abc.pdf",
                upload_token="token-1",
                filename="doc.pdf",
                mime_type="application/pdf",
                namespace="OTHER_CLIENT_DOCUMENT",
            )
        ]

        resolve_upload(
            user=self.user,
            client_profile=self.client_profile,
            documents=documents,
        )

        mock_generic.assert_called_once_with(
            user=self.user,
            content_object=self.client_profile,
            uploads=documents,
            config=CLIENT_DOCUMENT_CONFIG,
        )

    @patch("common.services.file_upload.create_attachment_records")
    def test_returns_attachments_from_generic(
        self,
        mock_generic: MagicMock,
    ) -> None:
        attachment = MagicMock()
        mock_generic.return_value = [attachment]

        result = resolve_upload(
            user=self.user,
            client_profile=self.client_profile,
            documents=[
                UploadConfirmation(
                    presigned_key="media/attachments/abc.pdf",
                    upload_token="token-1",
                    filename="doc.pdf",
                    mime_type="application/pdf",
                    namespace="OTHER_CLIENT_DOCUMENT",
                )
            ],
        )

        self.assertEqual(result, [attachment])

    @patch("common.services.file_upload.create_attachment_records")
    def test_raises_on_generic_failure(
        self,
        mock_generic: MagicMock,
    ) -> None:
        mock_generic.side_effect = InvalidUploadTokenError("Invalid or expired upload signature for 'doc.pdf'")

        with self.assertRaisesMessage(InvalidUploadTokenError, "Invalid or expired upload signature for 'doc.pdf'"):
            resolve_upload(
                user=self.user,
                client_profile=self.client_profile,
                documents=[
                    UploadConfirmation(
                        presigned_key="media/attachments/abc.pdf",
                        upload_token="bad-token",
                        filename="doc.pdf",
                        mime_type="application/pdf",
                        namespace="OTHER_CLIENT_DOCUMENT",
                    )
                ],
            )
