from typing import List

import strawberry
from accounts.models import PermissionGroup, User
from django.db.models import Exists, OuterRef

from .permissions import ShelterPermissions


@strawberry.type
class SheltersCapabilities:
    granted: List[ShelterPermissions]

    @classmethod
    def get_annotations(cls, user: User) -> dict:
        """Return DB-level Exists annotations for shelters capabilities."""
        annotations = {}
        for perm in ShelterPermissions:
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
    def from_instance(cls, instance: object) -> "SheltersCapabilities":
        granted = [perm for perm in ShelterPermissions if getattr(instance, f"_perm_{perm.name}", False)]
        return cls(granted=granted)
