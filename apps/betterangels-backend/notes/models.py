from accounts.models import User
from django.contrib.gis.db.models import PointField
from django.db import models
from guardian.models import GroupObjectPermissionBase, UserObjectPermissionBase

from .enums import MoodEnum, ServiceEnum, TaskStatusEnum


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(default=None, blank=True, null=True)

    class Meta:
        abstract = True


class Location(TimestampedModel):
    point = PointField()
    address = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    zip_code = models.IntegerField()


class Mood(models.Model):
    title = models.CharField(choices=[(x, x.value) for x in MoodEnum], unique=True)


class Service(TimestampedModel):
    title = models.CharField(choices=[(x, x.value) for x in ServiceEnum], unique=True)
    custom_title = models.CharField(max_length=100, blank=True)


class Task(TimestampedModel):
    title = models.CharField(max_length=100, blank=False)
    status = models.CharField(
        choices=[(x, x.value) for x in TaskStatusEnum],
        default=TaskStatusEnum.IN_PROGRESS,
    )
    due_date = models.DateTimeField(blank=True, null=True)
    location = models.ForeignKey(
        Location, on_delete=models.CASCADE, null=True, blank=True, related_name="tasks"
    )
    client = models.ForeignKey(
        User, on_delete=models.CASCADE, null=False, related_name="client_tasks"
    )
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, null=False, related_name="tasks"
    )

    objects = models.Manager()


# TODO: Figure out why User/Group Perms are failing type checks
# https://github.com/typeddjango/django-stubs/issues/1354
class Note(TimestampedModel):  # type: ignore[django-manager-missing]
    title = models.CharField(max_length=100, blank=False)
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
    moods = models.ManyToManyField(Mood)
    provided_services = models.ManyToManyField(Service, related_name="notes")
    requested_services = models.ManyToManyField(Service, related_name="notes")
    provided_services = models.ManyToManyField(
        Service, related_name="notes_with_requested"
    )
    requested_services = models.ManyToManyField(
        Service, related_name="notes_with_provided"
    )
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

    objects = models.Manager()

    def __str__(self) -> str:
        return self.public_details[:50]


class NoteUserObjectPermission(UserObjectPermissionBase):
    content_object = models.ForeignKey(
        Note, on_delete=models.CASCADE, related_name="user_object_permissions"
    )


class NoteGroupObjectPermission(GroupObjectPermissionBase):
    content_object = models.ForeignKey(
        Note, on_delete=models.CASCADE, related_name="group_object_permissions"
    )
