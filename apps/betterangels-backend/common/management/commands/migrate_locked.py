"""Apply migrations under a database-wide advisory lock.

``manage.py migrate`` is not safe against a *concurrent* second run: each process
computes its own plan and both can try the same DDL. This command serialises
migration with a session-level Postgres advisory lock (``pglock.advisory``),
which is what lets a web task run it on start instead of a dedicated stage.

``migrate`` is also what runs the pre/post-migrate handlers, where
``accounts.apps`` applies the code-owned roles and permission templates. Those
rows change with the release rather than with the schema, so an empty plan is
not a no-op: the handlers have to run on every start, and under the same lock —
outside it they would race an in-flight migration and each other.

The wait is bounded: ``pg_advisory_lock`` blocks inside Postgres (no polling)
under a ``lock_timeout`` of ``--timeout`` seconds, so a stuck holder raises
instead of hanging until ECS kills the task. The timeout applies to the *wait*
only; a migration that has started is never interrupted. The session lock is
released in ``finally`` and by Postgres when the process exits.
"""

from __future__ import annotations

import contextlib
from typing import Any

import pglock
from django.core.management import BaseCommand, CommandError, call_command

#: High 32 bits of the advisory-lock key; "MIGR" is a mnemonic. Advisory locks are a
#: shared namespace on the database, so this keeps the migration lock clear of
#: regions' "REPS" rebuild locks (``regions.services._pieces_lock_key``).
_MIGRATION_LOCK_NAMESPACE = 0x4D494752  # "MIGR"
_MIGRATION_LOCK_KEY = _MIGRATION_LOCK_NAMESPACE << 32

#: Generous enough for any migration we have seen, short enough that a stuck
#: holder fails the deploy with a clear error instead of hanging forever.
_DEFAULT_TIMEOUT_SECONDS = 1800


class Command(BaseCommand):
    help = "Apply migrations, serialised with a Postgres advisory lock."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument(
            "--timeout",
            type=float,
            default=_DEFAULT_TIMEOUT_SECONDS,
            help="Seconds to wait for the lock; 0 waits indefinitely.",
        )

    def handle(self, *args: Any, timeout: float, **options: Any) -> None:
        if timeout < 0:
            raise CommandError("--timeout must be zero or positive")

        lock = pglock.advisory(
            _MIGRATION_LOCK_KEY,
            timeout=None if timeout == 0 else timeout,
        )

        self.stdout.write(f"waiting for the migration lock (timeout: {timeout or 'none'}s)")
        if not lock.acquire():
            raise CommandError(f"another process held the migration lock for more than {timeout}s")

        try:
            # An empty plan still runs the pre/post-migrate handlers.
            call_command("migrate", interactive=False, verbosity=1)
        finally:
            # The session releases the lock on exit either way; this just frees waiters sooner.
            with contextlib.suppress(Exception):
                lock.release()
