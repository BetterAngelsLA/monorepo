"""Shared fixtures and test configuration for reports app tests."""

import pytest
from model_bakery import baker
from organizations.fields import SlugField
from pytest_django.fixtures import SettingsWrapper
from test_utils.timezones import SITE_TIME_ZONE

# Ensure model_bakery can generate slugs for Organization
baker.generators.add(SlugField, lambda: baker.seq("org-"))  # type: ignore[no-untyped-call]


@pytest.fixture(autouse=True)
def _site_time_zone(settings: SettingsWrapper) -> None:
    """Pin the site calendar for every report test.

    Reports cut their boundaries on ``settings.TIME_ZONE`` — that is the point of
    the app — so a test asserting a boundary is asserting a property of *this*
    zone.  Left to the environment, the suite passes or fails depending on how the
    machine running it is configured: under ``TIME_ZONE=UTC`` the migration and
    boundary tests fail, because 21:30 on 31 January in Los Angeles is already
    1 February in UTC.

    Tests whose subject *is* the calendar still set it themselves; this only stops
    the ones that merely depend on it from inheriting an arbitrary answer.
    """
    settings.TIME_ZONE = SITE_TIME_ZONE
