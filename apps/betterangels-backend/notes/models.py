from datetime import timedelta
from typing import TYPE_CHECKING, Any, Dict, Optional

import pghistory
from accounts.models import User
from common.models import Attachment, BaseModel, Location
from common.permissions.utils import permission_enum_to_django_meta_permissions
from django.contrib.contenttypes.fields import GenericRelation
from django.db import models
from django.db.models import Q
from django.utils import timezone
from django_choices_field import TextChoicesField
from guardian.models import GroupObjectPermissionBase, UserObjectPermissionBase
from notes.permissions import PrivateDetailsPermissions
from organizations.models import Organization
from strawberry_django.descriptors import model_property

from .enums import (
    DueByGroupEnum,
    MoodEnum,
    ServiceEnum,
    ServiceRequestStatusEnum,
    TaskStatusEnum,
)

if TYPE_CHECKING:
    from pghistory.models import Events


@pghistory.track(
    pghistory.InsertEvent("service_request.add"),
    pghistory.UpdateEvent("service_request.update"),
    pghistory.DeleteEvent("service_request.remove"),
)
class ServiceRequest(BaseModel):
    service = TextChoicesField(choices_enum=ServiceEnum)
    custom_service = models.CharField(max_length=100, null=True, blank=True)
    client = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="client_service_requests",
    )
    status = TextChoicesField(choices_enum=ServiceRequestStatusEnum)
    due_by = models.DateTimeField(blank=True, null=True)
    completed_on = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="service_requests")

    objects = models.Manager()

    servicerequestuserobjectpermission_set: models.QuerySet["ServiceRequestUserObjectPermission"]
    servicerequestgroupobjectpermission_set: models.QuerySet["ServiceRequestGroupObjectPermission"]

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.status == ServiceRequestStatusEnum.COMPLETED:
            self.completed_on = self.completed_on or timezone.now()

        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return str(self.service if not self.custom_service else self.custom_service)

    def revert_action(self, action: str, diff: Dict[str, Any], *args: Any, **kwargs: Any) -> None:
        match action:
            case "add":
                self.delete()
            case "update":
                for field, changes in diff.items():
                    setattr(self, field, changes[0])

                self.save()
            case _:
                raise Exception(f"Action {action} is not revertable")

    def get_note_id(self) -> int | None:
        """
        NOTE: this function will have to change once ServiceRequests can be associated with multiple Notes
        """
        if note := Note.objects.filter(Q(provided_services__id=self.id) | Q(requested_services__id=self.id)).first():
            return note.id
        return None


@pghistory.track(
    pghistory.InsertEvent("task.add"),
    pghistory.UpdateEvent("task.update"),
    pghistory.DeleteEvent("task.remove"),
)
class Task(BaseModel):
    title = models.CharField(max_length=100)
    location = models.ForeignKey(Location, on_delete=models.CASCADE, null=True, blank=True, related_name="tasks")
    status = TextChoicesField(choices_enum=TaskStatusEnum)
    due_by = models.DateTimeField(blank=True, null=True)
    client = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="client_tasks",
    )
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, null=False, related_name="tasks")

    taskuserobjectpermission_set: models.QuerySet["TaskUserObjectPermission"]
    taskgroupobjectpermission_set: models.QuerySet["TaskGroupObjectPermission"]

    def __str__(self) -> str:
        return self.title if self.title else f"{self.created_by.first_name}'s task ({self.pk})"

    def revert_action(self, action: str, diff: Dict[str, Any], *args: Any, **kwargs: Any) -> None:
        match action:
            case "add":
                self.delete()
            case "update":
                for field, changes in diff.items():
                    setattr(self, field, changes[0])

                self.save()
            case _:
                raise Exception(f"Action {action} is not revertable")

    def get_note_id(self) -> int | None:
        """
        NOTE: this function will have to change once Tasks can be associated with multiple Notes
        """
        if note := Note.objects.filter(Q(purposes__id=self.id) | Q(next_steps__id=self.id)).first():
            return note.id

        return None

    @model_property
    def due_by_group(self) -> Optional[str]:
        DAYS_IN_A_WEEK = 7

        if self.due_by is None:
            return DueByGroupEnum.NO_DUE_DATE

        due_by_date = self.due_by.date()
        today = timezone.now().date()

        if due_by_date < today:
            return DueByGroupEnum.OVERDUE

        if due_by_date == today:
            return DueByGroupEnum.TODAY

        if due_by_date == today + timedelta(days=1):
            return DueByGroupEnum.TOMORROW

        if due_by_date <= today + timedelta(days=DAYS_IN_A_WEEK):
            return DueByGroupEnum.IN_THE_NEXT_WEEK

        return DueByGroupEnum.FUTURE_TASKS


@pghistory.track(
    pghistory.InsertEvent("note.add"),
    pghistory.UpdateEvent("note.update"),
    pghistory.DeleteEvent("note.remove"),
)
class Note(BaseModel):
    attachments = GenericRelation(Attachment)
    title = models.CharField(max_length=100)
    # This is the date & time displayed on the note. We don't want to use created_at
    # on the FE because the Note may not be created during the client interaction.
    interacted_at = models.DateTimeField(auto_now_add=True, db_index=True)
    location = models.ForeignKey(Location, on_delete=models.CASCADE, null=True, blank=True, related_name="notes")
    purposes = models.ManyToManyField(Task, blank=True, related_name="purpose_notes")
    next_steps = models.ManyToManyField(Task, blank=True, related_name="next_step_notes")
    requested_services = models.ManyToManyField(ServiceRequest, blank=True, related_name="requested_notes")
    provided_services = models.ManyToManyField(ServiceRequest, blank=True, related_name="provided_notes")
    public_details = models.TextField(blank=True)
    private_details = models.TextField(blank=True)
    is_submitted = models.BooleanField(default=False)
    client = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name="client_notes")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name="notes")

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)

    objects = models.Manager()

    noteuserobjectpermission_set: models.QuerySet["NoteUserObjectPermission"]
    notegroupobjectpermission_set: models.QuerySet["NoteGroupObjectPermission"]

    events: models.QuerySet["Events"]

    # Type hints for permission annotations
    _private_details: Optional[str]

    def __str__(self) -> str:
        return self.title

    def revert_action(self, action: str, diff: Dict[str, Any], *args: Any, **kwargs: Any) -> None:
        match action:
            case "update":
                for field, changes in diff.items():
                    setattr(self, field, changes[0])

                self.save()
            case _:
                raise Exception(f"Action {action} is not revertable")

    class Meta:
        permissions = permission_enum_to_django_meta_permissions(PrivateDetailsPermissions)


@pghistory.track(
    pghistory.InsertEvent("note_purposes.add"),
    pghistory.DeleteEvent("note_purposes.remove"),
    obj_field=None,
)
class NotePurposes(Note.purposes.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True

    @staticmethod
    def revert_action(action: str, note_id: int, task_id: int, *args: Any, **kwargs: Any) -> None:
        note = Note.objects.get(id=note_id)
        task = Task.objects.get(id=task_id)

        if action == "add":
            note.purposes.remove(task)

        elif action == "remove":
            note.purposes.add(task)


@pghistory.track(
    pghistory.InsertEvent("note_next_steps.add"),
    pghistory.DeleteEvent("note_next_steps.remove"),
    obj_field=None,
)
class NoteNextSteps(Note.next_steps.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True

    @staticmethod
    def revert_action(action: str, note_id: int, task_id: int, *args: Any, **kwargs: Any) -> None:
        note = Note.objects.get(id=note_id)
        task = Task.objects.get(id=task_id)

        if action == "add":
            note.next_steps.remove(task)

        elif action == "remove":
            note.next_steps.add(task)


@pghistory.track(
    pghistory.InsertEvent("note_provided_services.add"),
    pghistory.DeleteEvent("note_provided_services.remove"),
    obj_field=None,
)
class NoteProvidedServices(Note.provided_services.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True

    @staticmethod
    def revert_action(action: str, note_id: int, servicerequest_id: int, *args: Any, **kwargs: Any) -> None:
        note = Note.objects.get(id=note_id)
        service_request = ServiceRequest.objects.get(id=servicerequest_id)

        if action == "add":
            note.provided_services.remove(service_request)

        elif action == "remove":
            note.provided_services.add(service_request)


@pghistory.track(
    pghistory.InsertEvent("note_requested_services.add"),
    pghistory.DeleteEvent("note_requested_services.remove"),
    obj_field=None,
)
class NoteRequestedServices(Note.requested_services.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True

    @staticmethod
    def revert_action(action: str, note_id: int, servicerequest_id: int, *args: Any, **kwargs: Any) -> None:
        note = Note.objects.get(id=note_id)
        service_request = ServiceRequest.objects.get(id=servicerequest_id)

        if action == "add":
            note.requested_services.remove(service_request)

        elif action == "remove":
            note.requested_services.add(service_request)


@pghistory.track(
    pghistory.InsertEvent("mood.add"),
    pghistory.DeleteEvent("mood.remove"),
)
class Mood(BaseModel):
    descriptor = TextChoicesField(choices_enum=MoodEnum)
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name="moods")

    objects = models.Manager()

    def revert_action(self, action: str, *args: Any, **kwargs: Any) -> None:
        if action == "add":
            self.delete()


class NoteUserObjectPermission(UserObjectPermissionBase):
    content_object = models.ForeignKey(Note, on_delete=models.CASCADE)


class NoteGroupObjectPermission(GroupObjectPermissionBase):
    content_object = models.ForeignKey(Note, on_delete=models.CASCADE)


class TaskUserObjectPermission(UserObjectPermissionBase):
    content_object = models.ForeignKey(Task, on_delete=models.CASCADE)


class TaskGroupObjectPermission(GroupObjectPermissionBase):
    content_object = models.ForeignKey(Task, on_delete=models.CASCADE)


class ServiceRequestUserObjectPermission(UserObjectPermissionBase):
    content_object = models.ForeignKey(ServiceRequest, on_delete=models.CASCADE)


class ServiceRequestGroupObjectPermission(GroupObjectPermissionBase):
    content_object = models.ForeignKey(ServiceRequest, on_delete=models.CASCADE)
