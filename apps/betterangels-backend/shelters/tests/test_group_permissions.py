from django.contrib.auth.models import Permission
from django.test import TestCase

from accounts.models import PermissionGroupTemplate


class ShelterGroupPermissionsTestCase(TestCase):
    def test_shelter_data_entry_template_has_schedule_permissions(self) -> None:
        template = PermissionGroupTemplate.objects.get(name="Shelter Data Entry")
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

    def test_shelter_administration_template_has_schedule_permissions(self) -> None:
        template = PermissionGroupTemplate.objects.get(name="Shelter Administration")
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

    def test_shelter_data_entry_template_has_availability_permissions(self) -> None:
        template = PermissionGroupTemplate.objects.get(name="Shelter Data Entry")
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

    def test_shelter_administration_template_has_availability_permissions(self) -> None:
        template = PermissionGroupTemplate.objects.get(name="Shelter Administration")
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
