"""API-level authorization for referrals — the grant predicate, end to end.

Referrals are grant-only: ``visible()``/``require_can()`` read the scoped
``Caseworker`` Grant, not Django's global ``has_perm``.  These tests exercise
the GraphQL surface because that is where a mistake is invisible: the old
shape (model-level permission + org-membership bound) let a Caseworker at one
org read and update another org's referral as long as they were *a member*
there.  The adversary tests below are the regression guard for exactly that.

``ffReferrals`` is deliberately NOT authority here: it is a UI rollout switch.
The capability decides API access; the flag decides whether the tab is shown.
"""

from typing import Any, Dict, cast

from django.contrib.auth.models import Permission
from model_bakery import baker
from waffle import get_waffle_flag_model

from accounts.models import User
from accounts.role_manager import OrgRoleManager
from clients.models import ClientProfile
from common.tests.utils import GraphQLBaseTestCase
from notes.groups import CASEWORKER
from referrals.models import Referral
from shelters.tests.baker_recipes import shelter_recipe

LIST_QUERY = "query { referrals { results { id } } }"
SINGLE_QUERY = "query($pk: ID!) { referral(pk: $pk) { id } }"
CREATE_MUTATION = """
mutation($data: CreateReferralInput!) {
  createReferral(data: $data) {
    __typename
    ... on ReferralType { id }
    ... on OperationInfo { messages { kind field message } }
  }
}
"""
UPDATE_MUTATION = """
mutation($data: UpdateReferralInput!) {
  updateReferral(data: $data) {
    __typename
    ... on ReferralType { id status }
    ... on OperationInfo { messages { kind field message } }
  }
}
"""
DELETE_MUTATION = """
mutation($data: DeleteDjangoObjectInput!) {
  deleteReferral(data: $data) {
    __typename
    ... on DeletedObjectType { id }
    ... on OperationInfo { messages { kind field message } }
  }
}
"""


class ReferralApiTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.client_profile = baker.make(ClientProfile)
        self.shelter = shelter_recipe.make(organization=self.org_1)
        self.referral_1 = Referral.objects.create(
            client_profile=self.client_profile,
            shelter=self.shelter,
            created_by=self.org_1_case_manager_1,
            organization=self.org_1,
        )
        self.referral_2 = Referral.objects.create(
            client_profile=self.client_profile,
            shelter=self.shelter,
            created_by=self.org_2_case_manager_1,
            organization=self.org_2,
        )

        self.graphql_client.force_login(self.org_1_case_manager_1)

    def _results(self, payload: Dict[str, Any]) -> list[Dict[str, Any]]:
        return cast(list[Dict[str, Any]], payload["data"]["referrals"]["results"])

    def _create_data(self, organization_id: object, **overrides: object) -> Dict[str, Any]:
        data: Dict[str, Any] = {
            "organizationId": str(organization_id),
            "clientProfile": str(self.client_profile.pk),
            "shelter": str(self.shelter.pk),
        }
        data.update(overrides)
        return {"data": data}

    # ── the flag is not authority ───────────────────────────────────────

    def test_the_api_ignores_ff_referrals(self) -> None:
        # A deliberate design decision: ``ffReferrals`` is a UI rollout switch,
        # not an API gate. The capability is the control, so a flag-off account
        # with the Caseworker Grant still has API access.
        flag = get_waffle_flag_model().objects.create(name="ffReferrals", everyone=False)
        flag.flush()

        payload = self.execute_graphql(LIST_QUERY)
        ids = {row["id"] for row in self._results(payload)}

        self.assertEqual(ids, {str(self.referral_1.pk)})

    # ── reads ───────────────────────────────────────────────────────────

    def test_list_is_scoped_to_the_caseworker_grant(self) -> None:
        ids = {row["id"] for row in self._results(self.execute_graphql(LIST_QUERY))}

        self.assertEqual(ids, {str(self.referral_1.pk)})

    def test_single_referral_outside_the_grant_is_denied(self) -> None:
        payload = self.execute_graphql(SINGLE_QUERY, {"pk": str(self.referral_2.pk)})

        self.assertTrue(payload.get("errors"), payload)
        # ``referral`` is non-null, so the denial nulls the whole data envelope
        # rather than returning a null field.
        self.assertIsNone(payload.get("data"))

    def test_single_referral_with_a_non_numeric_id_is_denied(self) -> None:
        payload = self.execute_graphql(SINGLE_QUERY, {"pk": "abc"})

        self.assertTrue(payload.get("errors"), payload)
        self.assertNotIn("invalid literal", str(payload))

    # ── the finding-1 adversary: org membership is not authority ────────

    def test_member_of_another_org_cannot_list_its_referrals(self) -> None:
        # Plain member of org_2 (no role, no grant there), Caseworker at org_1.
        self.org_2.add_user(self.org_1_case_manager_1)

        ids = {row["id"] for row in self._results(self.execute_graphql(LIST_QUERY))}

        self.assertEqual(ids, {str(self.referral_1.pk)})

    def test_member_of_another_org_cannot_read_its_referral(self) -> None:
        self.org_2.add_user(self.org_1_case_manager_1)

        payload = self.execute_graphql(SINGLE_QUERY, {"pk": str(self.referral_2.pk)})

        self.assertTrue(payload.get("errors"), payload)

    def test_member_of_another_org_cannot_update_its_referral(self) -> None:
        self.org_2.add_user(self.org_1_case_manager_1)

        payload = self.execute_graphql(UPDATE_MUTATION, {"data": {"id": str(self.referral_2.pk), "status": "ACCEPTED"}})

        self.assertEqual(payload["data"]["updateReferral"]["__typename"], "OperationInfo", payload)
        self.referral_2.refresh_from_db()
        self.assertEqual(self.referral_2.status, Referral.Status.PENDING)

    def test_member_of_another_org_cannot_delete_its_referral(self) -> None:
        self.org_2.add_user(self.org_1_case_manager_1)

        payload = self.execute_graphql(DELETE_MUTATION, {"data": {"id": str(self.referral_2.pk)}})

        self.assertEqual(payload["data"]["deleteReferral"]["__typename"], "OperationInfo", payload)
        self.assertTrue(Referral.objects.filter(pk=self.referral_2.pk).exists())

    # ── revocation ──────────────────────────────────────────────────────

    def test_removing_the_caseworker_role_revokes_access(self) -> None:
        # The membership → Grant mirror is the whole safety story: dropping the
        # role drops the Grant, and the next query sees empty scopes.
        OrgRoleManager(self.org_1).remove_roles(self.org_1_case_manager_1, CASEWORKER)

        list_ids = {row["id"] for row in self._results(self.execute_graphql(LIST_QUERY))}
        single = self.execute_graphql(SINGLE_QUERY, {"pk": str(self.referral_1.pk)})

        self.assertEqual(list_ids, set())
        self.assertTrue(single.get("errors"), single)

    # ── writes inside the grant ─────────────────────────────────────────

    def test_update_within_the_grant_succeeds(self) -> None:
        payload = self.execute_graphql(UPDATE_MUTATION, {"data": {"id": str(self.referral_1.pk), "status": "ACCEPTED"}})

        self.assertEqual(payload["data"]["updateReferral"]["__typename"], "ReferralType", payload)
        self.referral_1.refresh_from_db()
        self.assertEqual(self.referral_1.status, Referral.Status.ACCEPTED)

    def test_update_by_a_colleague_in_the_same_org_succeeds(self) -> None:
        # Org-tier CHANGE: every caseworker at the org may edit the org's
        # referrals — the same set the old per-record grant covered.
        self.graphql_client.force_login(self.org_1_case_manager_2)

        payload = self.execute_graphql(UPDATE_MUTATION, {"data": {"id": str(self.referral_1.pk), "status": "ACCEPTED"}})

        self.assertEqual(payload["data"]["updateReferral"]["__typename"], "ReferralType", payload)
        self.referral_1.refresh_from_db()
        self.assertEqual(self.referral_1.status, Referral.Status.ACCEPTED)

    def test_update_with_a_non_numeric_id_is_denied(self) -> None:
        payload = self.execute_graphql(UPDATE_MUTATION, {"data": {"id": "abc", "status": "ACCEPTED"}})

        self.assertEqual(payload["data"]["updateReferral"]["__typename"], "OperationInfo", payload)
        self.assertNotIn("invalid literal", str(payload))

    def test_delete_within_the_grant_succeeds(self) -> None:
        # Positive delete through the API: production delete rides the scoped
        # Role, not a guardian row, so this is the only test that proves it.
        payload = self.execute_graphql(DELETE_MUTATION, {"data": {"id": str(self.referral_1.pk)}})

        self.assertEqual(payload["data"]["deleteReferral"]["__typename"], "DeletedObjectType", payload)
        self.assertEqual(int(payload["data"]["deleteReferral"]["id"]), self.referral_1.pk)
        self.assertFalse(Referral.objects.filter(pk=self.referral_1.pk).exists())

    def test_delete_by_a_colleague_in_the_same_org_succeeds(self) -> None:
        # Org-tier DELETE: a colleague's referral is deleteable by any
        # caseworker at the org, matching the pre-cutover guardian grant that
        # was assigned to the whole org group.
        self.graphql_client.force_login(self.org_1_case_manager_2)

        payload = self.execute_graphql(DELETE_MUTATION, {"data": {"id": str(self.referral_1.pk)}})

        self.assertEqual(payload["data"]["deleteReferral"]["__typename"], "DeletedObjectType", payload)
        self.assertFalse(Referral.objects.filter(pk=self.referral_1.pk).exists())

    # ── create: the org is on the wire ──────────────────────────────────

    def test_create_uses_the_organization_id_input(self) -> None:
        payload = self.execute_graphql(CREATE_MUTATION, self._create_data(self.org_1.id))

        self.assertFalse(payload.get("errors"), payload)
        created = Referral.objects.exclude(pk__in=[self.referral_1.pk, self.referral_2.pk]).get()
        self.assertEqual(created.organization, self.org_1)
        self.assertEqual(created.created_by, self.org_1_case_manager_1)

    def test_create_accepts_a_shelter_from_another_org(self) -> None:
        # Deliberate: the referral belongs to the creating org, but the shelter
        # it points at may belong to a different one.  We do not validate the
        # shelter's org (ADR 0001 §4.1 — "own org or via shelter").
        other_shelter = shelter_recipe.make(organization=self.org_2)

        payload = self.execute_graphql(
            CREATE_MUTATION,
            self._create_data(self.org_1.id, shelter=str(other_shelter.pk)),
        )

        self.assertFalse(payload.get("errors"), payload)
        created = Referral.objects.exclude(pk__in=[self.referral_1.pk, self.referral_2.pk]).get()
        self.assertEqual(created.organization, self.org_1)
        self.assertEqual(created.shelter, other_shelter)

    def test_create_in_an_org_without_the_grant_is_denied(self) -> None:
        self.org_2.add_user(self.org_1_case_manager_1)

        payload = self.execute_graphql(CREATE_MUTATION, self._create_data(self.org_2.id))

        self.assertEqual(payload["data"]["createReferral"]["__typename"], "OperationInfo", payload)
        self.assertFalse(
            Referral.objects.filter(organization=self.org_2, created_by=self.org_1_case_manager_1).exists()
        )

    def test_create_in_an_unknown_org_is_denied(self) -> None:
        payload = self.execute_graphql(CREATE_MUTATION, self._create_data(99999999))

        self.assertEqual(payload["data"]["createReferral"]["__typename"], "OperationInfo", payload)
        self.assertEqual(Referral.objects.count(), 2)

    def test_create_without_an_organization_is_denied(self) -> None:
        # Optional for one release, but there is nothing to fall back to here:
        # no payload org and no header.  Fail closed rather than guess.
        variables = self._create_data(self.org_1.id)
        del variables["data"]["organizationId"]
        self.graphql_client.defaults.pop("HTTP_X_ORGANIZATION_ID", None)

        payload = self.execute_graphql(CREATE_MUTATION, variables)

        self.assertEqual(payload["data"]["createReferral"]["__typename"], "OperationInfo", payload)
        self.assertEqual(Referral.objects.count(), 2)

    def test_create_falls_back_to_the_header(self) -> None:
        # Compatibility for app builds that predate ``organizationId``: the
        # header names the org, and ``require_can`` authorizes it exactly as the
        # payload form does.
        variables = self._create_data(self.org_1.id)
        del variables["data"]["organizationId"]
        self._set_active_org(self.org_1)

        payload = self.execute_graphql(CREATE_MUTATION, variables)

        self.assertFalse(payload.get("errors"), payload)
        created = Referral.objects.exclude(pk__in=[self.referral_1.pk, self.referral_2.pk]).get()
        self.assertEqual(created.organization, self.org_1)

    def test_create_falling_back_to_the_header_still_requires_the_grant(self) -> None:
        variables = self._create_data(self.org_1.id)
        del variables["data"]["organizationId"]
        self.org_2.add_user(self.org_1_case_manager_1)
        self._set_active_org(self.org_2)

        payload = self.execute_graphql(CREATE_MUTATION, variables)

        self.assertEqual(payload["data"]["createReferral"]["__typename"], "OperationInfo", payload)
        self.assertEqual(Referral.objects.count(), 2)

    def test_create_ignores_the_header(self) -> None:
        # The header is a view hint, never authority: the payload org wins even
        # when the header names another org the caller has no grant at.
        self._set_active_org(self.org_2)

        payload = self.execute_graphql(CREATE_MUTATION, self._create_data(self.org_1.id))

        self.assertFalse(payload.get("errors"), payload)
        created = Referral.objects.exclude(pk__in=[self.referral_1.pk, self.referral_2.pk]).get()
        self.assertEqual(created.organization, self.org_1)

    # ── the header narrows, and only narrows ────────────────────────────

    def test_header_narrows_a_multi_org_caller(self) -> None:
        self.org_2.add_user(self.org_1_case_manager_1)
        OrgRoleManager(self.org_2).add_roles(self.org_1_case_manager_1, CASEWORKER)
        self._set_active_org(self.org_2)

        ids = {row["id"] for row in self._results(self.execute_graphql(LIST_QUERY))}

        self.assertEqual(ids, {str(self.referral_2.pk)})

    def test_single_referral_is_not_confined_by_the_header(self) -> None:
        # ADR 0001 §2.6: load-by-id is authority-only.  A stale header must not
        # hide a row the caller's grant reaches.
        self.org_2.add_user(self.org_1_case_manager_1)
        OrgRoleManager(self.org_2).add_roles(self.org_1_case_manager_1, CASEWORKER)
        self._set_active_org(self.org_1)

        payload = self.execute_graphql(SINGLE_QUERY, {"pk": str(self.referral_2.pk)})

        self.assertFalse(payload.get("errors"), payload)
        self.assertEqual(payload["data"]["referral"]["id"], str(self.referral_2.pk))

    def test_header_cannot_widen_the_scope(self) -> None:
        self._set_active_org(self.org_2)

        ids = {row["id"] for row in self._results(self.execute_graphql(LIST_QUERY))}

        self.assertEqual(ids, set())

    def test_header_does_not_confine_a_global_holder(self) -> None:
        # ADR 0001 §2.4: a global holder is never confined by a stale header.
        superuser = baker.make(User, is_superuser=True, is_staff=True)
        self.graphql_client.force_login(superuser)
        self._set_active_org(self.org_1)

        ids = {row["id"] for row in self._results(self.execute_graphql(LIST_QUERY))}

        self.assertEqual(ids, {str(self.referral_1.pk), str(self.referral_2.pk)})

    def test_malformed_header_is_a_permission_error(self) -> None:
        self.graphql_client.defaults["HTTP_X_ORGANIZATION_ID"] = "abc"

        payload = self.execute_graphql(LIST_QUERY)

        self.assertTrue(payload.get("errors"), payload)
        self.assertNotIn("invalid literal", str(payload))

    # ── global tier ─────────────────────────────────────────────────────

    def test_superuser_reaches_every_org(self) -> None:
        superuser = baker.make(User, is_superuser=True, is_staff=True)
        self.graphql_client.force_login(superuser)

        ids = {row["id"] for row in self._results(self.execute_graphql(LIST_QUERY))}

        self.assertEqual(ids, {str(self.referral_1.pk), str(self.referral_2.pk)})

    def test_direct_user_permission_holder_reaches_every_org(self) -> None:
        # The global tier (``user_permissions``) is ALL in ``scopes`` — the
        # per-org report folds it only because referrals are grant-only (§5.2).
        user = baker.make(User)
        user.user_permissions.add(Permission.objects.get(codename="view_referral", content_type__app_label="referrals"))
        self.graphql_client.force_login(user)

        ids = {row["id"] for row in self._results(self.execute_graphql(LIST_QUERY))}

        self.assertEqual(ids, {str(self.referral_1.pk), str(self.referral_2.pk)})
