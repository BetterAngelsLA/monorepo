from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from django.core.management import CommandError, call_command

from common.management.commands.migrate_locked import _MIGRATION_LOCK_KEY, _MIGRATION_LOCK_NAMESPACE

ADVISORY = "common.management.commands.migrate_locked.pglock.advisory"
PENDING = "common.management.commands.migrate_locked.Command._pending"
MIGRATE = "common.management.commands.migrate_locked.call_command"


def _lock(acquired: bool = True) -> MagicMock:
    lock = MagicMock()
    lock.acquire.return_value = acquired
    return lock


def test_lock_key_is_namespaced_away_from_regions() -> None:
    # regions rebuild locks are 0x52455053 ("REPS") in the high 32 bits.
    assert _MIGRATION_LOCK_KEY >> 32 == _MIGRATION_LOCK_NAMESPACE
    assert _MIGRATION_LOCK_NAMESPACE != 0x52455053


def test_no_pending_migrations_never_takes_the_lock(capsys: Any) -> None:
    """The early exit must not even attempt the advisory lock."""
    with patch(PENDING, return_value=False), patch(ADVISORY) as advisory:
        call_command("migrate_locked")

    assert "no pending migrations" in capsys.readouterr().out
    advisory.assert_not_called()


def test_pending_migrations_apply_under_the_lock(capsys: Any) -> None:
    lock = _lock()
    with (
        patch(PENDING, return_value=True),
        patch(ADVISORY, return_value=lock) as advisory,
        patch(MIGRATE) as migrate,
    ):
        call_command("migrate_locked")

    advisory.assert_called_once_with(_MIGRATION_LOCK_KEY, timeout=1800)
    lock.acquire.assert_called_once()
    migrate.assert_called_once()
    assert migrate.call_args.kwargs == {"interactive": False, "verbosity": 1}
    lock.release.assert_called_once()


def test_reports_already_applied_when_plan_emptied_under_the_lock(capsys: Any) -> None:
    lock = _lock()
    with (
        patch(PENDING, side_effect=[True, False]),
        patch(ADVISORY, return_value=lock),
        patch(MIGRATE) as migrate,
    ):
        call_command("migrate_locked")

    assert "migrations already applied by another process" in capsys.readouterr().out
    migrate.assert_not_called()
    lock.release.assert_called_once()


def test_timeout_zero_waits_indefinitely() -> None:
    lock = _lock()
    with (
        patch(PENDING, return_value=True),
        patch(ADVISORY, return_value=lock) as advisory,
        patch(MIGRATE),
    ):
        call_command("migrate_locked", timeout=0)

    advisory.assert_called_once_with(_MIGRATION_LOCK_KEY, timeout=None)


def test_times_out_with_a_command_error() -> None:
    lock = _lock(acquired=False)
    with (
        patch(PENDING, return_value=True),
        patch(ADVISORY, return_value=lock),
        pytest.raises(CommandError, match="held the migration lock"),
    ):
        call_command("migrate_locked", timeout=5)

    lock.release.assert_not_called()


def test_release_failure_does_not_mask_the_result(capsys: Any) -> None:
    lock = _lock()
    lock.release.side_effect = RuntimeError("connection gone")
    with (
        patch(PENDING, return_value=True),
        patch(ADVISORY, return_value=lock),
        patch(MIGRATE),
    ):
        call_command("migrate_locked")

    assert "applying migrations" in capsys.readouterr().out
