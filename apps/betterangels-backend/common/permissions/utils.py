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
    if not user.is_authenticated:
        return klass.none()

    model_name = klass.model._meta.model_name
    user_permissions_field = f"{model_name}userobjectpermission"
    group_permissions_field = f"{model_name}groupobjectpermission"

    qs = klass
    permission_filters = []

    for perm in perms:
        perm_codename = perm.split(".")[-1]
        has_required_perms = (
            f"has_perm_{perm_codename}"  # Use perm name in the annotation
        )
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
        permission_query = Exists(
            klass.filter(
                user_perm_query | group_perm_query,
                pk=OuterRef("pk"),
            )
        )
        qs = qs.annotate(**{has_required_perms: permission_query})
        permission_filters.append(Q(**{has_required_perms: True}))

    # Combine permission filters using reduce based on any_perm flag
    combined_permission_filter = reduce(or_ if any_perm else and_, permission_filters)

    return qs.filter(combined_permission_filter)
