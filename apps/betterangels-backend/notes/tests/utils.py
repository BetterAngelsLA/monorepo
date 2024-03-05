from typing import Any, Dict

from model_bakery import baker
from tasks.models import Task
from test_utils.base import GraphQLBaseTestCase


class NoteGraphQLBaseTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.setup_users()
        self.setup_groups_and_permissions()
        self._setup_note()
        self.tasks = baker.make(Task, _quantity=2)

    def _setup_note(self) -> None:
        # Force login the case manager to create a note
        self.graphql_client.force_login(self.case_manager_1)
        self.note: Dict[str, Any] = self.create_note_fixture(
            {
                "title": f"User: {self.case_manager_1.id}",
                "publicDetails": f"{self.case_manager_1.id}'s note",
                "client": {"id": self.client_1.id},
            },
        )["data"]["createNote"]
        # Logout after setting up the note
        self.graphql_client.logout()
