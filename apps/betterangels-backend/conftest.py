from pathlib import Path

import pytest
from model_bakery import baker
from organizations.fields import SlugField
from pytest_django.fixtures import SettingsWrapper

from test_utils.vcr_config import scrubbed_vcr

# ``organizations.fields.SlugField`` comes from django-extensions and model_bakery
# has no generator for it, so any test that bakes an Organization fails without
# this.  Registered here rather than per-app because Organizations are shared test
# furniture, not a reports concern.
baker.generators.add(SlugField, lambda: baker.seq("org-"))  # type: ignore[no-untyped-call]


@pytest.fixture(autouse=True)
def _no_rate_limits(settings: SettingsWrapper) -> None:
    """Rate limits are a production concern and no test asserts one.

    Left on, allauth's login-code limits are cached and every test's login
    spends them, so later tests in the same process would start failing.
    ``False`` is required -- an empty dict is merged into the defaults.
    """
    settings.ACCOUNT_RATE_LIMITS = False


@pytest.fixture(autouse=True)
def _set_relative_vcr_dir(request: pytest.FixtureRequest) -> None:
    """Always override cassette path to module-relative directory."""
    test_file = Path(request.path)
    scrubbed_vcr.cassette_library_dir = str(test_file.parent / "cassettes")
