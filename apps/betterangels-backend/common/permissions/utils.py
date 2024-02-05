from functools import reduce
from operator import and_, or_
from typing import List, TypeVar, Union

from django.contrib.auth.models import AbstractBaseUser, AnonymousUser
from django.db.models import Exists, Model, OuterRef, Q, QuerySet

T = TypeVar("T", bound=Model)


def get_objects_for_user(
    user: Union[AbstractBaseUser, AnonymousUser],
    perms: List[str],
    klass: QuerySet[T],
    any_perm: bool = True,
) -> QuerySet[T]:
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
        # For any_perm=True, combine all permission conditions using OR
        combined_condition = reduce(or_, permission_filters)
    else:
        # For any_perm=False, combine all permission conditions using AND
        combined_condition = reduce(and_, permission_filters)

    # Check permissions using Exists for each condition and filter accordingly
    permission_query = Exists(klass.filter(combined_condition, pk=OuterRef("pk")))
    qs = klass.annotate(has_permission=permission_query).filter(has_permission=True)

    return qs
