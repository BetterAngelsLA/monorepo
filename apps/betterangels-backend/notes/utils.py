from typing import Optional, Union

from accounts.groups import GroupTemplateNames
from accounts.models import PermissionGroup
from django.contrib.auth.models import AbstractBaseUser, AnonymousUser


def get_user_permission_group(
    user: Union[AbstractBaseUser, AnonymousUser]
) -> Optional[PermissionGroup]:
    # WARNING: Temporary workaround for organization selection
    # TODO: Update once organization selection is implemented. Currently selects
    # the first organization with a default Caseworker role for the user.
    return (
        PermissionGroup.objects.select_related("organization", "group")
        .filter(
            organization__users=user,
            name=GroupTemplateNames.CASEWORKER,
        )
        .first()
    )
