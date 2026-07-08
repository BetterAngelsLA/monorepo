from typing import Any
from unittest.mock import MagicMock, patch

from accounts.tests.baker_recipes import organization_recipe
from common.models import Attachment
from django.test import TestCase
from model_bakery import baker
from notes.groups import CASEWORKER
from notes.models import Note
from notes.services import (
    NOTE_ATTACHMENT_CONFIG,
    create_note_attachment_presigned_uploads,
    resolve_note_attachment_uploads,
)
from common.services.attachment_upload import GenerateUploadItem, ResolveUploadItem


class CreateNoteAttachmentPresignedUploadsTest(TestCase):
    """Test that the note-specific wrapper delegates correctly to the generic service."""

    def setUp(self) -> None:
        self.user: Any = baker.make("accounts.User")

    @patch("common.services.attachment_upload.create_presigned_uploads")
    def test_delegates_to_generic_with_note_config(self, mock_generic: MagicMock) -> None:
        uploads = [
            GenerateUploadItem(ref_id="ref-1", filename="a.pdf", mime_type="application/pdf"),
        ]
        mock_generic.return_value = {"uploads": []}

        create_note_attachment_presigned_uploads(user=self.user, uploads=uploads)

        mock_generic.assert_called_once_with(
            user=self.user,
            uploads=uploads,
            config=NOTE_ATTACHMENT_CONFIG,
        )

    @patch("common.services.attachment_upload.create_presigned_uploads")
    def test_returns_batch_from_generic(self, mock_generic: MagicMock) -> None:
        expected = {
            "uploads": [
                {
                    "ref_id": "ref-1",
                    "url": "https://s3.example.com/upload",
                    "fields": {"Policy": "xyz"},
                    "presigned_key": "media/note_attachments/abc.pdf",
                    "upload_token": "token-abc",
                }
            ]
        }
        mock_generic.return_value = expected

        result = create_note_attachment_presigned_uploads(
            user=self.user,
            uploads=[GenerateUploadItem(ref_id="ref-1", filename="a.pdf", mime_type="application/pdf")],
        )

        self.assertEqual(result, expected)


class ResolveNoteAttachmentUploadsTest(TestCase):
    """Test that the note-specific wrapper assigns object-level permissions
    scoped to the note's organization."""

    def setUp(self) -> None:
        self.user: Any = baker.make("accounts.User")
        self.org: Any = organization_recipe.make()
        self.note: Any = Note.objects.create(
            organization=self.org,
            created_by=self.user,
            purpose="Test Note",
        )
        self.permission_group = MagicMock()
        self.permission_group.group = MagicMock()

    @patch("notes.services.assign_object_permissions")
    @patch("notes.services.resolve_permission_group")
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

        attachments = [
            ResolveUploadItem(
                presigned_key="media/note_attachments/abc.pdf",
                upload_token="token-1",
                filename="doc.pdf",
                mime_type="application/pdf",
            )
        ]

        resolve_note_attachment_uploads(user=self.user, note=self.note, attachments=attachments)

        mock_generic.assert_called_once_with(
            user=self.user,
            content_object=self.note,
            uploads=attachments,
            config=NOTE_ATTACHMENT_CONFIG,
        )

    @patch("notes.services.assign_object_permissions")
    @patch("notes.services.resolve_permission_group")
    @patch("common.services.attachment_upload.create_attachment_records")
    def test_scopes_permission_group_to_note_organization(
        self,
        mock_generic: MagicMock,
        mock_perm_group: MagicMock,
        mock_assign: MagicMock,
    ) -> None:
        mock_perm_group.return_value = self.permission_group

        attachment = MagicMock()
        mock_generic.return_value = [attachment]

        resolve_note_attachment_uploads(
            user=self.user,
            note=self.note,
            attachments=[
                ResolveUploadItem(
                    presigned_key="media/note_attachments/abc.pdf",
                    upload_token="token-1",
                    filename="doc.pdf",
                    mime_type="application/pdf",
                )
            ],
        )

        # Verify permission group was resolved with the note's org, not first-match.
        mock_perm_group.assert_called_once_with(
            self.user,
            template=CASEWORKER,
            organization_id=str(self.note.organization_id),
        )

    @patch("notes.services.assign_object_permissions")
    @patch("notes.services.resolve_permission_group")
    @patch("common.services.attachment_upload.create_attachment_records")
    def test_assigns_change_and_delete_permissions_per_attachment(
        self,
        mock_generic: MagicMock,
        mock_perm_group: MagicMock,
        mock_assign: MagicMock,
    ) -> None:
        mock_perm_group.return_value = self.permission_group

        att1 = MagicMock()
        att2 = MagicMock()
        mock_generic.return_value = [att1, att2]

        resolve_note_attachment_uploads(
            user=self.user,
            note=self.note,
            attachments=[
                ResolveUploadItem(
                    presigned_key="media/note_attachments/a.pdf",
                    upload_token="tok-1",
                    filename="a.pdf",
                    mime_type="application/pdf",
                ),
                ResolveUploadItem(
                    presigned_key="media/note_attachments/b.pdf",
                    upload_token="tok-2",
                    filename="b.pdf",
                    mime_type="application/pdf",
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

    @patch("notes.services.assign_object_permissions")
    @patch("notes.services.resolve_permission_group")
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

        result = resolve_note_attachment_uploads(
            user=self.user,
            note=self.note,
            attachments=[
                ResolveUploadItem(
                    presigned_key="media/note_attachments/abc.pdf",
                    upload_token="token-1",
                    filename="doc.pdf",
                    mime_type="application/pdf",
                )
            ],
        )

        self.assertEqual(result, [attachment])
