from accounts.models import User
from django.db import models
from guardian.models import GroupObjectPermissionBase, UserObjectPermissionBase


# TODO: Figure out why User/Group Perms are failing type checks
# https://github.com/typeddjango/django-stubs/issues/1354
class Note(models.Model):  # type: ignore[django-manager-missing]
    title = models.CharField(max_length=100)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notes")

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
