from typing import TYPE_CHECKING, Dict, Tuple

from django.db import models
from django.db.models.query import QuerySet
from django.utils import timezone

if TYPE_CHECKING:
    from notes.models import Mood, Note


class MoodQuerySet(QuerySet):
    def delete(self) -> Tuple[int, Dict[str, int]]:
        """
        Overriding this method so that the Note associated with a deleted Mood can have
        it's updated_at timestamp reflect the change in moods in order to be able to
        roll back via simple history.
        """

        if mood := self.first():
            note: "Note" = mood.note

        resp = super().delete()

        if note:
            note.updated_at = timezone.now()
            note.save()

        return resp


class MoodManager(models.Manager["Mood"]):
    def get_queryset(self) -> QuerySet["Mood"]:
        return MoodQuerySet(self.model, using=self._db)
