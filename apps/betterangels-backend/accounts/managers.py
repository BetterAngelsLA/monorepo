import uuid
from typing import TYPE_CHECKING, Any, Optional

from django.contrib.auth.models import UserManager as DjangoUserManager
from django.core.exceptions import ObjectDoesNotExist

if TYPE_CHECKING:
    from .models import User


class UserManager(DjangoUserManager):
    def create_client(self, **extra_fields: Any) -> "User":
        client: "User" = self.create_user(username=str(uuid.uuid4()), **extra_fields)  # type: ignore[assignment]
        client.set_unusable_password()

        return client

    def find_by_email(self, email: str) -> Optional["User"]:
        try:
            user: "User" = self.get(email__iexact=email)  # type: ignore[assignment]

            return user

        except ObjectDoesNotExist:
            return None
