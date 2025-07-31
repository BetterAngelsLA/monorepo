import uuid
from typing import TYPE_CHECKING, Any, Dict, Optional

import pghistory
from accounts.models import User
from betterangels_backend import settings
from common.models import Attachment, BaseModel, Location
from common.permissions.utils import permission_enums_to_django_meta_permissions
from django.contrib.contenttypes.fields import GenericRelation
from django.db import models
from django.db.models import Q
from django.utils import timezone
from django_choices_field import TextChoicesField
from guardian.models import GroupObjectPermissionBase, UserObjectPermissionBase
from notes.permissions import PrivateDetailsPermissions
from organizations.models import Organization

from .enums import MoodEnum, SelahTeamEnum, ServiceEnum, ServiceRequestStatusEnum

if TYPE_CHECKING:
    from pghistory.models import Events


@pghistory.track(
    pghistory.InsertEvent("service_request.add"),
    pghistory.UpdateEvent("service_request.update"),
    pghistory.DeleteEvent("service_request.remove"),
)
class ServiceRequest(BaseModel):  # type: ignore[django-manager-missing]
    service = TextChoicesField(choices_enum=ServiceEnum)
    service_other = models.CharField(max_length=100, null=True, blank=True)
    client_profile = models.ForeignKey(
        "clients.ClientProfile",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="client_profile_service_requests",
    )
    status = TextChoicesField(choices_enum=ServiceRequestStatusEnum)
    due_by = models.DateTimeField(blank=True, null=True)
    completed_on = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="service_requests")

    objects = models.Manager()

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.status == ServiceRequestStatusEnum.COMPLETED:
            self.completed_on = self.completed_on or timezone.now()

        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return str(self.service if not self.service_other else self.service_other)

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

    class Meta:
        ordering = ["-created_at"]


@pghistory.track(
    pghistory.InsertEvent("note.add"),
    pghistory.UpdateEvent("note.update"),
    pghistory.DeleteEvent("note.remove"),
)
class Note(BaseModel):  # type: ignore[django-manager-missing]
    attachments = GenericRelation(Attachment)
    client_profile = models.ForeignKey(
        "clients.ClientProfile", on_delete=models.CASCADE, null=True, blank=True, related_name="client_profile_notes"
    )
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name="notes")
    # This is the date & time displayed on the note. We don't want to use created_at
    # on the FE because the Note may not be created during the client interaction.
    interacted_at = models.DateTimeField(default=timezone.now, db_index=True)
    is_submitted = models.BooleanField(default=False)
    location = models.ForeignKey(Location, on_delete=models.CASCADE, null=True, blank=True, related_name="notes")
    private_details = models.TextField(blank=True)
    provided_services = models.ManyToManyField(ServiceRequest, blank=True, related_name="provided_notes")
    public_details = models.TextField(blank=True)
    purpose = models.CharField(max_length=100, null=True, blank=True)
    requested_services = models.ManyToManyField(ServiceRequest, blank=True, related_name="requested_notes")
    team = TextChoicesField(SelahTeamEnum, null=True, blank=True)

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)

    objects = models.Manager()

    events: models.QuerySet["Events"]

    # Type hints for permission annotations
    _private_details: Optional[str]

    def __str__(self) -> str:
        return self.purpose or str(self.id)

    def revert_action(self, action: str, diff: Dict[str, Any], *args: Any, **kwargs: Any) -> None:
        match action:
            case "update":
                for field, changes in diff.items():
                    setattr(self, field, changes[0])

                self.save()
            case _:
                raise Exception(f"Action {action} is not revertable")

    class Meta:
        permissions = permission_enums_to_django_meta_permissions([PrivateDetailsPermissions])
        ordering = ["-interacted_at"]


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
    content_object: models.ForeignKey = models.ForeignKey(Note, on_delete=models.CASCADE)


class NoteGroupObjectPermission(GroupObjectPermissionBase):
    content_object: models.ForeignKey = models.ForeignKey(Note, on_delete=models.CASCADE)


class ServiceRequestUserObjectPermission(UserObjectPermissionBase):
    content_object: models.ForeignKey = models.ForeignKey(ServiceRequest, on_delete=models.CASCADE)


class ServiceRequestGroupObjectPermission(GroupObjectPermissionBase):
    content_object: models.ForeignKey = models.ForeignKey(ServiceRequest, on_delete=models.CASCADE)


# Data Import
class NoteDataImport(models.Model):
    """
    Model to track a note import job.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    imported_at = models.DateTimeField(auto_now_add=True)
    source_file = models.CharField(max_length=255)
    imported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    notes = models.TextField(blank=True, default="")

    def __str__(self) -> str:
        return f"Note Import {self.id} from {self.source_file} at {self.imported_at}"


class NoteImportRecord(models.Model):
    """
    Model to record each imported row (i.e. note) for a given note import job.
    Stores the original CSV row (raw_data), the original CSV id (source_id),
    and, if successfully imported, a link to the Note created via GraphQL.
    """

    import_job = models.ForeignKey(NoteDataImport, on_delete=models.CASCADE, related_name="records")
    source_id = models.CharField(max_length=255)
    source_name = models.CharField(max_length=255)
    note = models.ForeignKey(Note, on_delete=models.SET_NULL, null=True, blank=True)
    raw_data = models.JSONField()
    success = models.BooleanField(default=False)
    error_message = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["import_job", "success", "source_name", "source_id"]),
        ]

    def __str__(self) -> str:
        status = "Success" if self.success else "Failed"
        return f"Note Import Record {self.source_id} ({status})"
