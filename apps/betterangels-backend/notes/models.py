from django.db import models
from typing import TYPE_CHECKING
from accounts.models import User
from guardian.models import GroupObjectPermissionBase, UserObjectPermissionBase


if TYPE_CHECKING:
    from django.db.models.query import QuerySet


class Note(models.Model):
    title = models.CharField(max_length=100)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notes")

    noteuserobjectpermission_set: "QuerySet[NoteUserObjectPermission]"
    notegroupobjectpermission_set: "QuerySet[NoteGroupObjectPermission]"

    def __str__(self) -> str:
        return self.body[:50]


class NoteUserObjectPermission(UserObjectPermissionBase):
    content_object = models.ForeignKey(
        Note, on_delete=models.CASCADE, related_name="user_object_permissions"
    )


class NoteGroupObjectPermission(GroupObjectPermissionBase):
    content_object = models.ForeignKey(
        Note, on_delete=models.CASCADE, related_name="group_object_permissions"
    )
