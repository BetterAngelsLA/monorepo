from accounts.models import User
from django.test import TestCase
from notes.models import Note


class NotesTest(TestCase):
    user: User
    note: Note

    @classmethod
    def setUpTestData(cls) -> None:
        cls.user = User.objects.create_user(
            email="normal@user.com",
            password="foo",
        )
        cls.note = Note.objects.create(
            created_by=cls.user, title="Just a test note", public_details="this is a body"
        )

    def test_notes_fields_exist(self) -> None:
        note = Note.objects.get(id=self.note.id)
        self.assertEqual(note.public_details, self.note.public_details)
        self.assertEqual(note.title, self.note.title)

    def test_user_assigned_to_note(self) -> None:
        note = Note.objects.get(id=self.note.id)
        self.assertEqual(note.created_by.id, self.user.id)
