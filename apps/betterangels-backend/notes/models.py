from accounts.models import User
from common.models import BaseModel
from common.permissions.utils import permission_enum_to_django_meta_permissions
from django.contrib.gis.db.models import PointField
from django.db import models
from django_choices_field import TextChoicesField
from guardian.models import GroupObjectPermissionBase, UserObjectPermissionBase
from notes.permissions import PrivateNotePermissions
from organizations.models import Organization
from simple_history.models import HistoricalRecords, HistoricForeignKey

from .enums import MoodEnum, ServiceEnum, ServiceTypeEnum
from .managers import NoteManager


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
    history = HistoricalRecords()

    noteuserobjectpermission_set: models.QuerySet["Note"]
    notegroupobjectpermission_set: models.QuerySet["Note"]

    objects = NoteManager()  # type: ignore[misc]

    def __str__(self) -> str:
        return self.title

    class Meta:
        permissions = permission_enum_to_django_meta_permissions(PrivateNotePermissions)


class Mood(BaseModel):
    descriptor = TextChoicesField(choices_enum=MoodEnum)
    note = HistoricForeignKey(Note, on_delete=models.CASCADE, related_name="moods")
    history = HistoricalRecords()


class Service(BaseModel):
    descriptor = TextChoicesField(choices_enum=ServiceEnum)
    custom_descriptor = models.CharField(max_length=100, blank=True)
    service_type = TextChoicesField(choices_enum=ServiceTypeEnum)
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name="services")


class NoteUserObjectPermission(UserObjectPermissionBase):
    content_object = models.ForeignKey(Note, on_delete=models.CASCADE)


class NoteGroupObjectPermission(GroupObjectPermissionBase):
    content_object = models.ForeignKey(Note, on_delete=models.CASCADE)
