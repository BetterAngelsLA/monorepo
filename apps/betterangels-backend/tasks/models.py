from typing import Any, Optional

import pghistory
from django.contrib.postgres.indexes import GinIndex
from django.core.exceptions import ValidationError
from django.db import models
from django_choices_field import IntegerChoicesField
from organizations.models import Organization

from accounts.models import User
from common.models import BaseModel
from common.utils import can_match
from teams.models import Team
from teams.validators import validate_team_in_org

from .managers import TaskManager


@pghistory.track(
    pghistory.InsertEvent("task.add"),
    pghistory.UpdateEvent("task.update"),
    pghistory.DeleteEvent("task.remove"),
)
class Task(BaseModel):
    class Status(models.IntegerChoices):
        TO_DO = 0, "To Do"
        IN_PROGRESS = 1, "In Progress"
        COMPLETED = 2, "Completed"

    client_profile = models.ForeignKey(
        "clients.ClientProfile",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="tasks",
    )
    hmis_client_profile = models.ForeignKey(
        "hmis.HmisClientProfile",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="tasks",
    )
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="tasks")
    # A distinct ``related_name`` from ``created_by``: the same user is routinely
    # the creator of one task and the assignee of another.
    assignee = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks",
    )
    description = models.TextField(blank=True, null=True)
    note = models.ForeignKey("notes.Note", on_delete=models.CASCADE, blank=True, null=True, related_name="tasks")
    hmis_note = models.ForeignKey(
        "hmis.HmisNote", null=True, blank=True, on_delete=models.CASCADE, related_name="tasks"
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks",
    )
    status = IntegerChoicesField(Status, default=Status.TO_DO, db_index=True)
    summary = models.CharField(max_length=100, db_index=True)
    team = models.ForeignKey(Team, null=True, blank=True, on_delete=models.RESTRICT, db_index=True)

    def __str__(self) -> str:
        return self.summary

    # Attributes set by `from_db` so `clean` can tell an untouched assignment
    # from a changed one.
    _loaded_assignee_id: Optional[int]
    _loaded_organization_id: Optional[int]

    @classmethod
    def from_db(  # type: ignore[override]
        cls, db: Any, field_names: set[str], values: Any
    ) -> "Task":
        instance = super().from_db(db, field_names, values)

        # Remember what was loaded so `clean` can skip re-checking an
        # assignment that has not changed. Status-only edits were paying for a
        # membership query they could not affect.
        instance._loaded_assignee_id = instance.__dict__.get("assignee_id")
        instance._loaded_organization_id = instance.__dict__.get("organization_id")

        return instance

    def clean(self) -> None:
        """Reject a team or an assignee from another organization."""
        super().clean()

        try:
            validate_team_in_org(team_id=self.team_id, organization_id=self.organization_id)
        except ValidationError as exc:
            raise ValidationError({"team": exc.messages}) from exc

        self._validate_assignee_in_org()

    def _validate_assignee_in_org(self) -> None:
        """Reject an assignee who is not a member of this task's organization.

        Checked against the organization's members rather than the user table:
        an assignee must be someone the org actually contains, which is what
        the picker offers. Like the team rule above this runs from
        ``full_clean()``, so the admin and management commands agree with the
        mutations.
        """
        if self.assignee_id is None:
            return

        if (
            not self._state.adding
            and self.assignee_id == getattr(self, "_loaded_assignee_id", None)
            and self.organization_id == getattr(self, "_loaded_organization_id", None)
        ):
            return

        organization = self.organization

        if organization is None:
            # Deleting an organization nulls `organization_id` (SET_NULL) but
            # leaves `assignee_id` behind. Rejecting that combination outright
            # would freeze the row: every later save — an unrelated status
            # edit included — would fail validation. Only new tasks are held to
            # the rule; orphans stay editable.
            if self._state.adding:
                raise ValidationError({"assignee": "An assignee cannot be set on a task with no organization."})

            return

        if not can_match(field=User._meta.pk, value=self.assignee_id):
            raise ValidationError({"assignee": f"The selected assignee is not valid: {self.assignee_id}."})

        if not organization.users.filter(pk=self.assignee_id).exists():
            raise ValidationError({"assignee": "The selected assignee is not a member of this organization."})

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            GinIndex(
                name="task_description_trgm",
                fields=["description"],
                opclasses=["gin_trgm_ops"],
            ),
            GinIndex(
                name="task_summary_trgm",
                fields=["summary"],
                opclasses=["gin_trgm_ops"],
            ),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(note__isnull=True) | models.Q(hmis_note__isnull=True),
                name="task_single_parent_check",
                violation_error_message="A task belongs to one note, not both a note and an HMIS note.",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(client_profile__isnull=False, hmis_client_profile__isnull=True)
                    | models.Q(client_profile__isnull=True, hmis_client_profile__isnull=False)
                    | models.Q(client_profile__isnull=True, hmis_client_profile__isnull=True)
                ),
                name="task_only_one_client_link",
                violation_error_message="A task belongs to one client, not both a client profile and an HMIS client profile.",
            ),
        ]

    objects = TaskManager()
