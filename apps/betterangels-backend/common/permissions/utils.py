from typing import Any, Tuple, Type

import strawberry
from django.db.models import TextChoices
from strawberry_django.auth.utils import get_current_user


def permission_enum_to_django_meta_permissions(
    permission_enum: Type[TextChoices],
) -> Tuple[Tuple[str, str], ...]:
    """
    Converts a TextChoices permissions mapping to the format required for Django's Meta
    class permissions. This function extracts the permission codename and its verbose
    name.

    Args:
        permissions_mapping (TextChoices): A TextChoices instance mapping permissions to
        their descriptions.

    Returns:
        A tuple suitable for Django's Meta.permissions.
    """
    return tuple((perm.value.split(".")[-1], perm.label) for perm in permission_enum)


class IsAuthenticated(strawberry.BasePermission):
    message = "You must be logged in to perform this action."

    def has_permission(self, source: Any, info: strawberry.Info, **kwargs: Any) -> bool:
        user = get_current_user(info)
        if user is None or not user.is_authenticated or not user.is_active:
            return False

        return True
