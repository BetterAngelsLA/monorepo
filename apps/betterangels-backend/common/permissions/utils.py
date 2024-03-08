from functools import reduce
from operator import and_, or_
from typing import List, Tuple, Type, TypeVar, Union, cast

from django.contrib.auth.models import AbstractBaseUser, AnonymousUser
from django.db.models import Exists, Model, OuterRef, Q, QuerySet, Subquery, TextChoices
from guardian.utils import get_group_obj_perms_model, get_user_obj_perms_model

T = TypeVar("T", bound=Model)


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


def get_objects_for_user(
    user: Union[AbstractBaseUser, AnonymousUser],
    perms: List[str],
    klass: QuerySet[T],
    any_perm: bool = False,
) -> QuerySet[T]:
    """
    Fetches a queryset of objects for which the user has specified permissions.
    Acts as a replacement for Django Guardian's `get_objects_for_user`, aiming
    for flexible and efficient permission checks using Django's ORM.

    Args:
        user: User for whom to retrieve objects.
        perms: Permission strings to check.
        klass: Initial queryset of model objects.
        any_perm: If True, returns objects for any permissions. Else, all.

    Returns:
        A queryset of objects with the specified permissions for the user.

    Note:
        - Dynamically builds queries for user/group permissions.
        - Requires `klass` as a correct model type queryset and `perms` to be
          model-appropriate permission codenames.
        - Custom `UserObjectPermission` and `GroupObjectPermission` models
          associate permissions with model instances, enabling granular access
          control.
    """
    if not user.is_authenticated or not perms:
        return klass.none()

    user_permissions_field = get_user_obj_perms_model(
        klass.model
    ).permission.field.related_query_name()
    group_permissions_field = get_group_obj_perms_model(
        klass.model
    ).permission.field.related_query_name()

    qs = klass
    permission_filters = []

    for perm in perms:
        perm_codename = perm.split(".")[-1]
        user_perm_query = Q(
            **{
                f"{user_permissions_field}__permission__codename": perm_codename,
                f"{user_permissions_field}__user": user,
            }
        )
        group_perm_query = Q(
            **{
                f"{group_permissions_field}__permission__codename": perm_codename,
                f"{group_permissions_field}__group__user": user,
            }
        )
        permission_filters.append(
            Exists(klass.filter(user_perm_query | group_perm_query, pk=OuterRef("pk")))
        )

    if any_perm:
        combined_condition = reduce(or_, permission_filters)
    else:
        combined_condition = reduce(and_, permission_filters)

    return cast(
        QuerySet[T],
        qs.filter(combined_condition),
    )
