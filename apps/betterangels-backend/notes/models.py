from typing import Any, Optional

from accounts.models import User
from common.models import BaseModel, Location
from common.permissions.utils import permission_enum_to_django_meta_permissions
from django.db import models
from django.utils import timezone
from django_choices_field import TextChoicesField
from guardian.models import GroupObjectPermissionBase, UserObjectPermissionBase
from notes.permissions import PrivateNotePermissions
from organizations.models import Organization
from simple_history.models import HistoricalRecords, HistoricForeignKey

from .enums import (
    MoodEnum,
    ServiceEnum,
    ServiceRequestStatusEnum,
    ServiceTypeEnum,
    TaskStatusEnum,
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
    completed_on = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="service_requests"
    )

    servicerequestuserobjectpermission_set: models.QuerySet["ServiceRequest"]
    servicerequestgroupobjectpermission_set: models.QuerySet["ServiceRequest"]

    def save(self, *args: Any, **kwargs: Any) -> None:

        if self.status == ServiceRequestStatusEnum.COMPLETED:
            if self.pk:
                original_instance = ServiceRequest.objects.get(pk=self.pk)
                if original_instance.status != ServiceRequestStatusEnum.COMPLETED:
                    self.completed_on = timezone.now()
            else:
                self.completed_on = timezone.now()

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

    def __str__(self) -> str:
        return self.title


class Note(BaseModel):
    title = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    location = models.ForeignKey(
        Location, on_delete=models.CASCADE, null=True, blank=True, related_name="notes"
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

    log = HistoricalRecords(related_name="history")
    objects = models.Manager()

    noteuserobjectpermission_set: models.QuerySet["Note"]
    notegroupobjectpermission_set: models.QuerySet["Note"]

    # Type hints for permission annotations
    _private_details: Optional[str]

    def __str__(self) -> str:
        return self.title

    class Meta:
        permissions = permission_enum_to_django_meta_permissions(PrivateNotePermissions)


class Mood(BaseModel):
    descriptor = TextChoicesField(choices_enum=MoodEnum)
    note = HistoricForeignKey(Note, on_delete=models.CASCADE, related_name="moods")

    log = HistoricalRecords(related_name="history")
    objects = models.Manager()


class Service(BaseModel):
    descriptor = TextChoicesField(choices_enum=ServiceEnum)
    custom_descriptor = models.CharField(max_length=100, blank=True)
    service_type = TextChoicesField(choices_enum=ServiceTypeEnum)
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name="services")


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
