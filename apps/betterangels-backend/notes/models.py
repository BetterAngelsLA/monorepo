from accounts.models import User
from common.models import BaseModel
from django.contrib.gis.db.models import PointField
from django.db import models
from django_choices_field import TextChoicesField
from guardian.models import GroupObjectPermissionBase, UserObjectPermissionBase
from organizations.models import Organization
from simple_history.models import HistoricalRecords

from .enums import MoodEnum, ServiceEnum, ServiceTypeEnum


class PrivateNoteDetail(models.Model):
    content = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    privatenotedetailuserobjectpermission_set: models.QuerySet["PrivateNoteDetail"]
    privatenotedetailgroupobjectpermission_set: models.QuerySet["PrivateNoteDetail"]

    def __str__(self) -> str:
        return f"Private note for {self.note.title}"


class Location(BaseModel):
    point = PointField()
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=50, blank=True)


class Note(BaseModel):
    title = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    location = models.ForeignKey(
        Location, on_delete=models.CASCADE, null=True, blank=True, related_name="notes"
    )
    public_details = models.TextField(null=True)
    private_details = models.OneToOneField(
        PrivateNoteDetail,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="note",
    )
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
    history = HistoricalRecords()

    noteuserobjectpermission_set: models.QuerySet["Note"]
    notegroupobjectpermission_set: models.QuerySet["Note"]

    def __str__(self) -> str:
        return self.title


class Mood(BaseModel):
    descriptor = TextChoicesField(choices_enum=MoodEnum)
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name="moods")


class Service(BaseModel):
    descriptor = TextChoicesField(choices_enum=ServiceEnum)
    custom_descriptor = models.CharField(max_length=100, blank=True)
    service_type = TextChoicesField(choices_enum=ServiceTypeEnum)
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name="services")


class NoteUserObjectPermission(UserObjectPermissionBase):
    content_object = models.ForeignKey(Note, on_delete=models.CASCADE)


class NoteGroupObjectPermission(GroupObjectPermissionBase):
    content_object = models.ForeignKey(Note, on_delete=models.CASCADE)


class PrivateNoteDetailUserObjectPermission(UserObjectPermissionBase):
    content_object = models.ForeignKey(PrivateNoteDetail, on_delete=models.CASCADE)


class PrivateNoteDetailGroupObjectPermission(GroupObjectPermissionBase):
    content_object = models.ForeignKey(PrivateNoteDetail, on_delete=models.CASCADE)
