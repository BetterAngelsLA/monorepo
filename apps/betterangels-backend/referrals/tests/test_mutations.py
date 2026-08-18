"""Organization scoping on referral mutations."""

from accounts.selectors import resolve_permission_group
from clients.models import ClientProfile
from common.tests.utils import GraphQLBaseTestCase
from model_bakery import baker
from notes.groups import CASEWORKER
from referrals.models import Referral
from referrals.services import referral_create
from shelters.tests.baker_recipes import shelter_recipe

UPDATE_REFERRAL = """
    mutation UpdateReferral($data: UpdateReferralInput!) {
        updateReferral(data: $data) {
            ... on OperationInfo {
                messages {
                    kind
                    field
                    message
                }
            }
            ... on ReferralType {
                id
                notes
            }
        }
    }
"""


class UpdateReferralOrgScopingTestCase(GraphQLBaseTestCase):
    """``updateReferral`` reaches its record through ``PermissionedQuerySet``.

    Guardian grants CHANGE on a referral to the permission group that created
    it, and that grant says nothing about which organization the caller is
    currently acting as.  So without an organization filter the referral's own
    author could edit it while their active organization was a different one.
    """

    def setUp(self) -> None:
        super().setUp()
        self.client_profile = baker.make(ClientProfile)
        self.shelter = shelter_recipe.make(organization=self.org_1)
        self.referral = referral_create(
            user=self.org_1_case_manager_1,
            permission_group=resolve_permission_group(self.org_1_case_manager_1, template=CASEWORKER),
            client_profile=self.client_profile,
            shelter=self.shelter,
            notes="Original notes",
        )
        self._handle_user_login("org_1_case_manager_1")

    def _update(self, notes: str) -> dict:
        return self.execute_graphql(UPDATE_REFERRAL, {"data": {"id": str(self.referral.pk), "notes": notes}})

    def test_updates_within_the_active_organization(self) -> None:
        response = self._update("Updated notes")

        self.assertEqual(response["data"]["updateReferral"]["notes"], "Updated notes")

    def test_denied_when_active_org_differs(self) -> None:
        self._set_active_org(self.org_2)

        response = self._update("Should not update")

        messages = response["data"]["updateReferral"]["messages"]
        self.assertEqual(messages[0]["message"], "You do not have permission to update this referral.")
        self.assertEqual(Referral.objects.get(pk=self.referral.pk).notes, "Original notes")

    def test_denied_without_the_org_header(self) -> None:
        self.graphql_client.defaults.pop("HTTP_X_ORGANIZATION_ID", None)

        response = self._update("Should not update")

        self.assertEqual(
            response["errors"][0]["message"],
            "You do not have permission to perform this action in this organization.",
        )
        self.assertEqual(Referral.objects.get(pk=self.referral.pk).notes, "Original notes")

    def test_unknown_id_reads_as_a_denial_not_a_server_error(self) -> None:
        """Regression: a bare ``qs.get()`` raised ``Referral.DoesNotExist``."""
        response = self.execute_graphql(UPDATE_REFERRAL, {"data": {"id": "999999", "notes": "nope"}})

        self.assertIsNone(response.get("errors"))
        messages = response["data"]["updateReferral"]["messages"]
        self.assertEqual(messages[0]["message"], "You do not have permission to update this referral.")
