from typing import Any
from unittest.mock import MagicMock, patch

from clients.services.client_document import (
    CLIENT_DOCUMENT_CONFIG,
    create_presigned_uploads,
    resolve_upload,
)
from common.models import Attachment
from common.services.attachment_upload import GenerateUploadItem, ResolveUploadItem
from common.services.exceptions import InvalidUploadTokenError
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

    @patch("common.services.attachment_upload.create_presigned_uploads")
    def test_delegates_to_generic_with_client_document_config(self, mock_generic: MagicMock) -> None:
        uploads = [
            GenerateUploadItem(ref_id="ref-1", filename="doc1.pdf", content_type="application/pdf"),
        ]
        mock_generic.return_value = {"uploads": []}

        create_presigned_uploads(user=self.user, uploads=uploads)

        mock_generic.assert_called_once_with(
            user=self.user,
            uploads=uploads,
            config=CLIENT_DOCUMENT_CONFIG,
        )

    @patch("common.services.attachment_upload.create_presigned_uploads")
    def test_returns_batch_from_generic(self, mock_generic: MagicMock) -> None:
        expected = {
            "uploads": [
                {
                    "ref_id": "ref-1",
                    "url": "https://s3.example.com/upload",
                    "fields": {"Policy": "xyz"},
                    "presigned_key": "media/attachments/abc.pdf",
                    "upload_token": "token-abc",
                }
            ]
        }
        mock_generic.return_value = expected

        result = create_presigned_uploads(
            user=self.user,
            uploads=[GenerateUploadItem(ref_id="ref-1", filename="doc1.pdf", content_type="application/pdf")],
        )

        self.assertEqual(result, expected)

    @patch("common.services.attachment_upload.create_presigned_uploads")
    def test_handles_multiple_uploads(self, mock_generic: MagicMock) -> None:
        expected = {
            "uploads": [
                {"ref_id": "ref-1", "url": "u1", "fields": {}, "presigned_key": "k1", "upload_token": "t1"},
                {"ref_id": "ref-2", "url": "u2", "fields": {}, "presigned_key": "k2", "upload_token": "t2"},
            ]
        }
        mock_generic.return_value = expected

        result = create_presigned_uploads(
            user=self.user,
            uploads=[
                GenerateUploadItem(ref_id="ref-1", filename="a.pdf", content_type="application/pdf"),
                GenerateUploadItem(ref_id="ref-2", filename="b.pdf", content_type="application/pdf"),
            ],
        )

        self.assertEqual(len(result["uploads"]), 2)


class ResolveUploadTest(TestCase):
    """Test that the client document resolve wrapper delegates to generic
    and assigns object-level permissions."""

    def setUp(self) -> None:
        self.user: Any = baker.make("accounts.User")
        self.client_profile: Any = baker.make("clients.ClientProfile")
        self.permission_group = MagicMock()
        self.permission_group.group = MagicMock()

    @patch("clients.services.client_document.assign_object_permissions")
    @patch("clients.services.client_document.resolve_permission_group")
    @patch("common.services.attachment_upload.create_attachment_records")
    def test_delegates_to_generic_with_correct_params(
        self,
        mock_generic: MagicMock,
        mock_perm_group: MagicMock,
        mock_assign: MagicMock,
    ) -> None:
        mock_perm_group.return_value = self.permission_group
        attachment = MagicMock()
        mock_generic.return_value = [attachment]

        documents = [
            ResolveUploadItem(
                presigned_key="media/attachments/abc.pdf",
                upload_token="token-1",
                filename="doc.pdf",
                content_type="application/pdf",
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

    @patch("clients.services.client_document.assign_object_permissions")
    @patch("clients.services.client_document.resolve_permission_group")
    @patch("common.services.attachment_upload.create_attachment_records")
    def test_assigns_permissions_per_attachment(
        self,
        mock_generic: MagicMock,
        mock_perm_group: MagicMock,
        mock_assign: MagicMock,
    ) -> None:
        mock_perm_group.return_value = self.permission_group
        att1 = MagicMock()
        att2 = MagicMock()
        mock_generic.return_value = [att1, att2]

        result = resolve_upload(
            user=self.user,
            client_profile=self.client_profile,
            documents=[
                ResolveUploadItem(
                    presigned_key="media/attachments/a.pdf",
                    upload_token="tok-1",
                    filename="a.pdf",
                    content_type="application/pdf",
                    namespace="OTHER_CLIENT_DOCUMENT",
                ),
                ResolveUploadItem(
                    presigned_key="media/attachments/b.pdf",
                    upload_token="tok-2",
                    filename="b.pdf",
                    content_type="application/pdf",
                    namespace="OTHER_CLIENT_DOCUMENT",
                ),
            ],
        )

        self.assertEqual(mock_assign.call_count, 2)
        mock_assign.assert_any_call(
            self.permission_group.group,
            att1,
            [Attachment.perms.DELETE, Attachment.perms.CHANGE],
        )
        mock_assign.assert_any_call(
            self.permission_group.group,
            att2,
            [Attachment.perms.DELETE, Attachment.perms.CHANGE],
        )
        self.assertEqual(result, [att1, att2])

    @patch("clients.services.client_document.assign_object_permissions")
    @patch("clients.services.client_document.resolve_permission_group")
    @patch("common.services.attachment_upload.create_attachment_records")
    def test_returns_attachments_from_generic(
        self,
        mock_generic: MagicMock,
        mock_perm_group: MagicMock,
        mock_assign: MagicMock,
    ) -> None:
        mock_perm_group.return_value = self.permission_group
        attachment = MagicMock()
        mock_generic.return_value = [attachment]

        result = resolve_upload(
            user=self.user,
            client_profile=self.client_profile,
            documents=[
                ResolveUploadItem(
                    presigned_key="media/attachments/abc.pdf",
                    upload_token="token-1",
                    filename="doc.pdf",
                    content_type="application/pdf",
                    namespace="OTHER_CLIENT_DOCUMENT",
                )
            ],
        )

        self.assertEqual(result, [attachment])

    @patch("clients.services.client_document.assign_object_permissions")
    @patch("clients.services.client_document.resolve_permission_group")
    @patch("common.services.attachment_upload.create_attachment_records")
    def test_raises_on_generic_failure(
        self,
        mock_generic: MagicMock,
        mock_perm_group: MagicMock,
        mock_assign: MagicMock,
    ) -> None:
        mock_perm_group.return_value = self.permission_group
        mock_generic.side_effect = InvalidUploadTokenError("Invalid or expired upload signature for 'doc.pdf'")

        with self.assertRaisesMessage(InvalidUploadTokenError, "Invalid or expired upload signature for 'doc.pdf'"):
            resolve_upload(
                user=self.user,
                client_profile=self.client_profile,
                documents=[
                    ResolveUploadItem(
                        presigned_key="media/attachments/abc.pdf",
                        upload_token="bad-token",
                        filename="doc.pdf",
                        content_type="application/pdf",
                        namespace="OTHER_CLIENT_DOCUMENT",
                    )
                ],
            )

        mock_assign.assert_not_called()
