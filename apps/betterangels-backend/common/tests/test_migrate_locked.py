from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from django.contrib.auth.models import Permission
from django.core.management import CommandError, call_command

from accounts.models import Role

ADVISORY = "common.management.commands.migrate_locked.pglock.advisory"
MIGRATE = "common.management.commands.migrate_locked.call_command"


def _lock(acquired: bool = True) -> MagicMock:
    lock = MagicMock()
    lock.acquire.return_value = acquired
    return lock


def test_runs_migrate_under_the_lock() -> None:
    """Migration and the handlers it triggers are single-writer."""
    order: list[str] = []

    def acquire() -> bool:
        order.append("acquire")
        return True

    def migrate(*args: Any, **kwargs: Any) -> None:
        order.append("migrate")

    lock = _lock()
    lock.acquire.side_effect = acquire
    lock.release.side_effect = lambda: order.append("release")
    with patch(ADVISORY, return_value=lock), patch(MIGRATE) as migrate_mock:
        migrate_mock.side_effect = migrate
        call_command("migrate_locked")

    assert order == ["acquire", "migrate", "release"]
    migrate_mock.assert_called_once_with("migrate", interactive=False, verbosity=1)


def test_releases_the_lock_when_migrate_fails() -> None:
    lock = _lock()
    with (
        patch(ADVISORY, return_value=lock),
        patch(MIGRATE, side_effect=RuntimeError("migration failed")),
        pytest.raises(RuntimeError, match="migration failed"),
    ):
        call_command("migrate_locked")

    lock.release.assert_called_once()


def test_times_out_with_a_command_error() -> None:
    """The wait is bounded; a stuck holder fails the task instead of hanging it."""
    with (
        patch(ADVISORY, return_value=_lock(acquired=False)),
        pytest.raises(CommandError, match="held the migration lock"),
    ):
        call_command("migrate_locked", timeout=5)


@pytest.mark.django_db
def test_empty_plan_repairs_a_stale_role() -> None:
    """The handlers actually run: a dropped code-owned permission comes back."""
    role = Role.objects.get(name="Caseworker")
    permission = Permission.objects.get(content_type__app_label="tasks", codename="view_task")
    role.permissions.remove(permission)

    call_command("migrate_locked", timeout=30)

    assert role.permissions.filter(pk=permission.pk).exists()
