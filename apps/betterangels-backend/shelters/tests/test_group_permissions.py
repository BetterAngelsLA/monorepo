from django.contrib.auth.models import Permission
from django.test import TestCase

from accounts.models import PermissionGroupTemplate


class ShelterGroupPermissionsTestCase(TestCase):
    def test_global_shelter_operator_has_schedule_permissions(self) -> None:
        template = PermissionGroupTemplate.objects.get(name="Global Shelter Operator")
        schedule_permissions = set(
            Permission.objects.filter(
                content_type__app_label="shelters",
                content_type__model="schedule",
            ).values_list("codename", flat=True)
        )

        self.assertSetEqual(
            set(
                template.permissions.filter(
                    content_type__app_label="shelters",
                    content_type__model="schedule",
                ).values_list("codename", flat=True)
            ),
            schedule_permissions,
        )

    def test_global_shelter_operator_has_availability_permissions(self) -> None:
        template = PermissionGroupTemplate.objects.get(name="Global Shelter Operator")
        availability_permissions = set(
            Permission.objects.filter(
                content_type__app_label="shelters",
                content_type__model="shelteravailability",
            ).values_list("codename", flat=True)
        )

        self.assertSetEqual(
            set(
                template.permissions.filter(
                    content_type__app_label="shelters",
                    content_type__model="shelteravailability",
                ).values_list("codename", flat=True)
            ),
            availability_permissions,
        )

    def test_global_shelter_operator_has_view_private_permission(self) -> None:
        template = PermissionGroupTemplate.objects.get(name="Global Shelter Operator")
        self.assertTrue(
            template.permissions.filter(
                content_type__app_label="shelters",
                codename="view_private_shelter",
            ).exists()
        )
