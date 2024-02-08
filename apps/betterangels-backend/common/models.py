from django.db import models
from django.db.models import ForeignKey
from guardian.models import GroupObjectPermissionBase, UserObjectPermissionBase


class SimpleModel(models.Model):
    name = models.CharField(max_length=255)
    objects = models.Manager()

    simplemodeluserobjectpermission_set: models.QuerySet["SimpleModel"]
    simplemodelgroupobjectpermission_set: models.QuerySet["SimpleModel"]


class SimpleModelUserObjectPermission(UserObjectPermissionBase):
    content_object: ForeignKey = models.ForeignKey(
        SimpleModel, on_delete=models.CASCADE
    )


class SimpleModelGroupObjectPermission(GroupObjectPermissionBase):
    content_object: ForeignKey = models.ForeignKey(
        SimpleModel, on_delete=models.CASCADE
    )
