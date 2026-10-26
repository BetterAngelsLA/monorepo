"""Fail if a restored test DB is not at the migration state on disk."""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "betterangels_backend.settings_test")

import django

django.setup()

from django.db import connection  # noqa: E402
from django.db.migrations.loader import MigrationLoader  # noqa: E402
from django.db.migrations.recorder import MigrationRecorder  # noqa: E402

loader = MigrationLoader(connection)
applied = set(MigrationRecorder(connection).applied_migrations())
expected = set(loader.disk_migrations)
missing = expected - applied
unknown = applied - expected

if missing or unknown:
    print(f"stale test DB: {len(missing)} missing, {len(unknown)} unknown")
    print("missing:", sorted(missing)[:5])
    print("unknown:", sorted(unknown)[:5])
    raise SystemExit(1)

print(f"test DB migration state is current ({len(applied)} migrations)")
