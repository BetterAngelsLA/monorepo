from typing import Any, Tuple, Type

import strawberry
from django.db.models import TextChoices
from strawberry_django.auth.utils import get_current_user


def permission_enums_to_django_meta_permissions(
    permission_enums: list[Type[TextChoices]],
) -> Tuple[Tuple[str, str], ...]:
    """
    Converts a list of TextChoices permissions mappings to the format required for Django's Meta
    class permissions. This function extracts the permission codename and its verbose
    name from each enum in the list.

    Args:
        permission_enums (List[Type[TextChoices]]): A list of TextChoices instances mapping permissions to
        their descriptions.

    Returns:
        Tuple[Tuple[str, str], ...]: A tuple suitable for Django's Meta.permissions.
    """
    permissions: list[Tuple[str, str]] = []
    for permission_enum in permission_enums:
        permissions.extend((perm.value.split(".")[-1], perm.label) for perm in permission_enum)
    return tuple(permissions)


class IsAuthenticated(strawberry.BasePermission):
    message = "You must be logged in to perform this action."

    def has_permission(self, source: Any, info: strawberry.Info, **kwargs: Any) -> bool:
        user = get_current_user(info)
        if user is None or not user.is_authenticated or not user.is_active:
            return False

        return True
