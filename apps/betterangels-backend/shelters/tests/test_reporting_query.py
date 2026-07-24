import datetime
from typing import Any

from django.test import TestCase
from shelters.enums import StatusChoices
from shelters.tests.baker_recipes import shelter_recipe
from shelters.tests.utils import ShelterTestCase


class ShelterOccupancyMetricsQueryTestCase(ShelterTestCase, TestCase):
    QUERY = """
        query ShelterOccupancyMetrics(
            $shelterId: ID!
            $startDate: Date!
            $endDate: Date!
        ) {
            shelterOccupancyMetrics(
                shelterId: $shelterId
                startDate: $startDate
                endDate: $endDate
            ) {
                shelterId
                startDate
                endDate
                avgDaysToOccupancy
                dailyOccupancy {
                    date
                    occupiedCount
                    totalBeds
                    occupancyPct
                }
                dailyBedStatus {
                    date
                    available
                    occupied
                    reserved
                    outOfService
                    inTurnaround
                }
                reservationMetrics {
                    checkInOverdue
                    cancelled
                    checkedIn
                    checkInOverdueToCheckedIn
                }
            }
        }
    """

    def setUp(self) -> None:
        super().setUp()
        self.shelter = shelter_recipe.make(
            organization=self.org,
            status=StatusChoices.APPROVED,
            is_private=False,
        )
        self.start_date = datetime.date(2026, 6, 1)
        self.end_date = datetime.date(2026, 6, 3)

    def _execute(self, **overrides: Any) -> dict:
        variables = {
            "shelterId": str(self.shelter.pk),
            "startDate": self.start_date.isoformat(),
            "endDate": self.end_date.isoformat(),
            **overrides,
        }
        return self.execute_graphql(self.QUERY, variables=variables)

    def test_returns_metrics_shape_for_accessible_shelter(self) -> None:
        self.graphql_client.force_login(self.operator)
        response = self._execute()

        self.assertIsNone(response.get("errors"), response.get("errors"))
        payload = response["data"]["shelterOccupancyMetrics"]
        self.assertEqual(payload["shelterId"], str(self.shelter.pk))
        self.assertEqual(payload["startDate"], "2026-06-01")
        self.assertEqual(payload["endDate"], "2026-06-03")
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

    def test_rejects_inverted_date_range(self) -> None:
        self.graphql_client.force_login(self.operator)
        response = self._execute(startDate="2026-06-10", endDate="2026-06-01")
        self.assertIsNotNone(response.get("errors"))

    def test_requires_authentication(self) -> None:
        response = self._execute()
        self.assertIsNotNone(response.get("errors"))
