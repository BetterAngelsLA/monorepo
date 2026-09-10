"""Clients authority — grant-only profile + family (ADR 0001 §5.1, RFC 0002).

The client family cut over parity-first: SHARED read / SHARED write — any
holder of the permission anywhere may act, exactly what the legacy model-level
CASEWORKER permissions did.  These tests pin the cutover posture:

* role-backed grants authorize with **no legacy group at all**;
* stale legacy-only holders are **denied** (the clients legacy rows are inert);
* the shelter operator keeps its VIEW slice and no writes;
* a grant in any org reaches every client (SHARED tier — no org confinement);
* the global tier still passes.
"""

from typing import Any, Tuple

from accounts.models import User
from accounts.role_manager import OrgRoleManager
from accounts.services import sync_roles
from clients.models import ClientContact, ClientProfile
from clients.tests.utils import ClientProfileGraphQLBaseTestCase
from common.tests.utils import make_legacy_only_holder, make_permission_group
from model_bakery import baker
from notes.groups import CASEWORKER
from organizations.models import Organization
from shelters.groups import SHELTER_OPERATOR


class ClientsGrantAuthorityTestCase(ClientProfileGraphQLBaseTestCase):
    """Grant-only clients — role-backed yes, legacy-only no (RFC 0002)."""

    def setUp(self) -> None:
        super().setUp()
        # Provision the code-owned Role rows so OrgRoleManager mirrors Grants
        # for role-backed memberships (and CASEWORKER_ROLE carries the client
        # bundle added by the cutover).
        sync_roles()

    def _client_profile_query(self, profile_id: Any) -> dict[str, Any]:
        query = """
            query ($id: ID!) {
                clientProfile(pk: $id) {
                    id
                    firstName
                }
            }
        """
        return self.execute_graphql(query, {"id": profile_id})

    def _delete_client_profile(self, profile_id: Any) -> dict[str, Any]:
        """``deleteClientProfile`` returns ``DeletedObjectType``, not the model type."""
        mutation = """
            mutation ($id: ID!) {
                deleteClientProfile(data: { id: $id }) {
                    ... on OperationInfo {
                        messages {
                            kind
                            message
                        }
                    }
                    ... on DeletedObjectType {
                        id
                    }
                }
            }
        """
        return self.execute_graphql(mutation, {"id": profile_id})

    def _grant(self, user: User, org: Organization, role_name: str, perms: Tuple[str, ...]) -> None:
        for perm in perms:
            self._grant_permission(user, perm, org, role_name=role_name)

    def test_grant_backed_caseworker_has_full_client_crud(self) -> None:
        """A scoped grant alone authorizes — no legacy PermissionGroup needed."""
        editor = baker.make(User)
        self.org_1.add_user(editor)
        self._grant(
            editor,
            self.org_1,
            "Client Editor",
            (ClientProfile.perms.ADD, ClientProfile.perms.VIEW, ClientProfile.perms.CHANGE, ClientProfile.perms.DELETE),
        )
        self.graphql_client.force_login(editor)

        created = self._create_client_profile_fixture({"firstName": "grant created"})
        self.assertIsNone(created.get("errors"))
        profile_id = created["data"]["createClientProfile"]["id"]

        read = self._client_profile_query(profile_id)
        self.assertIsNone(read.get("errors"))
        self.assertEqual(read["data"]["clientProfile"]["id"], profile_id)

        updated = self._update_client_profile_fixture({"id": profile_id, "firstName": "grant updated"})
        self.assertIsNone(updated.get("errors"))
        self.assertEqual(updated["data"]["updateClientProfile"]["firstName"], "grant updated")

        deleted = self._delete_client_profile(profile_id)
        self.assertNotIn("messages", deleted["data"]["deleteClientProfile"])
        self.assertFalse(ClientProfile.objects.filter(pk=profile_id).exists())

    def test_legacy_only_holder_is_denied(self) -> None:
        """The pre-cutover state — membership + legacy row, no grant — is authority-less."""
        holder = baker.make(User)
        make_legacy_only_holder(organization=self.org_1, template_name=CASEWORKER.name, user=holder)
        self.graphql_client.force_login(holder)

        read = self._client_profile_query(self.client_profile_1["id"])
        self.assertIn("errors", read)

        updated = self._update_client_profile_fixture({"id": self.client_profile_1["id"], "firstName": "nope"})
        self.assertIn("errors", updated)

    def test_grantless_org_member_is_denied(self) -> None:
        member = baker.make(User)
        self.org_1.add_user(member)
        self.graphql_client.force_login(member)

        read = self._client_profile_query(self.client_profile_1["id"])
        self.assertIn("errors", read)

    def test_shelter_operator_reads_but_does_not_write(self) -> None:
        """Parity: the operator keeps its VIEW slice and has no client writes."""
        operator = baker.make(User)
        self.org_1.add_user(operator)
        make_permission_group(organization=self.org_1, template_name=SHELTER_OPERATOR.name)
        OrgRoleManager(self.org_1).add_roles(operator, SHELTER_OPERATOR)
        self.graphql_client.force_login(operator)

        read = self._client_profile_query(self.client_profile_1["id"])
        self.assertIsNone(read.get("errors"))
        self.assertEqual(read["data"]["clientProfile"]["id"], self.client_profile_1["id"])

        updated = self._update_client_profile_fixture({"id": self.client_profile_1["id"], "firstName": "nope"})
        self.assertIn("errors", updated)

    def test_shared_tier_grant_reaches_clients_from_any_org(self) -> None:
        """SHARED write: a grant at org 2 edits a client that org 1 created."""
        editor = baker.make(User)
        self.org_2.add_user(editor)
        self._grant(
            editor,
            self.org_2,
            "Other Org Editor",
            (ClientProfile.perms.VIEW, ClientProfile.perms.CHANGE),
        )
        self.graphql_client.force_login(editor)

        read = self._client_profile_query(self.client_profile_1["id"])
        self.assertIsNone(read.get("errors"))

        updated = self._update_client_profile_fixture({"id": self.client_profile_1["id"], "firstName": "cross org"})
        self.assertIsNone(updated.get("errors"))
        self.assertEqual(updated["data"]["updateClientProfile"]["firstName"], "cross org")

    def test_family_rows_ride_the_same_gate(self) -> None:
        """The family inherits ClientProfile's tier — a grant, not a legacy row, deletes a contact."""
        contact_id = self.client_profile_1["contacts"][0]["id"]
        editor = baker.make(User)
        self.org_2.add_user(editor)
        self._grant(
            editor,
            self.org_2,
            "Contact Editor",
            (ClientContact.perms.VIEW, ClientContact.perms.DELETE),
        )
        self.graphql_client.force_login(editor)

        deleted = self._delete_fixture(object="ClientContact", object_id=contact_id)
        self.assertNotIn("messages", deleted["data"]["deleteClientContact"])
        self.assertFalse(ClientContact.objects.filter(pk=contact_id).exists())

    def test_global_tier_still_passes(self) -> None:
        admin = baker.make(User, is_superuser=True)
        self.graphql_client.force_login(admin)

        read = self._client_profile_query(self.client_profile_1["id"])
        self.assertIsNone(read.get("errors"))

        deleted = self._delete_client_profile(self.client_profile_1["id"])
        self.assertNotIn("messages", deleted["data"]["deleteClientProfile"])
