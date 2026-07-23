from pathlib import Path

import pytest
from test_utils.vcr_config import scrubbed_vcr


@pytest.fixture(autouse=True)
def _set_relative_vcr_dir(request: pytest.FixtureRequest) -> None:
    """Always override cassette path to module-relative directory."""
    test_file = Path(request.path)
    scrubbed_vcr.cassette_library_dir = str(test_file.parent / "cassettes")


@pytest.fixture(scope="session", autouse=True)
def _tune_test_settings(django_db_setup: None) -> None:
    """Optimize Django settings for test speed (PG tuning is handled by docker-compose)."""
    from django.conf import settings

    # Django: skip expensive password hashing in tests
    settings.PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

    # Use in-memory cache in tests — removes Redis dependency, eliminates network round-trips
    settings.CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        }
    }




