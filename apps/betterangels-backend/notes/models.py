from typing import Any, Optional

import pghistory
from accounts.models import User
from common.models import Address, Attachment, BaseModel
from common.permissions.utils import permission_enum_to_django_meta_permissions
from django.contrib.contenttypes.fields import GenericRelation
from django.contrib.gis.db.models import PointField
from django.db import models
from django.utils import timezone
from django_choices_field import TextChoicesField
from guardian.models import GroupObjectPermissionBase, UserObjectPermissionBase
from notes.permissions import PrivateDetailsPermissions
from organizations.models import Organization

from .enums import MoodEnum, ServiceEnum, ServiceRequestStatusEnum, TaskStatusEnum


@pghistory.track(
    pghistory.InsertEvent("service_request.add"),
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
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="service_requests"
    )

    objects = models.Manager()

    servicerequestuserobjectpermission_set: models.QuerySet["ServiceRequest"]
    servicerequestgroupobjectpermission_set: models.QuerySet["ServiceRequest"]

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.status == ServiceRequestStatusEnum.COMPLETED:
            self.completed_on = self.completed_on or timezone.now()

        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return str(self.service if not self.custom_service else self.custom_service)


@pghistory.track(
    pghistory.InsertEvent("task.add"),
    pghistory.DeleteEvent("task.remove"),
)
class Task(BaseModel):
    title = models.CharField(max_length=100, blank=False)
    point = PointField(geography=True, null=True, blank=True)
    address = models.ForeignKey(
        Address, on_delete=models.CASCADE, null=True, blank=True, related_name="tasks"
    )
    status = TextChoicesField(choices_enum=TaskStatusEnum)
    due_by = models.DateTimeField(blank=True, null=True)
    client = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="client_tasks",
    )
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, null=False, related_name="tasks"
    )

    taskuserobjectpermission_set: models.QuerySet["Task"]
    taskgroupobjectpermission_set: models.QuerySet["Task"]

    def __str__(self) -> str:
        return self.title


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
    timestamp = models.DateTimeField(auto_now_add=True)
    point = PointField(geography=True, null=True, blank=True)
    address = models.ForeignKey(
        Address, on_delete=models.CASCADE, null=True, blank=True, related_name="notes"
    )
    purposes = models.ManyToManyField(Task, blank=True, related_name="purpose_notes")
    next_steps = models.ManyToManyField(
        Task, blank=True, related_name="next_step_notes"
    )
    requested_services = models.ManyToManyField(
        ServiceRequest, blank=True, related_name="requested_notes"
    )
    provided_services = models.ManyToManyField(
        ServiceRequest, blank=True, related_name="provided_notes"
    )
    public_details = models.TextField(blank=True)
    private_details = models.TextField(blank=True)
    is_submitted = models.BooleanField(default=False)
    client = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="client_notes",
    )
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, blank=True, related_name="notes"
    )

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)

    objects = models.Manager()

    noteuserobjectpermission_set: models.QuerySet["Note"]
    notegroupobjectpermission_set: models.QuerySet["Note"]

    # Type hints for permission annotations
    _private_details: Optional[str]

    def __str__(self) -> str:
        return self.title

    class Meta:
        permissions = permission_enum_to_django_meta_permissions(
            PrivateDetailsPermissions
        )


@pghistory.track(
    pghistory.InsertEvent("note_purposes.add"),
    pghistory.DeleteEvent("note_purposes.remove"),
    obj_field=None,
)
class NotePurposes(Note.purposes.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True

    @staticmethod
    def revert_action(
        action: str, note_id: int, task_id: int, *args: Any, **kwargs: Any
    ) -> None:
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
    def revert_action(
        action: str, note_id: int, task_id: int, *args: Any, **kwargs: Any
    ) -> None:
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
    def revert_action(
        action: str, note_id: int, servicerequest_id: int, *args: Any, **kwargs: Any
    ) -> None:
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
    def revert_action(
        action: str, note_id: int, servicerequest_id: int, *args: Any, **kwargs: Any
    ) -> None:
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

    def revert_action(self, action: str) -> None:
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
