from django.contrib.auth.models import AbstractUser, PermissionsMixin
from django.db import models

from .managers import BAUserManager


class BAUser(AbstractUser, PermissionsMixin):
    pass
    email = models.EmailField(("email address"), unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects: BAUserManager["BAUser"] = BAUserManager()

    def __str__(self):
        return self.username
