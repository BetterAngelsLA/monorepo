from accounts.selectors import resolve_permission_group
from clients.models import ClientProfile
from common.tests.utils import GraphQLBaseTestCase
from model_bakery import baker
from referrals.models import Referral
from referrals.selectors import referral_list
from referrals.services import referral_create, referral_delete, referral_update
from shelters.tests.baker_recipes import shelter_recipe


class ReferralCreateTests(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.client_profile = baker.make(ClientProfile)
        self.shelter = shelter_recipe.make(organization=self.org_1)
        self.permission_group = resolve_permission_group(self.org_1_case_manager_1)

    def test_creates_referral_with_pending_status(self) -> None:
        referral = referral_create(
            user=self.org_1_case_manager_1,
            permission_group=self.permission_group,
            client_profile=self.client_profile,
            shelter=self.shelter,
        )

        self.assertEqual(referral.status, Referral.Status.PENDING)
        self.assertEqual(referral.client_profile, self.client_profile)
        self.assertEqual(referral.shelter, self.shelter)
        self.assertEqual(referral.created_by, self.org_1_case_manager_1)
        self.assertEqual(referral.organization, self.permission_group.organization)

    def test_creates_referral_with_notes(self) -> None:
        referral = referral_create(
            user=self.org_1_case_manager_1,
            permission_group=self.permission_group,
            client_profile=self.client_profile,
            shelter=self.shelter,
            notes="Client prefers bottom bunk",
        )

        self.assertEqual(referral.notes, "Client prefers bottom bunk")

    def test_assigns_change_and_delete_permissions(self) -> None:
        referral = referral_create(
            user=self.org_1_case_manager_1,
            permission_group=self.permission_group,
            client_profile=self.client_profile,
            shelter=self.shelter,
        )

        self.assertTrue(self.org_1_case_manager_1.has_perm("referrals.change_referral", referral))
        self.assertTrue(self.org_1_case_manager_1.has_perm("referrals.delete_referral", referral))


class ReferralUpdateTests(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.client_profile = baker.make(ClientProfile)
        self.shelter = shelter_recipe.make(organization=self.org_1)
        self.permission_group = resolve_permission_group(self.org_1_case_manager_1)
        self.referral = referral_create(
            user=self.org_1_case_manager_1,
            permission_group=self.permission_group,
            client_profile=self.client_profile,
            shelter=self.shelter,
        )

    def test_updates_status(self) -> None:
        updated = referral_update(
            referral=self.referral,
            data={"status": Referral.Status.ACCEPTED},
        )

        self.assertEqual(updated.status, Referral.Status.ACCEPTED)

    def test_updates_notes(self) -> None:
        updated = referral_update(
            referral=self.referral,
            data={"notes": "Accepted by shelter staff"},
        )

        self.assertEqual(updated.notes, "Accepted by shelter staff")

    def test_ignores_non_allowlisted_fields(self) -> None:
        other_user = self.org_1_case_manager_2
        referral_update(
            referral=self.referral,
            data={"created_by": other_user, "organization": None},
        )

        self.referral.refresh_from_db()
        self.assertEqual(self.referral.created_by, self.org_1_case_manager_1)
        self.assertIsNotNone(self.referral.organization)

    def test_ignores_id_field(self) -> None:
        original_id = self.referral.id
        referral_update(
            referral=self.referral,
            data={"id": 99999, "status": Referral.Status.DECLINED},
        )

        self.referral.refresh_from_db()
        self.assertEqual(self.referral.id, original_id)
        self.assertEqual(self.referral.status, Referral.Status.DECLINED)


class ReferralDeleteTests(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.client_profile = baker.make(ClientProfile)
        self.shelter = shelter_recipe.make(organization=self.org_1)
        self.permission_group = resolve_permission_group(self.org_1_case_manager_1)
        self.referral = referral_create(
            user=self.org_1_case_manager_1,
            permission_group=self.permission_group,
            client_profile=self.client_profile,
            shelter=self.shelter,
        )

    def test_deletes_referral_and_returns_id(self) -> None:
        referral_id = self.referral.id
        deleted_id = referral_delete(referral=self.referral)

        self.assertEqual(deleted_id, referral_id)
        self.assertFalse(Referral.objects.filter(id=referral_id).exists())


class ReferralListSelectorTests(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.client_profile = baker.make(ClientProfile)
        self.shelter = shelter_recipe.make(organization=self.org_1)
        self.permission_group_1 = resolve_permission_group(self.org_1_case_manager_1)
        self.permission_group_2 = resolve_permission_group(self.org_2_case_manager_1)

    def test_returns_only_referrals_created_by_user(self) -> None:
        referral_create(
            user=self.org_1_case_manager_1,
            permission_group=self.permission_group_1,
            client_profile=self.client_profile,
            shelter=self.shelter,
        )
        referral_create(
            user=self.org_2_case_manager_1,
            permission_group=self.permission_group_2,
            client_profile=self.client_profile,
            shelter=self.shelter,
        )

        result = referral_list(user=self.org_1_case_manager_1)

        self.assertEqual(result.count(), 1)
        first = result.first()
        assert first is not None
        self.assertEqual(first.created_by, self.org_1_case_manager_1)

    def test_returns_empty_when_user_has_no_referrals(self) -> None:
        result = referral_list(user=self.org_1_case_manager_1)
        self.assertEqual(result.count(), 0)
