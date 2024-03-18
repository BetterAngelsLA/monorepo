from typing import Any, Optional, cast

from accounts.models import User
from common.models import Attachment, BaseModel, Location
from common.permissions.utils import permission_enum_to_django_meta_permissions
from django.contrib.contenttypes.fields import GenericRelation
from django.db import models
from django.utils import timezone
from django_choices_field import TextChoicesField
from guardian.models import GroupObjectPermissionBase, UserObjectPermissionBase
from notes.permissions import PrivateDetailsPermissions
from organizations.models import Organization
from simple_history.models import HistoricalRecords, HistoricForeignKey

from .enums import MoodEnum, ServiceEnum, ServiceRequestStatusEnum, TaskStatusEnum


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

    log = HistoricalRecords(related_name="history")
    objects = models.Manager()

    servicerequestuserobjectpermission_set: models.QuerySet["ServiceRequest"]
    servicerequestgroupobjectpermission_set: models.QuerySet["ServiceRequest"]

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.status == ServiceRequestStatusEnum.COMPLETED:
            self.completed_on = self.completed_on or timezone.now()

        super().save(*args, **kwargs)

    def __str__(self) -> ServiceEnum:
        return cast(ServiceEnum, self.service)


class Task(BaseModel):
    title = models.CharField(max_length=100, blank=False)
    status = TextChoicesField(choices_enum=TaskStatusEnum)
    due_by = models.DateTimeField(blank=True, null=True)
    location = models.ForeignKey(
        Location, on_delete=models.CASCADE, null=True, blank=True, related_name="tasks"
    )
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

    log = HistoricalRecords(related_name="history")

    def __str__(self) -> str:
        return self.title


class Note(BaseModel):
    attachments = GenericRelation(Attachment)
    title = models.CharField(max_length=100)
    # This is the date & time displayed on the note. We don't want to use created_at
    # on the FE because the Note may not be created during the client interaction.
    timestamp = models.DateTimeField(auto_now_add=True)
    location = models.ForeignKey(
        Location, on_delete=models.CASCADE, null=True, blank=True, related_name="notes"
    )
    purposes = models.ManyToManyField(Task, related_name="purpose_notes")
    next_steps = models.ManyToManyField(Task, related_name="next_step_notes")
    requested_services = models.ManyToManyField(
        ServiceRequest, related_name="requested_notes"
    )
    provided_services = models.ManyToManyField(
        ServiceRequest, related_name="provided_notes"
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

    log = HistoricalRecords(related_name="history", m2m_fields=[purposes, next_steps])
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


class Mood(BaseModel):
    descriptor = TextChoicesField(choices_enum=MoodEnum)
    note = HistoricForeignKey(Note, on_delete=models.CASCADE, related_name="moods")

    log = HistoricalRecords(related_name="history")
    objects = models.Manager()


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
