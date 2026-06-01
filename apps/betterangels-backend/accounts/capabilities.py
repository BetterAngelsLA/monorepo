import strawberry
from django.db.models import Exists, OuterRef

from .models import PermissionGroup, User


@strawberry.type
class AccountsCapabilities:
    can_access_portal: bool
    can_manage_members: bool
    can_view_members: bool

    @classmethod
    def get_annotations(cls, user: User) -> dict:
        """Return DB-level Exists annotations for accounts capabilities."""

        def _has_perm(*codenames: str) -> Exists:
            return Exists(
                PermissionGroup.objects.filter(
                    organization=OuterRef("pk"),
                    group__user=user,
                    group__permissions__codename__in=codenames,
                    group__permissions__content_type__app_label="organizations",
                )
            )

        return {
            "_can_access_portal": _has_perm("access_org_portal"),
            "_can_manage_members": _has_perm("add_org_member", "remove_org_member"),
            "_can_view_members": _has_perm("view_org_members"),
        }

    @classmethod
    def from_instance(cls, instance: object) -> "AccountsCapabilities":
        return cls(
            can_access_portal=getattr(instance, "_can_access_portal", False),
            can_manage_members=getattr(instance, "_can_manage_members", False),
            can_view_members=getattr(instance, "_can_view_members", False),
        )
