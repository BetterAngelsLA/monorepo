from accounts.models import User
from django.db import models
from guardian.models import GroupObjectPermissionBase, UserObjectPermissionBase
from organizations.models import Organization


class PrivateNoteDetail(models.Model):
    content = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    privatenotedetailuserobjectpermission_set: models.QuerySet["PrivateNoteDetail"]
    privatenotedetailgroupobjectpermission_set: models.QuerySet["PrivateNoteDetail"]

    def __str__(self) -> str:
        return f"Private note for {self.note.title}"


class Note(models.Model):
    title = models.CharField(max_length=100)
    body = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notes")
    private_details = models.OneToOneField(
        PrivateNoteDetail,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="note",
    )

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    noteuserobjectpermission_set: models.QuerySet["Note"]
    notegroupobjectpermission_set: models.QuerySet["Note"]

    def __str__(self) -> str:
        return self.body[:50]


class NoteUserObjectPermission(UserObjectPermissionBase):
    content_object = models.ForeignKey(Note, on_delete=models.CASCADE)


class NoteGroupObjectPermission(GroupObjectPermissionBase):
    content_object = models.ForeignKey(Note, on_delete=models.CASCADE)


class PrivateNoteDetailUserObjectPermission(UserObjectPermissionBase):
    content_object = models.ForeignKey(PrivateNoteDetail, on_delete=models.CASCADE)


class PrivateNoteDetailGroupObjectPermission(GroupObjectPermissionBase):
    content_object = models.ForeignKey(PrivateNoteDetail, on_delete=models.CASCADE)
