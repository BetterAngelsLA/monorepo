from typing import List

import strawberry
from django.db.models import Exists, OuterRef

from .models import PermissionGroup, User
from .permissions import UserOrganizationPermissions

AccountsPermission = strawberry.enum(UserOrganizationPermissions, name="AccountsPermission")


@strawberry.type
class AccountsCapabilities:
    granted: List[AccountsPermission]

    @classmethod
    def get_annotations(cls, user: User) -> dict:
        """Return DB-level Exists annotations for accounts capabilities."""
        annotations = {}
        for perm in UserOrganizationPermissions:
            app_label, codename = perm.value.split(".")
            annotations[f"_perm_{perm.name}"] = Exists(
                PermissionGroup.objects.filter(
                    organization=OuterRef("pk"),
                    group__user=user,
                    group__permissions__codename=codename,
                    group__permissions__content_type__app_label=app_label,
                )
            )
        return annotations

    @classmethod
    def from_instance(cls, instance: object) -> "AccountsCapabilities":
        granted = [perm for perm in UserOrganizationPermissions if getattr(instance, f"_perm_{perm.name}", False)]
        return cls(granted=granted)
