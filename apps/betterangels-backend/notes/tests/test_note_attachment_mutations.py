from unittest.mock import MagicMock, patch

from common.models import Attachment
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
        mock_create.return_value = {
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

        expected_query_count = 2
        with self.assertNumQueriesWithoutCache(expected_query_count):
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
        mock_create.return_value = {
            "uploads": [
                {
                    "ref_id": "ref-1",
                    "url": "https://s3.example.com/upload-1",
                    "fields": {"Policy": "abc"},
                    "presigned_key": "media/note_attachments/a.pdf",
                    "upload_token": "token-1",
                },
                {
                    "ref_id": "ref-2",
                    "url": "https://s3.example.com/upload-2",
                    "fields": {"Policy": "def"},
                    "presigned_key": "media/note_attachments/b.pdf",
                    "upload_token": "token-2",
                },
            ]
        }

        expected_query_count = 2
        with self.assertNumQueriesWithoutCache(expected_query_count):
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

        expected_query_count = 0
        with self.assertNumQueriesWithoutCache(expected_query_count):
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
        expected_query_count = 3
        with self.assertNumQueriesWithoutCache(expected_query_count):
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
            response, "generateNoteAttachmentUploads", "Note matching ID 999999 could not be found.", kind="ERROR"
        )

    def test_returns_operation_info_for_unauthorized_note(self) -> None:
        """A caseworker in org_2 should not be able to upload attachments to an org_1 note."""
        # Login as org_2 caseworker
        self.graphql_client.logout()
        self.graphql_client.force_login(self.org_2_case_manager_1)
        self._set_active_org(self.org_2)

        expected_query_count = 3
        with self.assertNumQueriesWithoutCache(expected_query_count):
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
            f"Note matching ID {self.note['id']} could not be found.",
            kind="ERROR",
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

    @patch("notes.services.generic_resolve_attachments")
    @patch("notes.services.resolve_permission_group")
    def test_creates_attachment_and_returns_it(
        self,
        mock_perm_group: MagicMock,
        mock_generic: MagicMock,
    ) -> None:
        from accounts.models import PermissionGroup

        # Create a real permission group so assign_object_permissions works.
        pg = baker.make(PermissionGroup, organization=self.org_1)
        mock_perm_group.return_value = pg

        attachment = baker.make(
            "common.Attachment",
            content_object=Note.objects.get(id=self.note["id"]),
            mime_type="application/pdf",
            original_filename="doc.pdf",
            uploaded_by=self.org_1_case_manager_1,
        )
        mock_generic.return_value = [attachment]

        initial_count = Attachment.objects.count()

        expected_query_count = 12
        with self.assertNumQueriesWithoutCache(expected_query_count):
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

        # The generic service creates a real Attachment, so count increases.
        # (mocked generic returns baker-made attachment, so count stays same)
        # Actually, since we mock generic_resolve_attachments, the returned attachment
        # was pre-made by baker — the count reflects that.
        self.assertEqual(Attachment.objects.count(), initial_count + 1)

    @patch("notes.services.generic_resolve_attachments")
    @patch("notes.services.resolve_permission_group")
    def test_creates_multiple_attachments(
        self,
        mock_perm_group: MagicMock,
        mock_generic: MagicMock,
    ) -> None:
        from accounts.models import PermissionGroup

        pg = baker.make(PermissionGroup, organization=self.org_1)
        mock_perm_group.return_value = pg

        note = Note.objects.get(id=self.note["id"])
        att1 = baker.make(
            "common.Attachment",
            content_object=note,
            mime_type="application/pdf",
            original_filename="a.pdf",
            uploaded_by=self.org_1_case_manager_1,
        )
        att2 = baker.make(
            "common.Attachment",
            content_object=note,
            mime_type="image/png",
            original_filename="b.png",
            uploaded_by=self.org_1_case_manager_1,
        )
        mock_generic.return_value = [att1, att2]

        expected_query_count = 13
        with self.assertNumQueriesWithoutCache(expected_query_count):
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

        expected_query_count = 0
        with self.assertNumQueriesWithoutCache(expected_query_count):
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

    @patch("notes.services.generic_resolve_attachments")
    def test_returns_error_on_invalid_token(
        self,
        mock_generic: MagicMock,
    ) -> None:
        mock_generic.side_effect = ValueError("Invalid or expired upload signature for 'doc.pdf'")

        expected_query_count = 2
        with self.assertNumQueriesWithoutCache(expected_query_count):
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

    @patch("notes.services.generic_resolve_attachments")
    def test_returns_error_when_file_not_in_s3(
        self,
        mock_generic: MagicMock,
    ) -> None:
        mock_generic.side_effect = ValueError("File not found in storage for 'doc.pdf'")

        expected_query_count = 2
        with self.assertNumQueriesWithoutCache(expected_query_count):
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
        expected_query_count = 3
        with self.assertNumQueriesWithoutCache(expected_query_count):
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
            response, "resolveNoteAttachmentUploads", "Note matching ID 999999 could not be found.", kind="ERROR"
        )

    def test_returns_operation_info_for_unauthorized_note(self) -> None:
        """A caseworker in org_2 should not be able to resolve uploads on an org_1 note."""
        self.graphql_client.logout()
        self.graphql_client.force_login(self.org_2_case_manager_1)
        self._set_active_org(self.org_2)

        expected_query_count = 3
        with self.assertNumQueriesWithoutCache(expected_query_count):
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
            f"Note matching ID {self.note['id']} could not be found.",
            kind="ERROR",
        )

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),
            ("org_2_case_manager_1", False),
            ("non_case_manager_user", False),
        ],
    )
    @patch("notes.services.generic_resolve_attachments")
    @patch("notes.services.resolve_permission_group")
    def test_permission_checks(
        self,
        mock_perm_group: MagicMock,
        mock_generic: MagicMock,
        user_label: str,
        should_succeed: bool,
    ) -> None:
        from accounts.models import PermissionGroup

        pg = baker.make(PermissionGroup, organization=self.org_1)
        mock_perm_group.return_value = pg

        note = Note.objects.get(id=self.note["id"])
        attachment = baker.make(
            "common.Attachment",
            content_object=note,
            mime_type="application/pdf",
            original_filename="doc.pdf",
            uploaded_by=self.org_1_case_manager_1,
        )
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
