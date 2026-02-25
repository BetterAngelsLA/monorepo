"""Tests for report views (DRF export) and GraphQL report summary query."""

from datetime import datetime

import pytest
import time_machine
from accounts.models import User
from common.tests.utils import GraphQLBaseTestCase
from django.test import ignore_warnings
from django.utils import timezone
from model_bakery import baker
from notes.models import Note
from organizations.models import Organization
from rest_framework.test import APIClient


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def org() -> Organization:
    return baker.make(Organization, name="Test Org")


@pytest.fixture
def user_with_access(org: Organization) -> User:
    """Create a user with ACCESS_ORG_PORTAL permission on the org."""
    from guardian.shortcuts import assign_perm

    user = baker.make(User)
    user.set_password("testpass")
    user.save()
    org.add_user(user)
    assign_perm("access_org_portal", user, org)
    return user


@pytest.fixture
def user_without_access(org: Organization) -> User:
    """Create a user who is in the org but lacks portal access permission."""
    user = baker.make(User)
    user.set_password("testpass")
    user.save()
    org.add_user(user)
    return user


@pytest.fixture
def user_no_org() -> User:
    """Create a user who is not in any organization."""
    user = baker.make(User)
    user.set_password("testpass")
    user.save()
    return user


@pytest.mark.django_db
class TestExportInteractionDataView:
    """Tests for the ExportInteractionDataView DRF endpoint."""

    def test_unauthenticated_returns_403(self, api_client: APIClient) -> None:
        """Unauthenticated requests get 403 from DRF."""
        response = api_client.get("/reports/export/")
        assert response.status_code == 403

    def test_user_no_org_gets_403(self, api_client: APIClient, user_no_org: User) -> None:
        """User without an organization membership gets 403."""
        api_client.force_authenticate(user=user_no_org)
        response = api_client.get("/reports/export/")
        assert response.status_code == 403

    def test_user_without_permission_gets_403(self, api_client: APIClient, user_without_access: User) -> None:
        """User in org but without ACCESS_ORG_PORTAL permission gets 403."""
        api_client.force_authenticate(user=user_without_access)
        response = api_client.get("/reports/export/")
        assert response.status_code == 403

    def test_successful_csv_download_with_month_year(
        self, api_client: APIClient, user_with_access: User, org: Organization
    ) -> None:
        """Authorized user can download CSV using legacy month/year params."""
        baker.make(
            Note,
            organization=org,
            interacted_at=timezone.make_aware(datetime(2025, 1, 15, 12, 0, 0)),
            _quantity=3,
        )
        api_client.force_authenticate(user=user_with_access)
        response = api_client.get("/reports/export/?month=1&year=2025")
        assert response.status_code == 200
        assert response["Content-Type"] == "text/csv"
        assert "attachment" in response["Content-Disposition"]
        content = response.content.decode("utf-8")
        lines = [line for line in content.strip().split("\n") if line.strip()]
        assert len(lines) == 4  # 1 header + 3 data rows

    def test_successful_csv_download_with_date_range(
        self, api_client: APIClient, user_with_access: User, org: Organization
    ) -> None:
        """Authorized user can download CSV using start_date/end_date params."""
        baker.make(
            Note,
            organization=org,
            interacted_at=timezone.make_aware(datetime(2025, 1, 10, 12, 0, 0)),
            _quantity=2,
        )
        baker.make(
            Note,
            organization=org,
            interacted_at=timezone.make_aware(datetime(2025, 1, 20, 12, 0, 0)),
            _quantity=1,
        )
        # Note outside range
        baker.make(
            Note,
            organization=org,
            interacted_at=timezone.make_aware(datetime(2025, 2, 5, 12, 0, 0)),
        )
        api_client.force_authenticate(user=user_with_access)
        response = api_client.get("/reports/export/?start_date=2025-01-01&end_date=2025-01-31")
        assert response.status_code == 200
        assert response["Content-Type"] == "text/csv"
        assert "interaction_data_20250101_20250131.csv" in response["Content-Disposition"]
        content = response.content.decode("utf-8")
        lines = [line for line in content.strip().split("\n") if line.strip()]
        assert len(lines) == 4  # header + 3 notes in Jan

    def test_date_range_spanning_months(self, api_client: APIClient, user_with_access: User, org: Organization) -> None:
        """Date range can span multiple months."""
        baker.make(
            Note,
            organization=org,
            interacted_at=timezone.make_aware(datetime(2025, 1, 15, 12, 0, 0)),
        )
        baker.make(
            Note,
            organization=org,
            interacted_at=timezone.make_aware(datetime(2025, 2, 15, 12, 0, 0)),
        )
        baker.make(
            Note,
            organization=org,
            interacted_at=timezone.make_aware(datetime(2025, 3, 15, 12, 0, 0)),
        )
        api_client.force_authenticate(user=user_with_access)
        response = api_client.get("/reports/export/?start_date=2025-01-01&end_date=2025-03-31")
        assert response.status_code == 200
        content = response.content.decode("utf-8")
        lines = [line for line in content.strip().split("\n") if line.strip()]
        assert len(lines) == 4  # header + 3 notes

    def test_invalid_date_format_returns_400(self, api_client: APIClient, user_with_access: User) -> None:
        """Invalid date format returns 400."""
        api_client.force_authenticate(user=user_with_access)
        response = api_client.get("/reports/export/?start_date=01-01-2025&end_date=01-31-2025")
        assert response.status_code == 400

    def test_start_after_end_returns_400(self, api_client: APIClient, user_with_access: User) -> None:
        """start_date after end_date returns 400."""
        api_client.force_authenticate(user=user_with_access)
        response = api_client.get("/reports/export/?start_date=2025-02-01&end_date=2025-01-01")
        assert response.status_code == 400

    def test_default_month_is_previous(self, api_client: APIClient, user_with_access: User, org: Organization) -> None:
        """When no params given, defaults to previous month."""
        with time_machine.travel("2025-03-15 10:00:00", tick=False):
            api_client.force_authenticate(user=user_with_access)
            response = api_client.get("/reports/export/")
            assert response.status_code == 200

    def test_invalid_month_returns_400(self, api_client: APIClient, user_with_access: User) -> None:
        """Invalid month parameter returns 400."""
        api_client.force_authenticate(user=user_with_access)
        response = api_client.get("/reports/export/?month=13&year=2025")
        assert response.status_code == 400

    def test_invalid_year_returns_400(self, api_client: APIClient, user_with_access: User) -> None:
        """Invalid year parameter returns 400."""
        api_client.force_authenticate(user=user_with_access)
        response = api_client.get("/reports/export/?month=1&year=1999")
        assert response.status_code == 400

    def test_non_numeric_params_return_400(self, api_client: APIClient, user_with_access: User) -> None:
        """Non-numeric params return 400."""
        api_client.force_authenticate(user=user_with_access)
        response = api_client.get("/reports/export/?month=abc&year=2025")
        assert response.status_code == 400

    def test_empty_month_returns_csv(self, api_client: APIClient, user_with_access: User, org: Organization) -> None:
        """A month with no notes returns a CSV with just the header."""
        api_client.force_authenticate(user=user_with_access)
        response = api_client.get("/reports/export/?month=6&year=2024")
        assert response.status_code == 200
        content = response.content.decode("utf-8")
        lines = [line for line in content.strip().split("\n") if line.strip()]
        assert len(lines) == 1  # header only

    def test_post_method_not_allowed(self, api_client: APIClient, user_with_access: User) -> None:
        """POST method should return 405."""
        api_client.force_authenticate(user=user_with_access)
        response = api_client.post("/reports/export/")
        assert response.status_code == 405

    def test_notes_filtered_by_organization(
        self, api_client: APIClient, user_with_access: User, org: Organization
    ) -> None:
        """Only notes belonging to the user's org are included."""
        other_org = baker.make(Organization, name="Other Org")

        baker.make(
            Note,
            organization=org,
            interacted_at=timezone.make_aware(datetime(2025, 1, 15, 12, 0, 0)),
            _quantity=2,
        )
        baker.make(
            Note,
            organization=other_org,
            interacted_at=timezone.make_aware(datetime(2025, 1, 15, 12, 0, 0)),
            _quantity=3,
        )

        api_client.force_authenticate(user=user_with_access)
        response = api_client.get("/reports/export/?start_date=2025-01-01&end_date=2025-01-31")
        assert response.status_code == 200
        content = response.content.decode("utf-8")
        lines = [line for line in content.strip().split("\n") if line.strip()]
        assert len(lines) == 3  # header + 2 rows from user's org only


REPORT_SUMMARY_QUERY = """
    query ReportSummary($startDate: Date, $endDate: Date) {
        reportSummary(startDate: $startDate, endDate: $endDate) {
            totalNotes
            startDate
            endDate
            notesByDate {
                date
                count
            }
            notesByTeam {
                name
                count
            }
            notesByPurpose {
                name
                count
            }
            topProvidedServices {
                name
                count
            }
            topRequestedServices {
                name
                count
            }
        }
    }
"""


@ignore_warnings(category=UserWarning)
class TestReportSummaryGraphQL(GraphQLBaseTestCase):
    """Tests for the reportSummary GraphQL query."""

    def _setup_org_user_with_access(self):
        """Create org + user with ACCESS_ORG_PORTAL permission."""
        from guardian.shortcuts import assign_perm

        org = baker.make(Organization, name="Test Org")
        user = baker.make(User)
        user.set_password("testpass")
        user.save()
        org.add_user(user)
        assign_perm("access_org_portal", user, org)
        return org, user

    def test_unauthenticated_returns_error(self) -> None:
        response = self.execute_graphql(
            REPORT_SUMMARY_QUERY,
            {
                "startDate": "2025-01-01",
                "endDate": "2025-01-31",
            },
        )
        self.assertGraphQLUnauthenticated(response)

    def test_user_without_permission_gets_error(self) -> None:
        org = baker.make(Organization, name="Test Org")
        user = baker.make(User)
        user.set_password("testpass")
        user.save()
        org.add_user(user)
        self.graphql_client.force_login(user)
        response = self.execute_graphql(
            REPORT_SUMMARY_QUERY,
            {
                "startDate": "2025-01-01",
                "endDate": "2025-01-31",
            },
        )
        self.assertTrue(response.get("errors") is not None or response["data"]["reportSummary"] is None)

    def test_summary_returns_correct_data(self) -> None:
        org, user = self._setup_org_user_with_access()
        baker.make(
            Note,
            organization=org,
            interacted_at=timezone.make_aware(datetime(2025, 1, 10, 12, 0, 0)),
            purpose="Outreach",
            team="echo_park_outreach",
            _quantity=3,
        )
        baker.make(
            Note,
            organization=org,
            interacted_at=timezone.make_aware(datetime(2025, 1, 20, 12, 0, 0)),
            purpose="Follow-up",
            team="hollywood_outreach",
            _quantity=2,
        )
        self.graphql_client.force_login(user)
        response = self.execute_graphql(
            REPORT_SUMMARY_QUERY,
            {
                "startDate": "2025-01-01",
                "endDate": "2025-01-31",
            },
        )
        self.assertIsNone(response.get("errors"))
        data = response["data"]["reportSummary"]
        self.assertEqual(data["totalNotes"], 5)
        self.assertEqual(data["startDate"], "2025-01-01")
        self.assertEqual(data["endDate"], "2025-01-31")
        self.assertEqual(len(data["notesByDate"]), 2)
        self.assertEqual(len(data["notesByTeam"]), 2)
        self.assertEqual(len(data["notesByPurpose"]), 2)
        self.assertIsInstance(data["topProvidedServices"], list)
        self.assertIsInstance(data["topRequestedServices"], list)

    def test_summary_empty_range(self) -> None:
        org, user = self._setup_org_user_with_access()
        self.graphql_client.force_login(user)
        response = self.execute_graphql(
            REPORT_SUMMARY_QUERY,
            {
                "startDate": "2024-06-01",
                "endDate": "2024-06-30",
            },
        )
        self.assertIsNone(response.get("errors"))
        data = response["data"]["reportSummary"]
        self.assertEqual(data["totalNotes"], 0)
        self.assertEqual(data["notesByDate"], [])
        self.assertEqual(data["notesByTeam"], [])

    def test_summary_filters_by_org(self) -> None:
        org, user = self._setup_org_user_with_access()
        other_org = baker.make(Organization, name="Other Org")
        baker.make(
            Note,
            organization=org,
            interacted_at=timezone.make_aware(datetime(2025, 1, 15, 12, 0, 0)),
            _quantity=2,
        )
        baker.make(
            Note,
            organization=other_org,
            interacted_at=timezone.make_aware(datetime(2025, 1, 15, 12, 0, 0)),
            _quantity=5,
        )
        self.graphql_client.force_login(user)
        response = self.execute_graphql(
            REPORT_SUMMARY_QUERY,
            {
                "startDate": "2025-01-01",
                "endDate": "2025-01-31",
            },
        )
        self.assertIsNone(response.get("errors"))
        data = response["data"]["reportSummary"]
        self.assertEqual(data["totalNotes"], 2)

    def test_summary_defaults_when_no_dates(self) -> None:
        org, user = self._setup_org_user_with_access()
        self.graphql_client.force_login(user)
        response = self.execute_graphql(REPORT_SUMMARY_QUERY, {})
        self.assertIsNone(response.get("errors"))
        data = response["data"]["reportSummary"]
        self.assertIsNotNone(data["startDate"])
        self.assertIsNotNone(data["endDate"])
        self.assertIsInstance(data["totalNotes"], int)
