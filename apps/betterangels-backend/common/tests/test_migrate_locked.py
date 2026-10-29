from typing import Any

import pytest
from django.core.management import call_command

from common.management.commands.migrate_locked import _MIGRATION_LOCK_KEY, _MIGRATION_LOCK_NAMESPACE


def test_lock_key_is_namespaced_away_from_regions() -> None:
    # regions rebuild locks are 0x52455053 ("REPS") in the high 32 bits.
    assert _MIGRATION_LOCK_KEY >> 32 == _MIGRATION_LOCK_NAMESPACE
    assert _MIGRATION_LOCK_NAMESPACE != 0x52455053


@pytest.mark.django_db
def test_no_pending_migrations_is_a_no_op(capsys: Any) -> None:
    # pytest-django builds the test database from the migration graph, so the plan is empty.
    call_command("migrate_locked")

    assert "no pending migrations" in capsys.readouterr().out
