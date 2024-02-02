from accounts.models import User
from django.contrib.gis.db.models import PointField
from django.db import models
from guardian.models import GroupObjectPermissionBase, UserObjectPermissionBase

from .enums import MoodEnum, ServiceEnum


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
    title = models.CharField(choices=[(x, x.value) for x in MoodEnum], blank=True)


class Service(TimestampedModel):
    title = models.CharField(choices=[(x, x.value) for x in ServiceEnum], blank=True)
    custom_title = models.CharField(max_length=100, blank=True)


class Task(TimestampedModel):
    title = models.CharField(max_length=100, blank=False)
    due_date = models.DateTimeField(blank=True, null=True)
    location = models.ForeignKey(
        Location, on_delete=models.CASCADE, null=True, related_name="tasks"
    )
    parent_tasks = models.ForeignKey(
        "self", on_delete=models.PROTECT, null=True, related_name="children"
    )
    child_tasks = models.ForeignKey(
        "self", on_delete=models.PROTECT, null=True, related_name="parents"
    )
    client = models.ForeignKey(
        User, on_delete=models.CASCADE, null=False, related_name="client_tasks"
    )
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, null=False, related_name="tasks"
    )


# TODO: Figure out why User/Group Perms are failing type checks
# https://github.com/typeddjango/django-stubs/issues/1354
class Note(TimestampedModel):  # type: ignore[django-manager-missing]
    title = models.CharField(max_length=100, blank=False)
    timestamp = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    location = models.ForeignKey(
        Location, on_delete=models.CASCADE, null=True, related_name="notes"
    )
    tasks = models.ManyToManyField(Task)
    moods = models.ManyToManyField(Mood)
    provided_services = models.ManyToManyField(Service, related_name="notes")
    requested_services = models.ManyToManyField(Service, related_name="notes")
    provided_services = models.ManyToManyField(
        Service, related_name="notes_with_requested"
    )
    requested_services = models.ManyToManyField(
        Service, related_name="notes_with_provided"
    )
    # TODO: delete body when you figure out how to replace it
    body = models.TextField(blank=False)
    public_details = models.TextField(null=True)
    private_details = models.TextField(blank=True)
    is_submitted = models.BooleanField(default=False)

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
