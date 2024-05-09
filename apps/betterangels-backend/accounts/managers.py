import uuid
from typing import TYPE_CHECKING, Any, Optional

from django.contrib.auth.base_user import BaseUserManager
from django.utils.translation import gettext_lazy as _

if TYPE_CHECKING:
    from .models import User


class UserManager(BaseUserManager["User"]):
    def create_user(self, email: str, password: str = "", **extra_fields: Any) -> "User":
        if not email:
            raise ValueError("The Email field must be set")
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_client(self, email: str, **extra_fields: Any) -> "User":
        random_id = uuid.uuid4()
        email = email or self.normalize_email(f"client_{random_id}@example.com")
        client = self.create_user(email, **extra_fields)
        client.set_unusable_password()
        return client

    def create_superuser(self, email: str, password: str = "", **extra_fields: Any) -> "User":
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser must have is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser must have is_superuser=True."))
        return self.create_user(email, password, **extra_fields)

    def find_by_email(self, email: str) -> Optional["User"]:
        try:
            return self.get(email__iexact=email)
        except self.model.DoesNotExist:
            return None
