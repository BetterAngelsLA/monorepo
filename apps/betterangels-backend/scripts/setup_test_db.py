"""Create and migrate the base test DB used as the CI cache template."""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "betterangels_backend.settings_test")

import django

django.setup()

from django.db import connections  # noqa: E402
from django.test.utils import setup_databases  # noqa: E402

setup_databases(verbosity=0, interactive=False, keepdb=False)
for connection in connections.all():
    connection.close()
print("base test database is migrated")
