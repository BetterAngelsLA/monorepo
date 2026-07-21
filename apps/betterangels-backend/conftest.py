from pathlib import Path

import pytest
from test_utils.vcr_config import scrubbed_vcr


@pytest.fixture(autouse=True)
def _set_relative_vcr_dir(request: pytest.FixtureRequest) -> None:
    """Always override cassette path to module-relative directory."""
    test_file = Path(request.path)
    scrubbed_vcr.cassette_library_dir = str(test_file.parent / "cassettes")


@pytest.fixture(scope="session", autouse=True)
def _tune_test_postgres(django_db_setup: None, django_db_blocker: object) -> None:
    """Disable durability guarantees on test DBs — safe, big speedup."""
    from django.db import connection

    with django_db_blocker.unblock(), connection.cursor() as c:  # type: ignore[union-attr]
        c.execute("SET synchronous_commit TO off")


# ── Test timing instrumentation ──────────────────────────────────────────

_TIMING_LOG = Path(__file__).resolve().parent.parent.parent / "logs" / "test_timing.log"
_TIMING_LOG.parent.mkdir(parents=True, exist_ok=True)


def pytest_sessionstart(session: pytest.Session) -> None:
    """Record session start time."""
    import time

    session.config._timing_start = time.monotonic()  # type: ignore[attr-defined]


def pytest_sessionfinish(session: pytest.Session, exitstatus: int) -> None:
    """Log session duration."""
    import time

    start: float = getattr(session.config, "_timing_start", 0)
    elapsed = time.monotonic() - start
    worker = getattr(session.config, "workerinput", {}).get("workerid", "master")
    msg = f"[{worker}] session: {elapsed:.1f}s (exit={exitstatus})\n"
    with open(_TIMING_LOG, "a") as f:
        f.write(msg)

    if worker == "master":
        # Print a summary line so it appears in CI logs.
        print(f"\n⏱  Test session duration: {elapsed:.1f}s")
