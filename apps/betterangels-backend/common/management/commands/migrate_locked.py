"""Apply pending migrations under a database-wide advisory lock.

``manage.py migrate`` is not safe against a *concurrent* second run: each process
computes its own plan and both can try the same DDL. This command serialises
migration with a session-level Postgres advisory lock (``pglock.advisory``),
which is what lets a web task run it on start instead of a dedicated stage.

The wait is bounded: ``pg_advisory_lock`` blocks inside Postgres (no polling)
under a ``lock_timeout`` of ``--timeout`` seconds, so a stuck holder raises
instead of hanging until ECS kills the task. The timeout applies to the *wait*
only; a migration that has started is never interrupted. The session lock is
released in ``finally`` and by Postgres when the process exits.

If the holder is killed mid-migration the lock is released and a follower retries
the plan. Transactional DDL rolls back, but a non-transactional step (e.g.
``CREATE INDEX CONCURRENTLY``) can leave an invalid object behind, so that retry
may need manual cleanup.
"""

from __future__ import annotations

import contextlib
from typing import Any

import pglock
from django.core.management import BaseCommand, CommandError, call_command
from django.db import DEFAULT_DB_ALIAS, connections
from django.db.migrations.executor import MigrationExecutor

#: High 32 bits of the advisory-lock key; "MIGR" is a mnemonic. Advisory locks are a
#: shared namespace on the database, so this keeps the migration lock clear of
#: regions' "REPS" rebuild locks (``regions.services._pieces_lock_key``).
_MIGRATION_LOCK_NAMESPACE = 0x4D494752  # "MIGR"
_MIGRATION_LOCK_KEY = _MIGRATION_LOCK_NAMESPACE << 32

#: Generous enough for any migration we have seen, short enough that a stuck
#: holder fails the deploy with a clear error instead of hanging forever.
_DEFAULT_TIMEOUT_SECONDS = 1800


class Command(BaseCommand):
    help = "Apply pending migrations, serialised with a Postgres advisory lock."

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

        connection = connections[DEFAULT_DB_ALIAS]

        # Cheap path: every deploy with no schema change stops here, without taking a lock.
        if not self._pending(connection):
            self.stdout.write("no pending migrations")
            return

        lock = pglock.advisory(
            _MIGRATION_LOCK_KEY,
            timeout=None if timeout == 0 else timeout,
        )

        self.stdout.write(f"waiting for the migration lock (timeout: {timeout or 'none'}s)")
        if not lock.acquire():
            raise CommandError(f"another process held the migration lock for more than {timeout}s")

        try:
            # Re-check under the lock: the holder may have applied them while we waited.
            if self._pending(connection):
                self.stdout.write("applying migrations")
                call_command("migrate", interactive=False, verbosity=1)
            else:
                self.stdout.write("migrations already applied by another process")
        finally:
            # The session releases the lock on exit either way; this just frees waiters sooner.
            with contextlib.suppress(Exception):
                lock.release()

    @staticmethod
    def _pending(connection: Any) -> bool:
        executor = MigrationExecutor(connection)
        return bool(executor.migration_plan(executor.loader.graph.leaf_nodes()))
