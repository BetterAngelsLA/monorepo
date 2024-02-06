from django.db import models
from guardian.models import GroupObjectPermissionBase, UserObjectPermissionBase


# TODO: Figure out why User/Group Perms are failing type checks
# https://github.com/typeddjango/django-stubs/issues/1354
class SimpleModel(models.Model):
    name = models.CharField(max_length=255)
    objects = models.Manager()


class SimpleModelUserObjectPermission(UserObjectPermissionBase):
    content_object = models.ForeignKey(SimpleModel, on_delete=models.CASCADE)  # type: ignore


class SimpleModelGroupObjectPermission(GroupObjectPermissionBase):
    content_object = models.ForeignKey(SimpleModel, on_delete=models.CASCADE)  # type: ignore
