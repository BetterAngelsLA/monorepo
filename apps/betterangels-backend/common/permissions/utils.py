from typing import Any, Sequence, Tuple, Type

import strawberry
from common.errors import APIErrorCodes
from django.db.models import TextChoices
from django.utils.encoding import force_str
from graphql import GraphQLError
from strawberry_django.auth.utils import get_current_user


def permission_enums_to_django_meta_permissions(
    permission_enums: Sequence[Type[TextChoices]],
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
        permissions.extend((str(perm).rsplit(".", 1)[-1], force_str(perm.label)) for perm in permission_enum)
    return tuple(permissions)


class IsAuthenticated(strawberry.BasePermission):
    message = "You must be logged in to perform this action."

    def has_permission(self, source: Any, info: strawberry.Info, **kwargs: Any) -> bool:
        user = get_current_user(info)
        if user is None or not user.is_authenticated or not user.is_active:
            raise GraphQLError(
                self.message,
                extensions={
                    "code": APIErrorCodes.UNAUTHENTICATED,
                    "http": {"status": 401},
                },
            )

        return True
