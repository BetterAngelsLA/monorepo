from pathlib import Path

import pytest
from pytest_django.fixtures import SettingsWrapper
from test_utils.vcr_config import scrubbed_vcr


@pytest.fixture(autouse=True)
def _no_rate_limits(settings: SettingsWrapper) -> None:
    """Rate limits are a production concern and no test asserts one.

    Left on, allauth's login-code limits are cached in a Redis instance every run
    on this machine shares, so limits one run consumes are still spent on the next.
    ``False`` is required -- an empty dict is merged into the defaults.
    """
    settings.ACCOUNT_RATE_LIMITS = False


@pytest.fixture(autouse=True)
def _set_relative_vcr_dir(request: pytest.FixtureRequest) -> None:
    """Always override cassette path to module-relative directory."""
    test_file = Path(request.path)
    scrubbed_vcr.cassette_library_dir = str(test_file.parent / "cassettes")
