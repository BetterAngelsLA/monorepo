"""Global Shelter Operator — the global Role tier carries the shelter permissions.

Teardown (ADR 0001 §4 phase 5): GSO authority is the **global Role** held in
``user.groups`` — not a legacy ``PermissionGroup``, which ``backfill_global_role_members``
moves members off of and then deletes.  Every assertion here checks the Role group's
permission set, the same ground the pre-teardown PermissionGroup suite covered.
"""

from accounts.models import Role, User
from accounts.services import role_assign, sync_roles
from django.contrib.auth.models import Permission
from django.test import TestCase
from model_bakery import baker
from shelters.groups import GLOBAL_SHELTER_OPERATOR_ROLE


class GlobalShelterOperatorTierTestCase(TestCase):
    def setUp(self) -> None:
        sync_roles()
        self.role = Role.objects.get(name=GLOBAL_SHELTER_OPERATOR_ROLE.name)

    def _role_codenames(self, model: str) -> set[str]:
        return set(
            self.role.permissions.filter(
                content_type__app_label="shelters",
                content_type__model=model,
            ).values_list("codename", flat=True)
        )

    def _all_codenames(self, model: str) -> set[str]:
        return set(
            Permission.objects.filter(
                content_type__app_label="shelters",
                content_type__model=model,
            ).values_list("codename", flat=True)
        )

    def test_role_gets_every_schedule_permission(self) -> None:
        self.assertSetEqual(self._role_codenames("schedule"), self._all_codenames("schedule"))

    def test_role_gets_every_availability_permission(self) -> None:
        self.assertSetEqual(self._role_codenames("shelteravailability"), self._all_codenames("shelteravailability"))

    def test_role_gets_view_private_shelter(self) -> None:
        user = baker.make(User)
        role_assign(user=user, role=self.role)

        self.assertIn("shelters.view_private_shelter", user.get_all_permissions())

    def test_member_gains_shelters_admin_access(self) -> None:
        user = baker.make(User, is_staff=True)
        role_assign(user=user, role=self.role)

        self.assertIn("shelters.view_shelter", user.get_all_permissions())
        self.assertIn("shelters.change_shelter", user.get_all_permissions())
        self.assertTrue(user.has_module_perms("shelters"))
