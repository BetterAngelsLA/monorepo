from accounts.models import User
from django.contrib.gis.geos import Point
from django.test import TestCase
from model_bakery import baker
from notes.enums import MoodEnum, TaskStatusEnum
from notes.models import Location, Mood, Note, Task


class NotesTest(TestCase):
    user: User
    note: Note
    case_manager: User
    note_client: User
    location: Location
    task1: Task
    task2: Task
    task3: Task
    mood1: Mood
    mood2: Mood

    @classmethod
    def setUpTestData(cls) -> None:
        cls.case_manager = baker.make(User, email="normal@user.com", password="foo")
        cls.note_client = baker.make(User, first_name="Mike")

        mock_point = Point(1.232433, 2.456546)
        cls.location = baker.make(Location, point=mock_point, zip_code=90000)

        cls.note = baker.make(
            Note,
            title="Session W/ Mike",
            public_details="Some public details",
            location=cls.location,
        )

        cls.task1 = baker.make(
            Task,
            title="Wellness check week 1",
            status=TaskStatusEnum.COMPLETED,
            location=cls.location,
            client=cls.note_client,
            created_by=cls.case_manager,
        )
        cls.task2 = baker.make(
            Task,
            title="DMV",
            location=cls.location,
            client=cls.note_client,
            created_by=cls.case_manager,
        )
        cls.task3 = baker.make(
            Task,
            title="Wellness check week 2",
            location=cls.location,
            client=cls.note_client,
            created_by=cls.case_manager,
        )

        cls.note.parent_tasks.add(cls.task1, cls.task2)
        cls.note.child_tasks.add(cls.task3)

        cls.mood1 = Mood.objects.get(title=MoodEnum.ANXIOUS)
        cls.mood2 = Mood.objects.get(title=MoodEnum.EUTHYMIC)
        cls.note.moods.add(cls.mood1, cls.mood2)

    def test_notes_fields_exist(self) -> None:
        note = Note.objects.get(id=self.note.id)
        self.assertEqual(note.public_details, self.note.public_details)
        self.assertEqual(note.title, self.note.title)
        self.assertEqual(list(note.parent_tasks.all()), [self.task1, self.task2])
        self.assertEqual(list(note.child_tasks.all()), [self.task3])
        self.assertEqual(list(note.moods.all()), [self.mood1, self.mood2])
        self.assertEqual(note.parent_tasks.first().created_by, self.case_manager)
        self.assertEqual(
            note.parent_tasks.first().client.first_name, self.note_client.first_name
        )
