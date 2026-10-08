from clients.models import ClientProfile
from common.tests.utils import GraphQLBaseTestCase
from model_bakery import baker
from accounts.models import Grant
from referrals.models import Referral
from referrals.selectors import referral_list
from referrals.services import referral_create, referral_delete, referral_update
from shelters.tests.baker_recipes import shelter_recipe


class ReferralCreateTests(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.client_profile = baker.make(ClientProfile)
        self.shelter = shelter_recipe.make(organization=self.org_1)

    def test_creates_referral_with_pending_status(self) -> None:
        referral = referral_create(
            user=self.org_1_case_manager_1,
            organization=self.org_1,
            client_profile=self.client_profile,
            shelter=self.shelter,
        )

        self.assertEqual(referral.status, Referral.Status.PENDING)
        self.assertEqual(referral.client_profile, self.client_profile)
        self.assertEqual(referral.shelter, self.shelter)
        self.assertEqual(referral.created_by, self.org_1_case_manager_1)
        self.assertEqual(referral.organization, self.org_1)

    def test_creates_referral_with_notes(self) -> None:
        referral = referral_create(
            user=self.org_1_case_manager_1,
            organization=self.org_1,
            client_profile=self.client_profile,
            shelter=self.shelter,
            notes="Client prefers bottom bunk",
        )

        self.assertEqual(referral.notes, "Client prefers bottom bunk")

    def test_authority_rides_the_role_not_per_record_rows(self) -> None:
        """No guardian rows are written any more (ADR 0001 §2.5, rule 4).

        CHANGE/DELETE now resolve through the org role: ``can_obj`` anchors on the
        row's own ``organization``, so the creating org edits it and a foreign org
        that can only *read* it (through the shelter hop) cannot.  The old
        per-record assertion (``has_perm`` against a guardian row) is replaced by
        the grant predicate the gates actually consult.
        """
        from common.permissions.selectors import can_obj

        referral = referral_create(
            user=self.org_1_case_manager_1,
            organization=self.org_1,
            client_profile=self.client_profile,
            shelter=self.shelter,
        )

        self.assertFalse(Grant.objects.filter(scope_object_type__model="referral").exists())
        self.assertTrue(can_obj(self.org_1_case_manager_1, Referral.perms.CHANGE, referral))


class ReferralUpdateTests(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.client_profile = baker.make(ClientProfile)
        self.shelter = shelter_recipe.make(organization=self.org_1)
        self.referral = referral_create(
            user=self.org_1_case_manager_1,
            organization=self.org_1,
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
        self.referral = referral_create(
            user=self.org_1_case_manager_1,
            organization=self.org_1,
            client_profile=self.client_profile,
            shelter=self.shelter,
        )

    def test_deletes_referral_and_returns_id(self) -> None:
        referral_id = self.referral.id
        deleted_id = referral_delete(referral=self.referral)

        self.assertEqual(deleted_id, referral_id)
        self.assertFalse(Referral.objects.filter(id=referral_id).exists())


class ReferralListSelectorTests(GraphQLBaseTestCase):
    """The list answers from the grant gate, not from ``created_by``.

    The old shape showed a caseworker only the referrals they personally wrote, so
    a colleague's referral to the same shelter was invisible even though they could
    act on it.  Reach is now the org role plus the shelter hop — the same authority
    the mutation gates use.
    """

    def setUp(self) -> None:
        super().setUp()
        self.client_profile = baker.make(ClientProfile)
        self.shelter = shelter_recipe.make(organization=self.org_1)

    def test_returns_referrals_the_user_may_read(self) -> None:
        mine = referral_create(
            user=self.org_1_case_manager_1,
            organization=self.org_1,
            client_profile=self.client_profile,
            shelter=self.shelter,
        )
        # Same org, written by a colleague: readable, and no longer filtered out.
        colleague = referral_create(
            user=self.org_1_case_manager_2,
            organization=self.org_1,
            client_profile=self.client_profile,
            shelter=self.shelter,
        )
        # Another org's referral, to a different shelter: not in this caller's reach.
        other_shelter = shelter_recipe.make(organization=self.org_2)
        referral_create(
            user=self.org_2_case_manager_1,
            organization=self.org_2,
            client_profile=self.client_profile,
            shelter=other_shelter,
        )

        result = referral_list(user=self.org_1_case_manager_1)

        self.assertEqual(set(result.values_list("id", flat=True)), {mine.id, colleague.id})

    def test_returns_empty_when_the_user_has_no_reach(self) -> None:
        referral_create(
            user=self.org_2_case_manager_1,
            organization=self.org_2,
            client_profile=self.client_profile,
            shelter=shelter_recipe.make(organization=self.org_2),
        )

        self.assertEqual(referral_list(user=self.org_1_case_manager_1).count(), 0)
