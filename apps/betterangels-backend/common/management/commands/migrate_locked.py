"""Apply pending migrations under a database-wide advisory lock.

``manage.py migrate`` is not safe against a *concurrent* second run: each process
computes its own plan and both can try the same DDL. This command makes the
migration a single-writer operation, which is what lets a web task run it on
start instead of a dedicated pipeline stage.

The lock is a session-scoped Postgres advisory lock (``pg_advisory_xact_lock``
would be released at the first per-migration commit). Followers wait rather than
fail on a timer: the only correct deadline is "longer than the slowest
migration", which is not knowable here.
"""

from __future__ import annotations

import time
from typing import Any

from django.core.management import BaseCommand, call_command
from django.db import DEFAULT_DB_ALIAS, connections
from django.db.migrations.executor import MigrationExecutor

#: High 32 bits of the advisory-lock key; "MIGR" is a mnemonic. Advisory locks are a
#: shared namespace on the database, so this keeps the migration lock clear of
#: regions' "REPS" rebuild locks (``regions.services._pieces_lock_key``).
_MIGRATION_LOCK_NAMESPACE = 0x4D494752  # "MIGR"
_MIGRATION_LOCK_KEY = _MIGRATION_LOCK_NAMESPACE << 32


class Command(BaseCommand):
    help = "Apply pending migrations, serialised with a Postgres advisory lock."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument("--poll-interval", type=float, default=2.0)

    def handle(self, *args: Any, poll_interval: float, **options: Any) -> None:
        connection = connections[DEFAULT_DB_ALIAS]

        # Cheap path: every deploy with no schema change stops here, without taking a lock.
        if not self._pending(connection):
            self.stdout.write("no pending migrations")
            return

        with connection.cursor() as cursor:
            waiting = False
            while True:
                cursor.execute("SELECT pg_try_advisory_lock(%s)", [_MIGRATION_LOCK_KEY])
                if cursor.fetchone()[0]:
                    break
                if not waiting:
                    self.stdout.write("another process holds the migration lock; waiting")
                    waiting = True
                time.sleep(poll_interval)

            try:
                # Re-check under the lock: the holder may have applied them while we waited.
                if self._pending(connection):
                    self.stdout.write("applying migrations")
                    call_command("migrate", interactive=False, verbosity=1)
                else:
                    self.stdout.write("migrations already applied by another process")
            finally:
                try:
                    cursor.execute("SELECT pg_advisory_unlock(%s)", [_MIGRATION_LOCK_KEY])
                except Exception:  # noqa: BLE001 - never mask the migration error; the lock dies with the session
                    pass

    @staticmethod
    def _pending(connection: Any) -> bool:
        executor = MigrationExecutor(connection)
        return bool(executor.migration_plan(executor.loader.graph.leaf_nodes()))
