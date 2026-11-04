from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from django.core.management import CommandError, call_command

ADVISORY = "common.management.commands.migrate_locked.pglock.advisory"
PENDING = "common.management.commands.migrate_locked.Command._pending"
MIGRATE = "common.management.commands.migrate_locked.call_command"


def _lock(acquired: bool = True) -> MagicMock:
    lock = MagicMock()
    lock.acquire.return_value = acquired
    return lock


def test_no_pending_migrations_never_takes_the_lock(capsys: Any) -> None:
    """The cheap path every schema-free deploy relies on."""
    with patch(PENDING, return_value=False), patch(ADVISORY) as advisory:
        call_command("migrate_locked")

    assert "no pending migrations" in capsys.readouterr().out
    advisory.assert_not_called()


def test_applies_non_interactively_then_reports_already_applied(capsys: Any) -> None:
    """The holder migrates; a follower that wakes later must not migrate again."""
    with (
        patch(PENDING, return_value=True),
        patch(ADVISORY, return_value=_lock()),
        patch(MIGRATE) as migrate,
    ):
        call_command("migrate_locked")

    migrate.assert_called_once()
    assert migrate.call_args.kwargs == {"interactive": False, "verbosity": 1}
    assert "applying migrations" in capsys.readouterr().out

    with (
        patch(PENDING, side_effect=[True, False]),
        patch(ADVISORY, return_value=_lock()),
        patch(MIGRATE) as migrate,
    ):
        call_command("migrate_locked")

    assert "migrations already applied by another process" in capsys.readouterr().out
    migrate.assert_not_called()


def test_times_out_with_a_command_error() -> None:
    """The wait is bounded; a stuck holder fails the task instead of hanging it."""
    with (
        patch(PENDING, return_value=True),
        patch(ADVISORY, return_value=_lock(acquired=False)),
        pytest.raises(CommandError, match="held the migration lock"),
    ):
        call_command("migrate_locked", timeout=5)
