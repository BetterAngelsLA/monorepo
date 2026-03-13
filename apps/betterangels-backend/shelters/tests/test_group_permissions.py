from django.contrib.auth.models import Group, Permission
from django.test import TestCase


class ShelterGroupPermissionsTestCase(TestCase):
    def test_shelter_data_entry_group_has_schedule_permissions(self) -> None:
        group = Group.objects.get(name="Shelter Data Entry")
        schedule_permissions = set(
            Permission.objects.filter(content_type__app_label="shelters", content_type__model="schedule").values_list(
                "codename", flat=True
            )
        )

        self.assertSetEqual(
            set(
                group.permissions.filter(
                    content_type__app_label="shelters", content_type__model="schedule"
                ).values_list("codename", flat=True)
            ),
            schedule_permissions,
        )

    def test_shelter_administration_group_has_schedule_permissions(self) -> None:
        group = Group.objects.get(name="Shelter Administration")
        schedule_permissions = set(
            Permission.objects.filter(content_type__app_label="shelters", content_type__model="schedule").values_list(
                "codename", flat=True
            )
        )

        self.assertSetEqual(
            set(
                group.permissions.filter(
                    content_type__app_label="shelters", content_type__model="schedule"
                ).values_list("codename", flat=True)
            ),
            schedule_permissions,
        )
