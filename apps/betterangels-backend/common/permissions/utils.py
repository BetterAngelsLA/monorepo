from typing import Tuple, Type

from django.db.models import TextChoices


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
