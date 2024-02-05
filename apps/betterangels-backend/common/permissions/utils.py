from functools import reduce
from operator import and_, or_
from typing import List, TypeVar, Union, cast

from django.contrib.auth.models import AbstractBaseUser, AnonymousUser
from django.db.models import Exists, Model, OuterRef, Q, QuerySet

T = TypeVar("T", bound=Model)


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

    model_name = klass.model._meta.model_name
    user_permissions_field = f"{model_name}userobjectpermission"
    group_permissions_field = f"{model_name}groupobjectpermission"

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
        permission_filters.append(user_perm_query | group_perm_query)

    if any_perm:
        combined_condition = reduce(or_, permission_filters)
    else:
        combined_condition = reduce(and_, permission_filters)

    permission_query = Exists(klass.filter(combined_condition, pk=OuterRef("pk")))

    return cast(
        QuerySet[T],
        qs.annotate(has_permission=permission_query).filter(has_permission=True),
    )
