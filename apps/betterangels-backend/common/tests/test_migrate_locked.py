from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from django.core.management import call_command

from common.management.commands.migrate_locked import _MIGRATION_LOCK_KEY, _MIGRATION_LOCK_NAMESPACE


def test_lock_key_is_namespaced_away_from_regions() -> None:
    # regions rebuild locks are 0x52455053 ("REPS") in the high 32 bits.
    assert _MIGRATION_LOCK_KEY >> 32 == _MIGRATION_LOCK_NAMESPACE
    assert _MIGRATION_LOCK_NAMESPACE != 0x52455053


def test_reports_already_applied_when_plan_emptied_under_the_lock(capsys: Any) -> None:
    """Pre-check pending, lock acquired, plan empty by the time we own it."""
    cursor = MagicMock()
    cursor.__enter__.return_value = cursor
    cursor.__exit__.return_value = False
    cursor.fetchone.return_value = (True,)
    connection = MagicMock()
    connection.cursor.return_value = cursor

    with (
        patch("common.management.commands.migrate_locked.connections", {"default": connection}),
        patch("common.management.commands.migrate_locked.Command._pending", side_effect=[True, False]),
    ):
        call_command("migrate_locked")

    assert "migrations already applied by another process" in capsys.readouterr().out
    executed = " ".join(str(call.args[0]) for call in cursor.execute.call_args_list)
    assert "pg_try_advisory_lock" in executed
    assert "pg_advisory_unlock" in executed


def test_retries_while_another_process_holds_the_lock(capsys: Any) -> None:
    """The first try fails, the second succeeds: the loop and migrate are exercised."""
    cursor = MagicMock()
    cursor.__enter__.return_value = cursor
    cursor.__exit__.return_value = False
    cursor.fetchone.side_effect = [(False,), (True,)]
    connection = MagicMock()
    connection.cursor.return_value = cursor

    with (
        patch("common.management.commands.migrate_locked.connections", {"default": connection}),
        patch("common.management.commands.migrate_locked.Command._pending", side_effect=[True, True]),
        patch("common.management.commands.migrate_locked.call_command") as migrate,
        patch("common.management.commands.migrate_locked.time.sleep") as sleep,
    ):
        call_command("migrate_locked")

    out = capsys.readouterr().out
    assert "another process holds the migration lock; waiting" in out
    assert "applying migrations" in out
    migrate.assert_called_once()
    assert migrate.call_args.kwargs["interactive"] is False
    assert migrate.call_args.kwargs["verbosity"] == 1
    sleep.assert_called_once_with(2.0)
    executed = " ".join(str(call.args[0]) for call in cursor.execute.call_args_list)
    assert executed.count("pg_try_advisory_lock") == 2
    assert "pg_advisory_unlock" in executed


def test_no_pending_migrations_never_takes_the_lock(capsys: Any) -> None:
    """The early exit must not even attempt the advisory lock."""
    cursor = MagicMock()
    cursor.__enter__.return_value = cursor
    cursor.__exit__.return_value = False
    connection = MagicMock()
    connection.cursor.return_value = cursor

    with (
        patch("common.management.commands.migrate_locked.connections", {"default": connection}),
        patch("common.management.commands.migrate_locked.Command._pending", return_value=False),
    ):
        call_command("migrate_locked")

    assert "no pending migrations" in capsys.readouterr().out
    executed = " ".join(str(call.args[0]) for call in cursor.execute.call_args_list)
    assert "pg_try_advisory_lock" not in executed
