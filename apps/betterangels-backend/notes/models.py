from accounts.models import User
from django.db import models
from guardian.models import GroupObjectPermissionBase, UserObjectPermissionBase
from organizations.models import Organization


class Note(models.Model):
    title = models.CharField(max_length=100)
    body = models.TextField()

    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notes")

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
