"""Shared fixtures and test configuration for reports app tests."""

import pytest
from pytest_django.fixtures import SettingsWrapper

from test_utils.timezones import SITE_TIME_ZONE


@pytest.fixture(autouse=True)
def _site_time_zone(settings: SettingsWrapper) -> None:
    """Pin the site calendar for every report test.

    A report's days are cut on its organization's calendar, which falls back to
    ``settings.TIME_ZONE`` for any org that has not named one — so a test asserting
    a boundary is asserting a property of *that* zone.  Left to the environment,
    the suite passes or fails depending on how the machine running it is
    configured: under ``TIME_ZONE=UTC`` the migration and boundary tests fail,
    because 21:30 on 31 January in Los Angeles is already 1 February in UTC.

    Tests whose subject *is* the calendar still set it themselves; this only stops
    the ones that merely depend on it from inheriting an arbitrary answer.
    """
    settings.TIME_ZONE = SITE_TIME_ZONE
