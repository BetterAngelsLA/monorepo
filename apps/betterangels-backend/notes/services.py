# mypy: ignore-errors
from typing import TYPE_CHECKING, List, Optional

from guardian.shortcuts import assign_perm
from notes.permissions import NotePermissions

from .models import Mood, Note

if TYPE_CHECKING:
    from .models import User


class NoteService:
    @staticmethod
    def update_note(
        id: int,
        title: str,
        public_details: str,
        mood_titles: Optional[List[str]],
        is_submitted: bool,
    ) -> Note:
        note = Note.objects.get(pk=id)

        if title:
            note.title = title
        if public_details:
            note.public_details = public_details
        if is_submitted:
            note.is_submitted = is_submitted

        note.save()

        if mood_titles:
            Mood.objects.filter(note=note).delete()
            mood_instances = [Mood(title=title, note=note) for title in mood_titles]
            Mood.objects.bulk_create(mood_instances)

        return note
