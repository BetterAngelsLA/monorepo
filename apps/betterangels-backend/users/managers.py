from typing import Any

from django.contrib.auth.base_user import BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _

from .models import CustomUser


class CustomerUserQuerySet(models.QuerySet):
    """
    Custom user model manager where email is the unique identifiers
    for authentication instead of usernames.
    """

    def create_user(
        self, email: str = "", password: str = "", **extra_fields: Any
    ) -> CustomUser:
        """
        Create and save a user with the given email and password.
        """
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(
        self, email: str, password: str, **extra_fields: dict[str, Any | bool]
    ):
        """
        Create and save a SuperUser with the given email and password.
        """
        import pdb

        pdb.set_trace()

        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser must have is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser must have is_superuser=True."))
        return self.create_user(email, password, **extra_fields)


class CustomUserManager(BaseUserManager):
    def get_queryset(self) -> CustomerUserQuerySet:
        return CustomerUserQuerySet(self.model)

    def create_user(self, email: str = "", password: str = "", **extra_fields):
        if not email:
            raise ValueError(_("The Email must be set"))
        email = self.normalize_email(email)
        return self.get_queryset().create_user(email, password, **extra_fields)

    def create_superuser(self, email: str = "", password: str = "", **extra_fields):
        if not email:
            raise ValueError(_("The Email must be set"))
        email = self.normalize_email(email)
        return self.get_queryset().create_superuser(email, password, **extra_fields)
