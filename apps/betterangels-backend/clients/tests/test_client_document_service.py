from typing import Any
from unittest.mock import MagicMock, patch

from clients.services.client_document import (
    ALLOWED_CONTENT_TYPES,
    SERVICE_NAME,
    UPLOAD_PATH,
    _validate_content_type,
    create_presigned_uploads,
    resolve_upload,
)
from common.models import Attachment
from common.models import Attachment
from common.services.s3 import DEFAULT_UPLOAD_EXPIRATION_SECONDS
from django.test import TestCase
from model_bakery import baker


class ValidateContentTypeTest(TestCase):
    def test_allows_valid_content_types(self) -> None:
        for content_type in ALLOWED_CONTENT_TYPES:
            try:
                _validate_content_type(content_type, "test_file")
            except ValueError:
                self.fail(f"_validate_content_type raised ValueError for allowed type: {content_type}")

    def test_rejects_invalid_content_type(self) -> None:
        with self.assertRaisesMessage(
            ValueError, "Unsupported content_type: application/zip for filename=test_file.zip."
        ):
            _validate_content_type("application/zip", "test_file.zip")

    def test_rejects_empty_content_type(self) -> None:
        with self.assertRaisesMessage(ValueError, "Unsupported content_type:  for filename=test_file."):
            _validate_content_type("", "test_file")


class CreatePresignedUploadsTest(TestCase):
    def setUp(self) -> None:
        self.user: Any = baker.make("accounts.User")
        self.upload_1 = MagicMock()
        self.upload_1.ref_id = "ref-1"
        self.upload_1.filename = "doc1.pdf"
        self.upload_1.content_type = "application/pdf"
        self.upload_2 = MagicMock()
        self.upload_2.ref_id = "ref-2"
        self.upload_2.filename = "doc2.png"
        self.upload_2.content_type = "image/png"

    @patch("clients.services.client_document.create_upload_token")
    @patch("clients.services.client_document.generate_s3_presigned_upload_urls")
    def test_returns_batch_with_all_uploads(self, mock_s3: MagicMock, mock_token: MagicMock) -> None:
        mock_s3.return_value = {
            "uploads": [
                {
                    "ref_id": "ref-1",
                    "key": "media/attachments/abc.pdf",
                    "url": "https://s3.example.com/upload1",
                    "fields": {"Policy": "p1"},
                },
                {
                    "ref_id": "ref-2",
                    "key": "media/attachments/def.png",
                    "url": "https://s3.example.com/upload2",
                    "fields": {"Policy": "p2"},
                },
            ]
        }
        mock_token.side_effect = ["token-1", "token-2"]

        result = create_presigned_uploads(user=self.user, uploads=[self.upload_1, self.upload_2])

        self.assertEqual(len(result["uploads"]), 2)
        self.assertEqual(result["uploads"][0]["ref_id"], "ref-1")
        self.assertEqual(result["uploads"][0]["presigned_key"], "media/attachments/abc.pdf")
        self.assertEqual(result["uploads"][0]["url"], "https://s3.example.com/upload1")
        self.assertEqual(result["uploads"][0]["fields"], {"Policy": "p1"})
        self.assertEqual(result["uploads"][0]["upload_token"], "token-1")
        self.assertEqual(result["uploads"][1]["ref_id"], "ref-2")
        self.assertEqual(result["uploads"][1]["upload_token"], "token-2")

    @patch("clients.services.client_document.create_upload_token")
    @patch("clients.services.client_document.generate_s3_presigned_upload_urls")
    def test_passes_correct_upload_path_to_s3(self, mock_s3: MagicMock, mock_token: MagicMock) -> None:
        mock_s3.return_value = {"uploads": [{"ref_id": "ref-1", "key": "k", "url": "u", "fields": {}}]}
        mock_token.return_value = "t"

        create_presigned_uploads(user=self.user, uploads=[self.upload_1])

        mock_s3.assert_called_once_with(
            uploads=[
                {
                    "ref_id": "ref-1",
                    "filename": "doc1.pdf",
                    "content_type": "application/pdf",
                    "upload_path": UPLOAD_PATH,
                }
            ]
        )

    @patch("clients.services.client_document.create_upload_token")
    @patch("clients.services.client_document.generate_s3_presigned_upload_urls")
    def test_creates_token_per_upload_with_correct_params(self, mock_s3: MagicMock, mock_token: MagicMock) -> None:
        mock_s3.return_value = {
            "uploads": [
                {"ref_id": "ref-1", "key": "media/attachments/abc.pdf", "url": "u", "fields": {}},
                {"ref_id": "ref-2", "key": "media/attachments/def.png", "url": "u", "fields": {}},
            ]
        }
        mock_token.side_effect = ["t1", "t2"]

        create_presigned_uploads(user=self.user, uploads=[self.upload_1, self.upload_2])

        self.assertEqual(mock_token.call_count, 2)
        mock_token.assert_any_call(
            key="media/attachments/abc.pdf",
            user_id=self.user.pk,
            expires_in_seconds=DEFAULT_UPLOAD_EXPIRATION_SECONDS,
            scope=SERVICE_NAME,
        )
        mock_token.assert_any_call(
            key="media/attachments/def.png",
            user_id=self.user.pk,
            expires_in_seconds=DEFAULT_UPLOAD_EXPIRATION_SECONDS,
            scope=SERVICE_NAME,
        )

    def test_rejects_invalid_content_type(self) -> None:
        self.upload_1.content_type = "application/zip"

        with self.assertRaisesMessage(ValueError, "Unsupported content_type: application/zip for filename=doc1.pdf."):
            create_presigned_uploads(user=self.user, uploads=[self.upload_1])

    @patch("clients.services.client_document.create_upload_token")
    @patch("clients.services.client_document.generate_s3_presigned_upload_urls")
    def test_single_upload(self, mock_s3: MagicMock, mock_token: MagicMock) -> None:
        mock_s3.return_value = {
            "uploads": [
                {
                    "ref_id": "ref-1",
                    "key": "media/attachments/abc.pdf",
                    "url": "https://s3.example.com/upload",
                    "fields": {"Policy": "xyz"},
                }
            ]
        }
        mock_token.return_value = "token-single"

        result = create_presigned_uploads(user=self.user, uploads=[self.upload_1])

        self.assertEqual(len(result["uploads"]), 1)
        self.assertEqual(result["uploads"][0]["upload_token"], "token-single")


class ResolveUploadTest(TestCase):
    def setUp(self) -> None:
        self.user: Any = baker.make("accounts.User")
        self.client_profile: Any = baker.make("clients.ClientProfile")
        self.permission_group = MagicMock()
        self.permission_group.group = MagicMock()

        storage_location_patcher = patch(
            "clients.services.client_document.strip_storage_location",
            side_effect=lambda key: key.removeprefix("media/"),
        )
        storage_location_patcher.start()
        self.addCleanup(storage_location_patcher.stop)

    def _make_doc(
        self,
        presigned_key: str | None = None,
        upload_token: str = "valid-token",
        filename: str = "doc.pdf",
        content_type: str = "application/pdf",
        namespace: str = "OTHER_CLIENT_DOCUMENT",
    ) -> MagicMock:
        doc = MagicMock()
        doc.presigned_key = presigned_key or "media/attachments/abc.pdf"
        doc.upload_token = upload_token
        doc.filename = filename
        doc.content_type = content_type
        doc.namespace = namespace
        return doc

    @patch("clients.services.client_document.assign_object_permissions")
    @patch("clients.services.client_document.get_user_permission_group")
    @patch("clients.services.client_document.s3_key_exists", return_value=True)
    @patch("clients.services.client_document.validate_upload_token", return_value=True)
    def test_creates_attachment(
        self, mock_validate: MagicMock, mock_s3_exists: MagicMock, mock_perm_group: MagicMock, mock_assign: MagicMock
    ) -> None:
        mock_perm_group.return_value = self.permission_group
        doc = self._make_doc()

        result = resolve_upload(
            user=self.user,
            client_profile=self.client_profile,
            documents=[doc],
        )

        self.assertEqual(len(result), 1)
        attachment = result[0]
        self.assertIsInstance(attachment, Attachment)
        self.assertEqual(attachment.file.name, "attachments/abc.pdf")
        self.assertEqual(attachment.mime_type, "application/pdf")
        self.assertEqual(attachment.original_filename, "doc.pdf")
        self.assertEqual(attachment.namespace, "OTHER_CLIENT_DOCUMENT")
        self.assertEqual(attachment.object_id, self.client_profile.id)
        self.assertEqual(attachment.uploaded_by, self.user)

    @patch("clients.services.client_document.assign_object_permissions")
    @patch("clients.services.client_document.get_user_permission_group")
    @patch("clients.services.client_document.s3_key_exists", return_value=True)
    @patch("clients.services.client_document.validate_upload_token", return_value=True)
    def test_creates_multiple_attachments(
        self, mock_validate: MagicMock, mock_s3_exists: MagicMock, mock_perm_group: MagicMock, mock_assign: MagicMock
    ) -> None:
        mock_perm_group.return_value = self.permission_group
        doc1 = self._make_doc(presigned_key="media/attachments/a.pdf", filename="a.pdf")
        doc2 = self._make_doc(presigned_key="media/attachments/b.png", filename="b.png", content_type="image/png")

        result = resolve_upload(
            user=self.user,
            client_profile=self.client_profile,
            documents=[doc1, doc2],
        )

        self.assertEqual(len(result), 2)
        self.assertEqual(result[0].file.name, "attachments/a.pdf")
        self.assertEqual(result[1].file.name, "attachments/b.png")

    @patch("clients.services.client_document.assign_object_permissions")
    @patch("clients.services.client_document.get_user_permission_group")
    @patch("clients.services.client_document.s3_key_exists", return_value=True)
    @patch("clients.services.client_document.validate_upload_token", return_value=True)
    def test_validates_each_token(
        self, mock_validate: MagicMock, mock_s3_exists: MagicMock, mock_perm_group: MagicMock, mock_assign: MagicMock
    ) -> None:
        mock_perm_group.return_value = self.permission_group
        doc1 = self._make_doc(presigned_key="media/attachments/a.pdf", upload_token="tok-1")
        doc2 = self._make_doc(presigned_key="media/attachments/b.pdf", upload_token="tok-2")

        resolve_upload(
            user=self.user,
            client_profile=self.client_profile,
            documents=[doc1, doc2],
        )

        self.assertEqual(mock_validate.call_count, 2)
        mock_validate.assert_any_call(
            upload_token="tok-1",
            key="media/attachments/a.pdf",
            user_id=self.user.pk,
            scope=SERVICE_NAME,
        )
        mock_validate.assert_any_call(
            upload_token="tok-2",
            key="media/attachments/b.pdf",
            user_id=self.user.pk,
            scope=SERVICE_NAME,
        )

    @patch("clients.services.client_document.assign_object_permissions")
    @patch("clients.services.client_document.get_user_permission_group")
    @patch("clients.services.client_document.s3_key_exists", return_value=True)
    @patch("clients.services.client_document.validate_upload_token", return_value=True)
    def test_assigns_permissions_per_attachment(
        self, mock_validate: MagicMock, mock_s3_exists: MagicMock, mock_perm_group: MagicMock, mock_assign: MagicMock
    ) -> None:
        mock_perm_group.return_value = self.permission_group
        doc = self._make_doc()

        result = resolve_upload(
            user=self.user,
            client_profile=self.client_profile,
            documents=[doc],
        )

        mock_assign.assert_called_once_with(
            self.permission_group.group,
            result[0],
            [Attachment.perms.DELETE, Attachment.perms.CHANGE],
        )

    @patch("clients.services.client_document.assign_object_permissions")
    @patch("clients.services.client_document.get_user_permission_group")
    @patch("clients.services.client_document.s3_key_exists", return_value=True)
    @patch("clients.services.client_document.validate_upload_token", return_value=True)
    def test_rejects_invalid_content_type(
        self, mock_validate: MagicMock, mock_s3_exists: MagicMock, mock_perm_group: MagicMock, mock_assign: MagicMock
    ) -> None:
        mock_perm_group.return_value = self.permission_group
        doc = self._make_doc(content_type="application/zip")

        with self.assertRaisesMessage(ValueError, "Unsupported content_type: application/zip for filename=doc.pdf."):
            resolve_upload(
                user=self.user,
                client_profile=self.client_profile,
                documents=[doc],
            )

    @patch("clients.services.client_document.assign_object_permissions")
    @patch("clients.services.client_document.get_user_permission_group")
    @patch("clients.services.client_document.validate_upload_token", return_value=False)
    def test_raises_on_invalid_token(
        self, mock_validate: MagicMock, mock_perm_group: MagicMock, mock_assign: MagicMock
    ) -> None:
        mock_perm_group.return_value = self.permission_group
        doc = self._make_doc(upload_token="bad-token")

        with self.assertRaisesMessage(ValueError, "Invalid or expired upload signature for 'doc.pdf'"):
            resolve_upload(
                user=self.user,
                client_profile=self.client_profile,
                documents=[doc],
            )

    @patch("clients.services.client_document.assign_object_permissions")
    @patch("clients.services.client_document.get_user_permission_group")
    @patch("clients.services.client_document.s3_key_exists", return_value=True)
    @patch("clients.services.client_document.validate_upload_token", return_value=True)
    def test_strips_storage_dir_prefix(
        self, mock_validate: MagicMock, mock_s3_exists: MagicMock, mock_perm_group: MagicMock, mock_assign: MagicMock
    ) -> None:
        mock_perm_group.return_value = self.permission_group
        doc = self._make_doc(presigned_key="media/some_path/file.txt")

        result = resolve_upload(
            user=self.user,
            client_profile=self.client_profile,
            documents=[doc],
        )

        self.assertEqual(result[0].file.name, "some_path/file.txt")

    @patch("clients.services.client_document.assign_object_permissions")
    @patch("clients.services.client_document.get_user_permission_group")
    @patch("clients.services.client_document.validate_upload_token", return_value=False)
    def test_does_not_create_attachment_on_invalid_token(
        self, mock_validate: MagicMock, mock_perm_group: MagicMock, mock_assign: MagicMock
    ) -> None:
        mock_perm_group.return_value = self.permission_group
        initial_count = Attachment.objects.count()
        doc = self._make_doc(upload_token="bad-token")

        with self.assertRaises(ValueError):
            resolve_upload(
                user=self.user,
                client_profile=self.client_profile,
                documents=[doc],
            )

        self.assertEqual(Attachment.objects.count(), initial_count)

    @patch("clients.services.client_document.assign_object_permissions")
    @patch("clients.services.client_document.get_user_permission_group")
    @patch("clients.services.client_document.s3_key_exists", return_value=True)
    @patch("clients.services.client_document.validate_upload_token")
    def test_no_attachments_created_when_batch_validation_fails(
        self, mock_validate: MagicMock, mock_s3_exists: MagicMock, mock_perm_group: MagicMock, mock_assign: MagicMock
    ) -> None:
        mock_perm_group.return_value = self.permission_group
        mock_validate.side_effect = [True, False]
        initial_count = Attachment.objects.count()
        doc1 = self._make_doc(presigned_key="media/attachments/a.pdf", upload_token="tok-1")
        doc2 = self._make_doc(presigned_key="media/attachments/b.pdf", upload_token="tok-bad")

        with self.assertRaises(ValueError):
            resolve_upload(
                user=self.user,
                client_profile=self.client_profile,
                documents=[doc1, doc2],
            )

        # Upfront validation prevents any DB writes
        self.assertEqual(Attachment.objects.count(), initial_count)

    @patch("clients.services.client_document.assign_object_permissions")
    @patch("clients.services.client_document.get_user_permission_group")
    @patch("clients.services.client_document.s3_key_exists", return_value=True)
    @patch("clients.services.client_document.validate_upload_token", return_value=True)
    def test_save_error_on_second_doc_rolls_back_first(
        self, mock_validate: MagicMock, mock_s3_exists: MagicMock, mock_perm_group: MagicMock, mock_assign: MagicMock
    ) -> None:
        """A save failure on the 2nd doc rolls back the entire batch,
        including the 1st doc."""
        mock_perm_group.return_value = self.permission_group
        initial_count = Attachment.objects.count()
        doc1 = self._make_doc(presigned_key="media/attachments/a.pdf", filename="a.pdf")
        doc2 = self._make_doc(presigned_key="media/attachments/b.pdf", filename="b.pdf")

        original_save = Attachment.save

        call_count = 0

        def save_side_effect(self_attachment: Any, *args: Any, **kwargs: Any) -> None:
            nonlocal call_count
            call_count += 1
            if call_count == 2:
                raise RuntimeError("Simulated DB error on second save")
            original_save(self_attachment, *args, **kwargs)

        with patch.object(Attachment, "save", save_side_effect):
            with self.assertRaisesMessage(RuntimeError, "Simulated DB error on second save"):
                resolve_upload(
                    user=self.user,
                    client_profile=self.client_profile,
                    documents=[doc1, doc2],
                )

        # Both docs rolled back — nothing persisted
        self.assertEqual(Attachment.objects.count(), initial_count)

    @patch("clients.services.client_document.assign_object_permissions")
    @patch("clients.services.client_document.get_user_permission_group")
    @patch("clients.services.client_document.s3_key_exists", return_value=False)
    @patch("clients.services.client_document.validate_upload_token", return_value=True)
    def test_raises_when_file_not_in_s3(
        self, mock_validate: MagicMock, mock_s3_exists: MagicMock, mock_perm_group: MagicMock, mock_assign: MagicMock
    ) -> None:
        mock_perm_group.return_value = self.permission_group
        initial_count = Attachment.objects.count()
        doc = self._make_doc()

        with self.assertRaisesMessage(ValueError, "File not found in storage for 'doc.pdf'"):
            resolve_upload(
                user=self.user,
                client_profile=self.client_profile,
                documents=[doc],
            )

        self.assertEqual(Attachment.objects.count(), initial_count)
