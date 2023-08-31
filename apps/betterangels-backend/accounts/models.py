from typing import List

from django.contrib.auth.models import AbstractBaseUser
from django.db import models

from .managers import UserManager


class User(AbstractBaseUser):
    email = models.EmailField(unique=True)
    is_staff = models.BooleanField()
    is_active = models.BooleanField()
    is_superuser = models.BooleanField()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: List[str] = []

    objects = UserManager()

    def __str__(self: "User") -> str:
        return self.email
