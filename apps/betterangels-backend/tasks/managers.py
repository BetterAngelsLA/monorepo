from typing import TYPE_CHECKING

from django.db.models import Manager, QuerySet

if TYPE_CHECKING:
    from .models import Task


class TaskManager(Manager["Task"]):
    def tasks_for_user(self, is_hmis_user: bool = False) -> QuerySet["Task"]:
        qs = self.get_queryset().select_related(
            "client_profile",
            "created_by",
            "hmis_client_profile",
            "hmis_note",
            "note",
            "organization",
        )

        if is_hmis_user:
            return qs.filter(hmis_client_profile__isnull=False)

        return qs.filter(client_profile__isnull=False)
