import uuid
from typing import TYPE_CHECKING, Any, Optional

from django.contrib.auth.base_user import BaseUserManager
from django.utils.translation import gettext_lazy as _

if TYPE_CHECKING:
    from .models import User


class UserManager(BaseUserManager["User"]):
    def _create_user(self, username: str, email: Optional[str], password: str, **extra_fields: Any) -> "User":
        """
        Create and save a user with the given username, email, and password.
        """
        if not username:
            raise ValueError("The given username must be set")

        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, username: str, email: str | None = None, password: str = "", **extra_fields: Any) -> "User":
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(username, email, password, **extra_fields)

    def create_superuser(self, username: str, email: str, password: str = "", **extra_fields: Any) -> "User":
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser must have is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser must have is_superuser=True."))

        return self._create_user(username, email, password, **extra_fields)

    def create_client(self, **extra_fields: Any) -> "User":
        client: "User" = self.create_user(username=str(uuid.uuid4()), **extra_fields)
        client.set_unusable_password()

        return client

    def find_by_email(self, email: str) -> Optional["User"]:
        try:
            return self.get(email__iexact=email)

        except self.model.DoesNotExist:
            return None
