from django.contrib.auth.models import AbstractUser, PermissionsMixin
from django.db import models

from .managers import BetterAngelsUserManager


class BetterAngelsUser(AbstractUser, PermissionsMixin):
    email = models.EmailField(("email address"), unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects: BetterAngelsUserManager["BetterAngelsUser"] = BetterAngelsUserManager()

    def __str__(self):
        return self.username
