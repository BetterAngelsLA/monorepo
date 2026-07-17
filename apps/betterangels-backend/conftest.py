from pathlib import Path

import pytest
from test_utils.vcr_config import scrubbed_vcr


def _seed_test_data() -> None:
    """Idempotent seed for CI / --no-migrations runs.

    Called once per pytest session.  In normal runs post_migrate signals
    already seed the data, but with --no-migrations those signals never
    fire.  All seed functions use get_or_create so double-calling is safe.
    """
    from accounts.seed import seed_permission_templates
    from notes.seed import seed_organization_services
    from shelters.seed import seed_shelter_lookups

    seed_permission_templates()
    seed_organization_services()
    seed_shelter_lookups()


@pytest.fixture(autouse=True)
def _set_relative_vcr_dir(request: pytest.FixtureRequest) -> None:
    """Always override cassette path to module-relative directory."""
    test_file = Path(request.path)
    scrubbed_vcr.cassette_library_dir = str(test_file.parent / "cassettes")


@pytest.fixture(scope="session", autouse=True)
def _seed_test_session(django_db_setup, django_db_blocker):  # type: ignore[no-untyped-def]
    """Seed PermissionGroupTemplates, SPAs, services, etc. once per session."""
    with django_db_blocker.unblock():
        _seed_test_data()
