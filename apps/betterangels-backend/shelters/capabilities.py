import strawberry
from accounts.models import PermissionGroup, User
from django.db.models import Exists, OuterRef


@strawberry.type
class SheltersCapabilities:
    can_manage_shelters: bool
    can_view_shelters: bool

    @classmethod
    def get_annotations(cls, user: User) -> dict:
        """Return DB-level Exists annotations for shelters capabilities."""

        def _has_perm(*codenames: str) -> Exists:
            return Exists(
                PermissionGroup.objects.filter(
                    organization=OuterRef("pk"),
                    group__user=user,
                    group__permissions__codename__in=codenames,
                    group__permissions__content_type__app_label="shelters",
                )
            )

        return {
            "_can_manage_shelters": _has_perm("add_shelter", "change_shelter", "delete_shelter"),
            "_can_view_shelters": _has_perm("view_shelter"),
        }

    @classmethod
    def from_instance(cls, instance: object) -> "SheltersCapabilities":
        return cls(
            can_manage_shelters=getattr(instance, "_can_manage_shelters", False),
            can_view_shelters=getattr(instance, "_can_view_shelters", False),
        )
