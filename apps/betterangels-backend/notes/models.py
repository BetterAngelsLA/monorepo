from simple_history.models import HistoricalRecords
from accounts.models import User
from django.contrib.gis.db.models import PointField
from django.db import models
from django_choices_field import TextChoicesField
from guardian.models import GroupObjectPermissionBase, UserObjectPermissionBase

from .enums import MoodEnum, ServiceEnum, ServiceTypeEnum, TaskStatusEnum


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    class Meta:
        abstract = True


class Location(BaseModel):
    point = PointField()
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=50, blank=True)


class Task(BaseModel):
    title = models.CharField(max_length=100)
    status = models.CharField(
        choices=[(x, x.value) for x in TaskStatusEnum],
        default=TaskStatusEnum.IN_PROGRESS,
    )
    due_date = models.DateTimeField(blank=True, null=True)
    location = models.ForeignKey(
        Location, on_delete=models.CASCADE, null=True, blank=True, related_name="tasks"
    )
    client = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="client_tasks"
    )
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="tasks"
    )
    history = HistoricalRecords()


class Note(BaseModel):
    title = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    location = models.ForeignKey(
        Location, on_delete=models.CASCADE, null=True, blank=True, related_name="notes"
    )
    # TODO: rename field and related_names!
    # Other field names to consider:
    # parent_tasks -> source_tasks / purpose_tasks
    # child_tasks -> next_tasks / followup_tasks
    parent_tasks = models.ManyToManyField(Task, related_name="notes_created")
    child_tasks = models.ManyToManyField(Task, related_name="notes_next_task")
    public_details = models.TextField(null=True)
    private_details = models.TextField(blank=True)
    is_submitted = models.BooleanField(default=False)
    # TODO: make unnullable
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
    history = HistoricalRecords()

    noteuserobjectpermission_set: models.QuerySet["Note"]
    notegroupobjectpermission_set: models.QuerySet["Note"]

    def __str__(self) -> str:
        return self.public_details[:50]


class Mood(BaseModel):
    title = TextChoicesField(choices_enum=MoodEnum)
    note = models.ForeignKey(
        Note, on_delete=models.CASCADE, related_name="moods"
    )


class Service(BaseModel):
    title = TextChoicesField(choices_enum=ServiceEnum)
    custom_title = models.CharField(max_length=100, blank=True)
    service_type = TextChoicesField(choices_enum=ServiceTypeEnum)
    note = models.ForeignKey(
        Note, on_delete=models.CASCADE, related_name="services"
    )


class NoteUserObjectPermission(UserObjectPermissionBase):
    content_object = models.ForeignKey(Note, on_delete=models.CASCADE)


class NoteGroupObjectPermission(GroupObjectPermissionBase):
    content_object = models.ForeignKey(Note, on_delete=models.CASCADE)
