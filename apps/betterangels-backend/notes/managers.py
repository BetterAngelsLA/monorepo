from typing import TYPE_CHECKING

from django.db import models
from django.db.models import OuterRef, Subquery
from django.db.models.query import QuerySet

if TYPE_CHECKING:
    from notes.models import Note


class NoteManager(models.Manager["Note"]):
    def get_queryset(self) -> QuerySet["Note"]:
        last_history = (
            self.model.history.model.objects.filter(id=OuterRef("pk"))
            .order_by("-history_date")
            .values("history_id")[:1]
        )

        return (
            super().get_queryset()
            # TODO: add a bunch of permission prefetching to remove n+1 queries
            # .prefetch_related(...)
            .annotate(history_id=Subquery(last_history))
        )
