from unittest.mock import MagicMock, patch

from common.models import Attachment
from common.services.types import AuthorizedPresignedUpload, AuthorizedPresignedUploadBatch
from model_bakery import baker
from notes.models import Note
from notes.tests.utils import NoteGraphQLBaseTestCase
from unittest_parametrize import parametrize


class GenerateNoteAttachmentUploadsMutationTest(NoteGraphQLBaseTestCase):
    MUTATION = """
        mutation GenerateNoteAttachmentUploads($data: GenerateNoteAttachmentUploadsInput!) {
            generateNoteAttachmentUploads(data: $data) {
                ... on AuthorizedPresignedS3UploadsType {
                    uploads {
                        refId
                        url
                        fields
                        presignedKey
                        uploadToken
                    }
                }
                ... on OperationInfo {
                    messages {
                        kind
                        message
                    }
                }
            }
        }
    """

    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)

    @patch("notes.schema.create_note_attachment_presigned_uploads")
    def test_returns_presigned_upload_data(self, mock_create: MagicMock) -> None:
        mock_create.return_value = AuthorizedPresignedUploadBatch(
            uploads=[
                AuthorizedPresignedUpload(
                    ref_id="ref-1",
                    url="https://s3.example.com/upload",
                    fields={"Policy": "xyz"},
                    presigned_key="media/note_attachments/abc.pdf",
                    upload_token="token-abc",
                )
            ]
        )

        response = self.execute_graphql(
            self.MUTATION,
            {
                "data": {
                    "noteId": self.note["id"],
                    "uploads": [{"refId": "ref-1", "filename": "doc.pdf", "contentType": "application/pdf"}],
                }
            },
        )

        self.assertIsNone(response.get("errors"))
        uploads = response["data"]["generateNoteAttachmentUploads"]["uploads"]
        self.assertEqual(len(uploads), 1)
        self.assertEqual(uploads[0]["refId"], "ref-1")
        self.assertEqual(uploads[0]["url"], "https://s3.example.com/upload")
        self.assertEqual(uploads[0]["presignedKey"], "media/note_attachments/abc.pdf")
        self.assertEqual(uploads[0]["uploadToken"], "token-abc")

    @patch("notes.schema.create_note_attachment_presigned_uploads")
    def test_returns_presigned_upload_data_for_multiple_uploads(self, mock_create: MagicMock) -> None:
        mock_create.return_value = AuthorizedPresignedUploadBatch(
            uploads=[
                AuthorizedPresignedUpload(
                    ref_id="ref-1",
                    url="https://s3.example.com/upload-1",
                    fields={"Policy": "abc"},
                    presigned_key="media/note_attachments/a.pdf",
                    upload_token="token-1",
                ),
                AuthorizedPresignedUpload(
                    ref_id="ref-2",
                    url="https://s3.example.com/upload-2",
                    fields={"Policy": "def"},
                    presigned_key="media/note_attachments/b.pdf",
                    upload_token="token-2",
                ),
            ]
        )

        response = self.execute_graphql(
            self.MUTATION,
            {
                "data": {
                    "noteId": self.note["id"],
                    "uploads": [
                        {"refId": "ref-1", "filename": "a.pdf", "contentType": "application/pdf"},
                        {"refId": "ref-2", "filename": "b.pdf", "contentType": "application/pdf"},
                    ],
                }
            },
        )

        self.assertIsNone(response.get("errors"))
        uploads = response["data"]["generateNoteAttachmentUploads"]["uploads"]
        self.assertEqual(len(uploads), 2)
        self.assertEqual(uploads[0]["refId"], "ref-1")
        self.assertEqual(uploads[0]["presignedKey"], "media/note_attachments/a.pdf")
        self.assertEqual(uploads[1]["refId"], "ref-2")
        self.assertEqual(uploads[1]["presignedKey"], "media/note_attachments/b.pdf")

    def test_requires_authentication(self) -> None:
        self.graphql_client.logout()

        response = self.execute_graphql(
            self.MUTATION,
            {
                "data": {
                    "noteId": self.note["id"],
                    "uploads": [{"refId": "ref-1", "filename": "doc.pdf", "contentType": "application/pdf"}],
                }
            },
        )

        self.assertGraphQLUnauthenticated(response)

    def test_returns_operation_info_for_nonexistent_note(self) -> None:
        response = self.execute_graphql(
            self.MUTATION,
            {
                "data": {
                    "noteId": "999999",
                    "uploads": [{"refId": "ref-1", "filename": "doc.pdf", "contentType": "application/pdf"}],
                }
            },
        )

        self.assertGraphQLOperationInfo(
            response,
            "generateNoteAttachmentUploads",
            "You do not have permission to perform this action.",
            kind="PERMISSION",
        )

    def test_returns_operation_info_for_unauthorized_note(self) -> None:
        """A caseworker in org_2 should not be able to upload attachments to an org_1 note."""
        # Login as org_2 caseworker
        self.graphql_client.logout()
        self.graphql_client.force_login(self.org_2_case_manager_1)
        self._set_active_org(self.org_2)

        response = self.execute_graphql(
            self.MUTATION,
            {
                "data": {
                    "noteId": self.note["id"],
                    "uploads": [{"refId": "ref-1", "filename": "doc.pdf", "contentType": "application/pdf"}],
                }
            },
        )

        self.assertGraphQLOperationInfo(
            response,
            "generateNoteAttachmentUploads",
            "You do not have permission to perform this action.",
            kind="PERMISSION",
        )

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),
            ("org_2_case_manager_1", False),
            ("non_case_manager_user", False),
        ],
    )
    def test_permission_checks(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        response = self.execute_graphql(
            self.MUTATION,
            {
                "data": {
                    "noteId": self.note["id"],
                    "uploads": [{"refId": "ref-1", "filename": "doc.pdf", "contentType": "application/pdf"}],
                }
            },
        )

        if should_succeed:
            self.assertIsNone(response.get("errors"))
            self.assertIn("uploads", response["data"]["generateNoteAttachmentUploads"])
        else:
            self.assertIn("messages", response["data"]["generateNoteAttachmentUploads"])


class ResolveNoteAttachmentUploadsMutationTest(NoteGraphQLBaseTestCase):
    MUTATION = """
        mutation ResolveNoteAttachmentUploads($data: ResolveNoteAttachmentUploadsInput!) {
            resolveNoteAttachmentUploads(data: $data) {
                ... on NoteAttachmentUploadsType {
                    attachments {
                        id
                        file {
                            name
                            url
                        }
                        originalFilename
                        mimeType
                    }
                }
                ... on OperationInfo {
                    messages {
                        kind
                        message
                    }
                }
            }
        }
    """

    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)

    @patch("common.services.attachment_upload.create_attachment_records")
    @patch("notes.services.assign_object_permissions")
    @patch("notes.services.resolve_permission_group")
    def test_creates_attachment_and_returns_it(
        self,
        mock_perm_group: MagicMock,
        mock_assign: MagicMock,
        mock_generic: MagicMock,
    ) -> None:
        from accounts.models import PermissionGroup
        from django.contrib.contenttypes.models import ContentType

        # Create a real permission group so assign_object_permissions works.
        pg = baker.make(PermissionGroup, organization=self.org_1)
        mock_perm_group.return_value = pg

        note = Note.objects.get(id=self.note["id"])
        attachment = Attachment(
            file="note_attachments/abc.pdf",
            mime_type="application/pdf",
            original_filename="doc.pdf",
            content_type=ContentType.objects.get_for_model(Note),
            object_id=note.id,
            uploaded_by=self.org_1_case_manager_1,
        )
        attachment.save(direct_upload=True)
        mock_generic.return_value = [attachment]

        response = self.execute_graphql(
            self.MUTATION,
            {
                "data": {
                    "noteId": self.note["id"],
                    "attachments": [
                        {
                            "presignedKey": "media/note_attachments/abc.pdf",
                            "uploadToken": "valid-token",
                            "filename": "doc.pdf",
                            "contentType": "application/pdf",
                        }
                    ],
                }
            },
        )

        self.assertIsNone(response.get("errors"))
        attachments = response["data"]["resolveNoteAttachmentUploads"]["attachments"]
        self.assertEqual(len(attachments), 1)
        self.assertEqual(attachments[0]["mimeType"], "application/pdf")
        self.assertEqual(attachments[0]["originalFilename"], "doc.pdf")

    @patch("common.services.attachment_upload.create_attachment_records")
    @patch("notes.services.assign_object_permissions")
    @patch("notes.services.resolve_permission_group")
    def test_creates_multiple_attachments(
        self,
        mock_perm_group: MagicMock,
        mock_assign: MagicMock,
        mock_generic: MagicMock,
    ) -> None:
        from accounts.models import PermissionGroup
        from django.contrib.contenttypes.models import ContentType

        pg = baker.make(PermissionGroup, organization=self.org_1)
        mock_perm_group.return_value = pg

        note = Note.objects.get(id=self.note["id"])
        note_ct = ContentType.objects.get_for_model(Note)
        att1 = Attachment(
            file="note_attachments/a.pdf",
            mime_type="application/pdf",
            original_filename="a.pdf",
            content_type=note_ct,
            object_id=note.id,
            uploaded_by=self.org_1_case_manager_1,
        )
        att1.save(direct_upload=True)
        att2 = Attachment(
            file="note_attachments/b.png",
            mime_type="image/png",
            original_filename="b.png",
            content_type=note_ct,
            object_id=note.id,
            uploaded_by=self.org_1_case_manager_1,
        )
        att2.save(direct_upload=True)
        mock_generic.return_value = [att1, att2]

        response = self.execute_graphql(
            self.MUTATION,
            {
                "data": {
                    "noteId": self.note["id"],
                    "attachments": [
                        {
                            "presignedKey": "media/note_attachments/a.pdf",
                            "uploadToken": "tok-1",
                            "filename": "a.pdf",
                            "contentType": "application/pdf",
                        },
                        {
                            "presignedKey": "media/note_attachments/b.png",
                            "uploadToken": "tok-2",
                            "filename": "b.png",
                            "contentType": "image/png",
                        },
                    ],
                }
            },
        )

        self.assertIsNone(response.get("errors"))
        attachments = response["data"]["resolveNoteAttachmentUploads"]["attachments"]
        self.assertEqual(len(attachments), 2)

    def test_requires_authentication(self) -> None:
        self.graphql_client.logout()

        response = self.execute_graphql(
            self.MUTATION,
            {
                "data": {
                    "noteId": self.note["id"],
                    "attachments": [
                        {
                            "presignedKey": "media/note_attachments/abc.pdf",
                            "uploadToken": "token",
                            "filename": "doc.pdf",
                            "contentType": "application/pdf",
                        }
                    ],
                }
            },
        )

        self.assertGraphQLUnauthenticated(response)

    @patch("common.services.attachment_upload.create_attachment_records")
    def test_returns_error_on_invalid_token(
        self,
        mock_generic: MagicMock,
    ) -> None:
        mock_generic.side_effect = ValueError("Invalid or expired upload signature for 'doc.pdf'")

        response = self.execute_graphql(
            self.MUTATION,
            {
                "data": {
                    "noteId": self.note["id"],
                    "attachments": [
                        {
                            "presignedKey": "media/note_attachments/abc.pdf",
                            "uploadToken": "bad-token",
                            "filename": "doc.pdf",
                            "contentType": "application/pdf",
                        }
                    ],
                }
            },
        )

        self.assertGraphQLError(response, "Invalid or expired upload signature for 'doc.pdf'")

    @patch("common.services.attachment_upload.create_attachment_records")
    def test_returns_error_when_file_not_in_s3(
        self,
        mock_generic: MagicMock,
    ) -> None:
        mock_generic.side_effect = ValueError("File not found in storage for 'doc.pdf'")

        response = self.execute_graphql(
            self.MUTATION,
            {
                "data": {
                    "noteId": self.note["id"],
                    "attachments": [
                        {
                            "presignedKey": "media/note_attachments/abc.pdf",
                            "uploadToken": "valid-token",
                            "filename": "doc.pdf",
                            "contentType": "application/pdf",
                        }
                    ],
                }
            },
        )

        self.assertGraphQLError(response, "File not found in storage for 'doc.pdf'")

    def test_returns_operation_info_for_nonexistent_note(self) -> None:
        response = self.execute_graphql(
            self.MUTATION,
            {
                "data": {
                    "noteId": "999999",
                    "attachments": [
                        {
                            "presignedKey": "media/note_attachments/abc.pdf",
                            "uploadToken": "token",
                            "filename": "doc.pdf",
                            "contentType": "application/pdf",
                        }
                    ],
                }
            },
        )

        self.assertGraphQLOperationInfo(
            response,
            "resolveNoteAttachmentUploads",
            "You do not have permission to perform this action.",
            kind="PERMISSION",
        )

    def test_returns_operation_info_for_unauthorized_note(self) -> None:
        """A caseworker in org_2 should not be able to resolve uploads on an org_1 note."""
        self.graphql_client.logout()
        self.graphql_client.force_login(self.org_2_case_manager_1)
        self._set_active_org(self.org_2)

        response = self.execute_graphql(
            self.MUTATION,
            {
                "data": {
                    "noteId": self.note["id"],
                    "attachments": [
                        {
                            "presignedKey": "media/note_attachments/abc.pdf",
                            "uploadToken": "token",
                            "filename": "doc.pdf",
                            "contentType": "application/pdf",
                        }
                    ],
                }
            },
        )

        self.assertGraphQLOperationInfo(
            response,
            "resolveNoteAttachmentUploads",
            "You do not have permission to perform this action.",
            kind="PERMISSION",
        )

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),
            ("org_2_case_manager_1", False),
            ("non_case_manager_user", False),
        ],
    )
    @patch("common.services.attachment_upload.create_attachment_records")
    @patch("notes.services.assign_object_permissions")
    @patch("notes.services.resolve_permission_group")
    def test_permission_checks(
        self,
        mock_perm_group: MagicMock,
        mock_assign: MagicMock,
        mock_generic: MagicMock,
        user_label: str,
        should_succeed: bool,
    ) -> None:
        from accounts.models import PermissionGroup
        from django.contrib.contenttypes.models import ContentType

        pg = baker.make(PermissionGroup, organization=self.org_1)
        mock_perm_group.return_value = pg

        note = Note.objects.get(id=self.note["id"])
        attachment = Attachment(
            file="note_attachments/abc.pdf",
            mime_type="application/pdf",
            original_filename="doc.pdf",
            content_type=ContentType.objects.get_for_model(Note),
            object_id=note.id,
            uploaded_by=self.org_1_case_manager_1,
        )
        attachment.save(direct_upload=True)
        mock_generic.return_value = [attachment]

        self._handle_user_login(user_label)

        response = self.execute_graphql(
            self.MUTATION,
            {
                "data": {
                    "noteId": self.note["id"],
                    "attachments": [
                        {
                            "presignedKey": "media/note_attachments/abc.pdf",
                            "uploadToken": "valid-token",
                            "filename": "doc.pdf",
                            "contentType": "application/pdf",
                        }
                    ],
                }
            },
        )

        if should_succeed:
            self.assertIsNone(response.get("errors"))
            self.assertIn("attachments", response["data"]["resolveNoteAttachmentUploads"])
        else:
            self.assertIn("messages", response["data"]["resolveNoteAttachmentUploads"])
