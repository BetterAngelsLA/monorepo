import datetime

import time_machine
from common.tests.utils import GraphQLBaseTestCase
from django.contrib.auth.models import Permission
from model_bakery import baker
from organizations.models import Organization

from shelters.models import Bed, Shelter
from shelters.tests.baker_recipes import shelter_recipe

# A fixed instant comfortably mid-afternoon in LA (the resolver's reporting
# timezone), so "today" is unambiguous regardless of when the suite runs.
_FROZEN_NOW = datetime.datetime(2026, 3, 15, 20, 0, tzinfo=datetime.timezone.utc)
_FROZEN_LA_TODAY = datetime.date(2026, 3, 15)


class ShelterOccupancyMetricsQueryTestCase(GraphQLBaseTestCase):
    SHELTER_OCCUPANCY_METRICS_QUERY = """
        query ShelterOccupancyMetrics(
            $shelterId: ID!
            $startDate: Date
            $endDate: Date
            $demographics: [DemographicChoices!]
        ) {
            shelterOccupancyMetrics(
                shelterId: $shelterId
                startDate: $startDate
                endDate: $endDate
                demographics: $demographics
            ) {
                shelterId
                startDate
                endDate
                dailyOccupancy { date occupiedCount totalBeds occupancyPct }
                dailyBedStatus { date available occupied reserved outOfService inTurnaround }
                reservationMetrics { checkInOverdue cancelled checkedIn checkInOverdueToCheckedIn }
                avgDaysToOccupancy
            }
        }
    """

    def setUp(self) -> None:
        super().setUp()
        self.shelter = shelter_recipe.make(organization=self.org_1)
        self.other_org_shelter = shelter_recipe.make(organization=self.org_2)

    def _add_shelter_view_permission(self, org: Organization) -> None:
        from notes.groups import CASEWORKER

        app_label, codename = Shelter.perms.VIEW.split(".")
        perm = Permission.objects.get(codename=codename, content_type__app_label=app_label)
        org.permission_groups.get(template__name=CASEWORKER.name).group.permissions.add(perm)

    def test_unauthenticated(self) -> None:
        self.graphql_client.logout()

        response = self.execute_graphql(
            self.SHELTER_OCCUPANCY_METRICS_QUERY,
            variables={"shelterId": str(self.shelter.pk)},
        )

        self.assertGraphQLUnauthenticated(response)

    def test_without_shelter_view_permission(self) -> None:
        """A user without shelter view permission gets a not-found, like other entity selectors.

        ``shelter_get`` folds "lacks permission" and "doesn't exist" into the
        same 404-style message (see ``bed_get``/``reservation_get``/``room_get``),
        so this deliberately isn't a distinct 403.
        """
        self.graphql_client.force_login(self.non_case_manager_user)

        response = self.execute_graphql(
            self.SHELTER_OCCUPANCY_METRICS_QUERY,
            variables={"shelterId": str(self.shelter.pk)},
        )

        self.assertIsNone(response["data"])
        self.assertIn(
            f"Shelter matching ID {self.shelter.pk} could not be found.",
            response["errors"][0]["message"],
        )

    def test_shelter_in_other_org_is_not_found(self) -> None:
        """A user can't pull metrics for a shelter outside their organization."""
        self._add_shelter_view_permission(self.org_1)
        self.graphql_client.force_login(self.org_1_case_manager_1)

        response = self.execute_graphql(
            self.SHELTER_OCCUPANCY_METRICS_QUERY,
            variables={"shelterId": str(self.other_org_shelter.pk)},
        )

        self.assertIsNone(response["data"])
        self.assertIn(
            f"Shelter matching ID {self.other_org_shelter.pk} could not be found.",
            response["errors"][0]["message"],
        )

    def test_defaults_to_last_30_days(self) -> None:
        self._add_shelter_view_permission(self.org_1)
        self.graphql_client.force_login(self.org_1_case_manager_1)
        baker.make(Bed, shelter=self.shelter, name="Bed 1")

        response = self.execute_graphql(
            self.SHELTER_OCCUPANCY_METRICS_QUERY,
            variables={"shelterId": str(self.shelter.pk)},
        )

        payload = response["data"]["shelterOccupancyMetrics"]
        start = datetime.date.fromisoformat(payload["startDate"])
        end = datetime.date.fromisoformat(payload["endDate"])
        self.assertEqual((end - start).days, 29)
        self.assertEqual(len(payload["dailyOccupancy"]), 30)
        self.assertEqual(len(payload["dailyBedStatus"]), 30)

    def test_explicit_date_range_and_metrics_shape(self) -> None:
        self._add_shelter_view_permission(self.org_1)
        self.graphql_client.force_login(self.org_1_case_manager_1)
        baker.make(Bed, shelter=self.shelter, name="Bed 1")

        response = self.execute_graphql(
            self.SHELTER_OCCUPANCY_METRICS_QUERY,
            variables={
                "shelterId": str(self.shelter.pk),
                "startDate": "2026-01-01",
                "endDate": "2026-01-03",
            },
        )

        payload = response["data"]["shelterOccupancyMetrics"]
        self.assertEqual(payload["shelterId"], str(self.shelter.pk))
        self.assertEqual(payload["startDate"], "2026-01-01")
        self.assertEqual(payload["endDate"], "2026-01-03")
        self.assertEqual(len(payload["dailyOccupancy"]), 3)
        self.assertEqual(len(payload["dailyBedStatus"]), 3)
        self.assertEqual(
            payload["reservationMetrics"],
            {
                "checkInOverdue": 0,
                "cancelled": 0,
                "checkedIn": 0,
                "checkInOverdueToCheckedIn": 0,
            },
        )
        self.assertIsNone(payload["avgDaysToOccupancy"])

    def test_accepts_demographics_argument(self) -> None:
        """demographics is accepted without error, even though it isn't applied yet.

        Guards against a regression/removal of the argument while the actual
        filtering support (blocked on pghistory M2M tracking) is pending.
        """
        self._add_shelter_view_permission(self.org_1)
        self.graphql_client.force_login(self.org_1_case_manager_1)
        baker.make(Bed, shelter=self.shelter, name="Bed 1")

        response = self.execute_graphql(
            self.SHELTER_OCCUPANCY_METRICS_QUERY,
            variables={
                "shelterId": str(self.shelter.pk),
                "startDate": "2026-01-01",
                "endDate": "2026-01-03",
                "demographics": ["SINGLE_MEN"],
            },
        )

        self.assertNotIn("errors", response)
        payload = response["data"]["shelterOccupancyMetrics"]
        self.assertEqual(payload["shelterId"], str(self.shelter.pk))
        self.assertEqual(len(payload["dailyBedStatus"]), 3)

    @time_machine.travel(_FROZEN_NOW, tick=False)
    def test_only_start_date_defaults_end_to_today(self) -> None:
        self._add_shelter_view_permission(self.org_1)
        self.graphql_client.force_login(self.org_1_case_manager_1)
        baker.make(Bed, shelter=self.shelter, name="Bed 1")

        start_date = _FROZEN_LA_TODAY - datetime.timedelta(days=10)

        response = self.execute_graphql(
            self.SHELTER_OCCUPANCY_METRICS_QUERY,
            variables={"shelterId": str(self.shelter.pk), "startDate": start_date.isoformat()},
        )

        payload = response["data"]["shelterOccupancyMetrics"]
        self.assertEqual(payload["startDate"], start_date.isoformat())
        self.assertEqual(payload["endDate"], _FROZEN_LA_TODAY.isoformat())
        self.assertEqual(len(payload["dailyOccupancy"]), 11)
        self.assertEqual(len(payload["dailyBedStatus"]), 11)

    @time_machine.travel(_FROZEN_NOW, tick=False)
    def test_only_end_date_defaults_start_to_30_days_prior(self) -> None:
        self._add_shelter_view_permission(self.org_1)
        self.graphql_client.force_login(self.org_1_case_manager_1)
        baker.make(Bed, shelter=self.shelter, name="Bed 1")

        end_date = _FROZEN_LA_TODAY - datetime.timedelta(days=5)
        expected_start = end_date - datetime.timedelta(days=29)

        response = self.execute_graphql(
            self.SHELTER_OCCUPANCY_METRICS_QUERY,
            variables={"shelterId": str(self.shelter.pk), "endDate": end_date.isoformat()},
        )

        payload = response["data"]["shelterOccupancyMetrics"]
        self.assertEqual(payload["startDate"], expected_start.isoformat())
        self.assertEqual(payload["endDate"], end_date.isoformat())
        self.assertEqual(len(payload["dailyOccupancy"]), 30)
        self.assertEqual(len(payload["dailyBedStatus"]), 30)
