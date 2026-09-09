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
from accounts.models import PermissionGroup, User
from accounts.role_manager import OrgRoleManager
from accounts.services import sync_roles
from common.tests.utils import GraphQLBaseTestCase
from django.utils import timezone
from model_bakery import baker
from notes.models import Note
from rest_framework.test import APIClient

REPORT_SUMMARY_QUERY = """
    query ReportSummary($startDate: Date, $endDate: Date) {
        reportSummary(startDate: $startDate, endDate: $endDate) {
            totalNotes
            startDate
            endDate
        }
    }
"""


class ReportSummaryGraphQLGrantMixin:
    """Shared GraphQL helpers for the reportSummary query."""

    def _read(self, user: User, org: object) -> dict[str, Any]:
        self.graphql_client.force_login(user)
        self._set_active_org(org)
        return self.execute_graphql(REPORT_SUMMARY_QUERY, {"startDate": "2025-01-01", "endDate": "2025-01-31"})

    def _assert_denied(self, response: dict[str, Any]) -> None:
        self.assertIsNotNone(response.get("errors"))
        self.assertIsNone((response.get("data") or {}).get("reportSummary"))


class ReportExportDRFGrantMixin:
    """Shared DRF helpers for the /reports/export/ endpoint."""

    def _export(self, user: User, org_id: int) -> Any:
        api = APIClient()
        api.force_authenticate(user=user)
        return api.get(f"/reports/export/?org_id={org_id}&start_date=2025-01-01&end_date=2025-01-31")


class ReportGrantAuthorityTestCase(GraphQLBaseTestCase, ReportSummaryGraphQLGrantMixin, ReportExportDRFGrantMixin):
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


class ReportGrantAuthorityDeniedTestCase(
    GraphQLBaseTestCase, ReportSummaryGraphQLGrantMixin, ReportExportDRFGrantMixin
):
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
