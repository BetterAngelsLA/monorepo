from typing import Any, Optional

from django.test import ignore_warnings, override_settings
from notes.enums import NoteNamespaceEnum
from notes.tests.utils import NoteGraphQLBaseTestCase, TaskGraphQLBaseTestCase
from unittest_parametrize import parametrize


@ignore_warnings(category=UserWarning)
class NoteQueryTestCase(NoteGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)

    def test_note_query(self) -> None:
        note_id = self.note["id"]
        self._update_note_fixture(
            {
                "id": note_id,
                "title": "New Note",
                "publicDetails": "This is a new note.",
                "moods": [
                    {"descriptor": "ANXIOUS"},
                    {"descriptor": "EUTHYMIC"},
                ],
                "isSubmitted": False,
            }
        )
        query = """
            query ViewNote($id: ID!) {
                note(pk: $id) {
                    id
                    title
                    publicDetails
                    timestamp
                    moods {
                        descriptor
                    }
                    publicDetails
                    privateDetails
                }
            }
        """

        variables = {"id": note_id}
        expected_query_count = 3
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query, variables)

        note = response["data"]["note"]

        self.assertEqual(note["publicDetails"], "This is a new note.")
        self.assertEqual(
            note["moods"], [{"descriptor": "ANXIOUS"}, {"descriptor": "EUTHYMIC"}]
        )

    def test_notes_query(self) -> None:
        query = """
            {
                notes {
                    id
                    publicDetails
                    privateDetails
                }
            }
        """
        expected_query_count = 2
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query)

        notes = response["data"]["notes"]
        self.assertEqual(len(notes), 1)
        self.assertEqual(notes[0]["publicDetails"], self.note["publicDetails"])

    @parametrize(
        (
            "case_manager_label, client_label, is_submitted, "
            "expected_results_count, returned_note_label_1, "
            "returned_note_label_2"
        ),
        [
            # Filter by:
            # case manager, client, and/or is_submitted
            ("org_1_case_manager_1", None, None, 1, "note", None),
            ("org_1_case_manager_2", None, None, 2, "note_2", "note_3"),
            ("org_1_case_manager_1", "client_1", None, 1, "note", None),
            ("org_1_case_manager_1", "client_2", None, 0, None, None),
            ("org_1_case_manager_2", "client_1", None, 1, "note_2", None),
            ("org_1_case_manager_2", "client_2", None, 1, "note_3", None),
            ("org_1_case_manager_2", "client_1", True, 0, None, None),
            ("org_1_case_manager_2", "client_1", False, 1, "note_2", None),
            ("org_1_case_manager_2", None, False, 2, "note_2", "note_3"),
            (None, None, True, 0, None, None),
            (None, None, None, 3, None, None),
        ],
    )
    def test_notes_query_filter(
        self,
        case_manager_label: Optional[str],
        client_label: Optional[str],
        is_submitted: Optional[bool],
        expected_results_count: int,
        returned_note_label_1: Optional[str],
        returned_note_label_2: Optional[str],
    ) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_2)

        self.note_2 = self._create_note_fixture(
            {
                "title": "Client 1's Note",
                "client": {"id": self.client_1.id},
            }
        )["data"]["createNote"]

        self.note_3 = self._create_note_fixture(
            {
                "title": "Client 2's Note",
                "client": {"id": self.client_2.id},
            }
        )["data"]["createNote"]

        query = """
            query Notes($filters: NoteFilter) {
                notes(filters: $filters) {
                    id
                }
            }
        """

        filters: dict[str, Any] = {}

        if case_manager_label:
            filters["createdBy"] = {"pk": getattr(self, case_manager_label).id}

        if client_label:
            filters["client"] = {"pk": getattr(self, client_label).id}

        if is_submitted is not None:
            filters["isSubmitted"] = is_submitted

        expected_query_count = 2
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query, variables={"filters": filters})

        notes = response["data"]["notes"]
        self.assertEqual(len(notes), expected_results_count)

        if returned_note_label_1:
            self.assertEqual(notes[0]["id"], getattr(self, returned_note_label_1)["id"])

        if returned_note_label_2:
            self.assertEqual(notes[1]["id"], getattr(self, returned_note_label_2)["id"])


@override_settings(DEFAULT_FILE_STORAGE="django.core.files.storage.InMemoryStorage")
class NoteAttachmentQueryTestCase(NoteGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("org_1_case_manager_1")
        self.attachment_1 = self._create_note_attachment_fixture(
            self.note["id"],
            NoteNamespaceEnum.MOOD_ASSESSMENT.name,
            b"Attachment 1",
            "attachment_1.txt",
        )
        self.attachment_2 = self._create_note_attachment_fixture(
            self.note["id"],
            NoteNamespaceEnum.MOOD_ASSESSMENT.name,
            b"Attachment 2",
            "attachment_2.txt",
        )

    def test_view_note_attachment_permission(self) -> None:
        query = """
            query ViewNoteAttachment($id: ID!) {
                noteAttachment(pk: $id) {
                    id
                    file {
                        name
                    }
                    fileType
                    originalFilename
                    namespace
                }
            }
        """
        variables = {"id": self.attachment_1["data"]["createNoteAttachment"]["id"]}
        response = self.execute_graphql(query, variables)

        self.assertEqual(
            self.attachment_1["data"]["createNoteAttachment"],
            response["data"]["noteAttachment"],
        )

    def test_view_note_attachments_permission(self) -> None:
        query = """
            query ViewNoteAttachments {
                noteAttachments {
                    id
                    file {
                        name
                    }
                    fileType
                    originalFilename
                    namespace
                }
            }
        """
        response = self.execute_graphql(query)

        self.assertEqual(
            [
                self.attachment_1["data"]["createNoteAttachment"],
                self.attachment_2["data"]["createNoteAttachment"],
            ],
            response["data"]["noteAttachments"],
        )


@ignore_warnings(category=UserWarning)
class TaskQueryTestCase(TaskGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)

    def test_task_query(self) -> None:
        task_id = self.task["id"]
        expected_task = {
            "id": task_id,
            "title": self.task["title"],
            "status": "TO_DO",
        }

        query = """
            query ViewTask($id: ID!) {
                task(pk: $id) {
                    id
                    title
                    status
                }
            }
        """
        variables = {"id": task_id}

        expected_query_count = 2
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query, variables)

        task = response["data"]["task"]

        self.assertEqual(task, expected_task)

    def test_tasks_query(self) -> None:
        query = """
            {
                tasks {
                    id
                    title
                    status
                }
            }
        """
        expected_query_count = 2
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query)
        tasks = response["data"]["tasks"]
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0]["title"], self.task["title"])
