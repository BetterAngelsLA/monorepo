from django.db import models
from django.db.models import OuterRef, Subquery
from simple_history.models import HistoricalRecords


class NoteManager(models.Manager):
    def get_queryset(self):
        last_history = (
            self.model.history.model.objects.filter(id=OuterRef("pk"))
            .order_by("-history_date")
            .values("history_id")[:1]
        )

        return super().get_queryset().annotate(history_id=Subquery(last_history))
