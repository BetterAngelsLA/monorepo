from typing import Optional

from accounts.models import User
from common.models import Attachment, BaseModel, Location
from common.permissions.utils import permission_enum_to_django_meta_permissions
from django.contrib.contenttypes.fields import GenericRelation
from django.db import models
from django_choices_field import TextChoicesField
from guardian.models import GroupObjectPermissionBase, UserObjectPermissionBase
from notes.permissions import PrivateNotePermissions
from organizations.models import Organization
from simple_history.models import HistoricalRecords, HistoricForeignKey

from .enums import MoodEnum, ServiceEnum, ServiceTypeEnum, TaskStatusEnum


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
    public_details = models.TextField(blank=True)
    private_details = models.TextField(blank=True)

    location = models.ForeignKey(
        Location, on_delete=models.CASCADE, null=True, blank=True, related_name="notes"
    )

    timestamp = models.DateTimeField(auto_now_add=True)

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

    is_submitted = models.BooleanField(default=False)

    attachments = GenericRelation(Attachment)

    objects = models.Manager()
    log = HistoricalRecords(related_name="history")

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
