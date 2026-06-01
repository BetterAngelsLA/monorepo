import strawberry
from accounts.models import PermissionGroup, User
from django.db.models import Exists, OuterRef


@strawberry.type
class ReportsCapabilities:
    can_view_reports: bool

    @classmethod
    def get_annotations(cls, user: User) -> dict:
        """Return DB-level Exists annotations for reports capabilities."""
        return {
            "_can_view_reports": Exists(
                PermissionGroup.objects.filter(
                    organization=OuterRef("pk"),
                    group__user=user,
                    group__permissions__codename="view_reports",
                    group__permissions__content_type__app_label="reports",
                )
            ),
        }

    @classmethod
    def from_instance(cls, instance: object) -> "ReportsCapabilities":
        return cls(
            can_view_reports=getattr(instance, "_can_view_reports", False),
        )
