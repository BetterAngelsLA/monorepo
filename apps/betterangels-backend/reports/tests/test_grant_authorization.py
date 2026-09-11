"""Reports authority — grant-only reads (ADR 0001 §5.3, reports cutover).

The ``reportSummary`` GraphQL query and the DRF interaction-data export
authorize via ``require_can``/``can`` over ``reports.view_reports`` — role-backed
ORG_ADMIN/ORG_SUPERUSER backfilled Grants, a direct-grant holder, or the global
tier.  Membership and legacy ``PermissionGroup`` rows are not consulted.

These tests pin the contract:

- a role-backed ORG_ADMIN reads the summary and exports;
- a legacy-only ORG_ADMIN (PermissionGroup membership, no Grant) is DENIED —
  the flipped behavior that made the cutover grant-only;
- a direct-grant holder with no membership reads;
- a member with neither authority is denied;
- a Grant at org A does not authorize org B;
- the global tier (superuser) is enforceable at any org.
"""

from datetime import datetime
from typing import Any

from accounts.groups import ORG_ADMIN
from accounts.models import Grant, PermissionGroup, User
from accounts.role_manager import OrgRoleManager
from accounts.services import sync_roles
from common.tests.utils import GraphQLBaseTestCase
from django.contrib.auth.models import Permission
from django.utils import timezone
from model_bakery import baker
from notes.models import Note
from rest_framework.test import APIClient

REPORT_SUMMARY_QUERY = """
    query ReportSummary($organizationId: ID!, $startDate: Date, $endDate: Date) {
        reportSummary(organizationId: $organizationId, startDate: $startDate, endDate: $endDate) {
            totalNotes
            startDate
            endDate
        }
    }
"""


class ReportSummaryGraphQLGrantMixin(GraphQLBaseTestCase):
    """Shared GraphQL helpers for the reportSummary query.

    The org is carried in the payload (``organizationId``); the
    ``X-Organization-ID`` header is never consulted.  The base fixture leaves
    the header on ``org_1``, so reading ``org_2`` below doubles as a stale-header
    check.
    """

    def _read(self, user: User, org: Any) -> dict[str, Any]:
        self.graphql_client.force_login(user)
        return self.execute_graphql(
            REPORT_SUMMARY_QUERY,
            {"organizationId": str(org.pk), "startDate": "2025-01-01", "endDate": "2025-01-31"},
        )

    def _assert_denied(self, response: dict[str, Any]) -> None:
        self.assertIsNotNone(response.get("errors"))
        self.assertIsNone((response.get("data") or {}).get("reportSummary"))


class ReportExportDRFGrantMixin:
    """Shared DRF helpers for the /reports/export/ endpoint."""

    def _export(self, user: User, org_id: int | str) -> Any:
        api = APIClient()
        api.force_authenticate(user=user)
        return api.get(f"/reports/export/?org_id={org_id}&start_date=2025-01-01&end_date=2025-01-31")


class ReportGrantAuthorityTestCase(ReportSummaryGraphQLGrantMixin, ReportExportDRFGrantMixin):
    """Grant holders read reports after the grant-only cutover."""

    def setUp(self) -> None:
        super().setUp()
        # Provision the code-owned Role rows so OrgRoleManager mirrors Grants
        # for role-backed ORG_ADMIN memberships.
        sync_roles()

    def test_role_backed_org_admin_reads_summary_and_exports(self) -> None:
        admin = baker.make(User)
        self.org_1.add_user(admin)
        OrgRoleManager(self.org_1).add_roles(admin, ORG_ADMIN)
        self.assertTrue(admin.grants.filter(scope_org=self.org_1, role__name=ORG_ADMIN.name).exists())
        baker.make(Note, organization=self.org_1, interacted_at=timezone.make_aware(datetime(2025, 1, 15, 12, 0, 0)))

        response = self._read(admin, self.org_1)
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["reportSummary"]["totalNotes"], 1)

        export = self._export(admin, self.org_1.pk)
        self.assertEqual(export.status_code, 200)
        self.assertEqual(export["Content-Type"], "text/csv")

    def test_direct_grant_holder_without_membership_reads(self) -> None:
        holder = baker.make(User)
        self._grant_permission(holder, "reports.view_reports", self.org_2, role_name="Report Reader")
        self.assertFalse(self.org_2.users.filter(pk=holder.pk).exists())

        response = self._read(holder, self.org_2)
        self.assertIsNone(response.get("errors"))
        self.assertIsNotNone(response["data"]["reportSummary"])

    def test_superuser_without_membership_reads(self) -> None:
        user = baker.make(User, is_superuser=True)
        self.assertFalse(self.org_2.users.filter(pk=user.pk).exists())

        response = self._read(user, self.org_2)
        self.assertIsNone(response.get("errors"))
        self.assertIsNotNone(response["data"]["reportSummary"])

    def test_user_permissions_holder_reads_and_exports(self) -> None:
        """A direct ``user_permissions`` grant is global tier — enforceable at any org."""
        holder = baker.make(User)
        perm = Permission.objects.get(codename="view_reports", content_type__app_label="reports")
        holder.user_permissions.add(perm)
        self.assertFalse(self.org_2.users.filter(pk=holder.pk).exists())

        response = self._read(holder, self.org_2)
        self.assertIsNone(response.get("errors"))
        self.assertIsNotNone(response["data"]["reportSummary"])

        export = self._export(holder, self.org_2.pk)
        self.assertEqual(export.status_code, 200)

    def test_reads_without_the_org_header(self) -> None:
        """No X-Organization-ID header at all — the payload org authorizes."""
        holder = baker.make(User)
        self._grant_permission(holder, "reports.view_reports", self.org_2, role_name="Report Reader")
        self.graphql_client.force_login(holder)
        self.graphql_client.defaults.pop("HTTP_X_ORGANIZATION_ID", None)

        response = self.execute_graphql(REPORT_SUMMARY_QUERY, {"organizationId": str(self.org_2.pk)})
        self.assertIsNone(response.get("errors"))
        self.assertIsNotNone(response["data"]["reportSummary"])

    def test_stale_header_is_ignored(self) -> None:
        """The payload org wins: a stale header naming an unauthorized org is ignored.

        The base fixture leaves the header on ``org_1`` (where this holder has no
        authority) while ``_read`` names ``org_2`` in the payload.
        """
        holder = baker.make(User)
        self._grant_permission(holder, "reports.view_reports", self.org_2, role_name="Report Reader")
        # Pin the premise: the base fixture leaves the header on org_1, where
        # this holder has no authority (that stale header is the point).
        self.assertEqual(self.graphql_client.defaults.get("HTTP_X_ORGANIZATION_ID"), str(self.org_1.pk))

        response = self._read(holder, self.org_2)
        self.assertIsNone(response.get("errors"))
        self.assertIsNotNone(response["data"]["reportSummary"])

    def test_unknown_organization_id_fails_closed(self) -> None:
        """A payload org that does not exist is a permission denial, not a crash."""
        holder = baker.make(User)
        self._grant_permission(holder, "reports.view_reports", self.org_2, role_name="Report Reader")
        self.graphql_client.force_login(holder)

        response = self.execute_graphql(REPORT_SUMMARY_QUERY, {"organizationId": "999999999"})
        self._assert_denied(response)

    def test_non_numeric_organization_id_fails_closed(self) -> None:
        """A non-numeric payload org id denies cleanly (no ValueError crash)."""
        holder = baker.make(User)
        self._grant_permission(holder, "reports.view_reports", self.org_2, role_name="Report Reader")
        self.graphql_client.force_login(holder)

        response = self.execute_graphql(REPORT_SUMMARY_QUERY, {"organizationId": "not-a-number"})
        self._assert_denied(response)


class ReportGrantAuthorityDeniedTestCase(ReportSummaryGraphQLGrantMixin, ReportExportDRFGrantMixin):
    """Authority absent: legacy-only holders, members, cross-org."""

    def setUp(self) -> None:
        super().setUp()
        sync_roles()

    def test_legacy_only_org_admin_is_denied(self) -> None:
        """A legacy PermissionGroup ORG_ADMIN with no Grant no longer reads reports."""
        legacy_admin = baker.make(User)
        self.org_1.add_user(legacy_admin)
        group = PermissionGroup.objects.get(organization=self.org_1, template__name=ORG_ADMIN.name)
        group.user_set.add(legacy_admin)
        # Pin the premise: the denial below only proves revocation if the legacy
        # group actually carries the permission it no longer grants.
        self.assertTrue(group.permissions.filter(content_type__app_label="reports", codename="view_reports").exists())
        # Direct membership mirrors a Grant at the m2m edge now; a pre-cutover
        # legacy-only holder has none — drop the mirror to model that state.
        Grant.objects.filter(principal_user=legacy_admin).delete()
        self.assertFalse(legacy_admin.grants.filter(scope_org=self.org_1).exists())

        self._assert_denied(self._read(legacy_admin, self.org_1))
        export = self._export(legacy_admin, self.org_1.pk)
        self.assertEqual(export.status_code, 403)

    def test_member_with_no_authority_is_denied(self) -> None:
        member = baker.make(User)
        self.org_1.add_user(member)

        self._assert_denied(self._read(member, self.org_1))
        export = self._export(member, self.org_1.pk)
        self.assertEqual(export.status_code, 403)

    def test_grant_at_org_a_does_not_authorize_org_b(self) -> None:
        """A role-backed ORG_ADMIN holds org_1 only; acting at org_2 must fail."""
        admin = baker.make(User)
        self.org_1.add_user(admin)
        OrgRoleManager(self.org_1).add_roles(admin, ORG_ADMIN)

        self._assert_denied(self._read(admin, self.org_2))
        export = self._export(admin, self.org_2.pk)
        self.assertEqual(export.status_code, 403)
