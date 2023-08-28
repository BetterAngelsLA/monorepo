from django.contrib.auth.models import AbstractUser, PermissionsMixin
from django.db import models

from .managers import UserManager


class User(AbstractUser, PermissionsMixin):
    email = models.EmailField(unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects: UserManager["User"] = UserManager()

    def __str__(self):
        return self.email
