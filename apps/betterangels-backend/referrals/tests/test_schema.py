"""API-level authorization for referrals.

These tests exercise the GraphQL surface, not just the services, because that
is where the permission extensions run: a model-level ``view_referral`` makes
``filter_for_user`` return every row, so the resolvers must scope by the
caller's organizations themselves.
"""

from typing import Any, Dict, cast

from model_bakery import baker
from waffle import get_waffle_flag_model

from accounts.seed import sync_group_permissions
from clients.models import ClientProfile
from common.tests.utils import GraphQLBaseTestCase
from referrals.models import Referral
from referrals.schema import REFERRALS_FLAG
from shelters.tests.baker_recipes import shelter_recipe

LIST_QUERY = "query { referrals { results { id } } }"
SINGLE_QUERY = "query($pk: ID!) { referral(pk: $pk) { id } }"
CREATE_MUTATION = """
mutation($data: CreateReferralInput!) {
  createReferral(data: $data) {
    __typename
    ... on ReferralType { id }
    ... on OperationInfo { messages { message } }
  }
}
"""
UPDATE_MUTATION = """
mutation($data: UpdateReferralInput!) {
  updateReferral(data: $data) {
    __typename
    ... on ReferralType { id status }
    ... on OperationInfo { messages { message } }
  }
}
"""
DELETE_MUTATION = """
mutation($data: DeleteDjangoObjectInput!) {
  deleteReferral(data: $data) {
    __typename
    ... on DeletedObjectType { id }
    ... on OperationInfo { messages { message } }
  }
}
"""


class ReferralApiTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.flag = get_waffle_flag_model().objects.create(name=REFERRALS_FLAG, everyone=True)
        self.flag.flush()

        sync_group_permissions(organization=self.org_1)
        sync_group_permissions(organization=self.org_2)

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

    def test_flag_off_denies_the_api(self) -> None:
        self.flag.everyone = False
        self.flag.save()
        self.flag.flush()

        payload = self.execute_graphql(LIST_QUERY)

        self.assertTrue(payload.get("errors"), payload)

    def test_list_is_scoped_to_the_users_organizations(self) -> None:
        ids = {row["id"] for row in self._results(self.execute_graphql(LIST_QUERY))}

        self.assertEqual(ids, {str(self.referral_1.pk)})

    def test_active_org_header_narrows_the_list(self) -> None:
        self._set_active_org(self.org_2)

        payload = self.execute_graphql(LIST_QUERY)

        self.assertEqual(self._results(payload), [])
        self.assertTrue(payload.get("data") is not None)

    def test_single_referral_outside_the_users_orgs_is_denied(self) -> None:
        self._set_active_org(self.org_2)

        payload = self.execute_graphql(SINGLE_QUERY, {"pk": str(self.referral_2.pk)})

        self.assertTrue(payload.get("errors"), payload)

    def test_update_outside_the_users_orgs_is_denied(self) -> None:
        payload = self.execute_graphql(
            UPDATE_MUTATION,
            {"data": {"id": str(self.referral_2.pk), "status": "ACCEPTED"}},
        )

        self.assertEqual(payload["data"]["updateReferral"]["__typename"], "OperationInfo", payload)
        self.referral_2.refresh_from_db()
        self.assertEqual(self.referral_2.status, Referral.Status.PENDING)

    def test_delete_outside_the_users_orgs_is_denied(self) -> None:
        payload = self.execute_graphql(DELETE_MUTATION, {"data": {"id": str(self.referral_2.pk)}})

        self.assertEqual(payload["data"]["deleteReferral"]["__typename"], "OperationInfo", payload)
        self.assertTrue(Referral.objects.filter(pk=self.referral_2.pk).exists())

    def test_create_uses_the_active_org_header(self) -> None:
        payload = self.execute_graphql(
            CREATE_MUTATION,
            {"data": {"clientProfile": str(self.client_profile.pk), "shelter": str(self.shelter.pk)}},
        )

        self.assertFalse(payload.get("errors"), payload)
        created = Referral.objects.exclude(pk__in=[self.referral_1.pk, self.referral_2.pk]).get()
        self.assertEqual(created.organization, self.org_1)
        self.assertEqual(created.created_by, self.org_1_case_manager_1)

    def test_create_without_a_header_requires_a_single_caseworker_org(self) -> None:
        self.org_2.add_user(self.org_1_case_manager_1)
        from common.tests.utils import make_permission_group

        make_permission_group(organization=self.org_2, template_name="Caseworker").user_set.add(
            self.org_1_case_manager_1
        )
        self.graphql_client.defaults.pop("HTTP_X_ORGANIZATION_ID", None)

        payload = self.execute_graphql(
            CREATE_MUTATION,
            {"data": {"clientProfile": str(self.client_profile.pk), "shelter": str(self.shelter.pk)}},
        )

        self.assertEqual(payload["data"]["createReferral"]["__typename"], "OperationInfo", payload)
