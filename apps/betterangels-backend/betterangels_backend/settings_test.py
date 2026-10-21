"""Settings for the test suite.

Selected with ``DJANGO_SETTINGS_MODULE=betterangels_backend.settings_test``
(see ``pyproject.toml``).  The goal is to keep tests fast and isolated without
changing production behaviour:

* ``DEBUG = False`` — Django otherwise wraps every cursor in
  ``CursorDebugWrapper`` and accumulates ``connection.queries`` for the whole
  run.  Measured at roughly 12% of suite time.
* A per-process ``KEY_PREFIX`` on the shared Redis cache — Redis TTLs are
  server-side, which matters because tests use ``time_machine`` (a local
  ``LocMemCache`` would expire sessions under simulated time).  The prefix
  keeps parallel workers from invalidating each other's waffle/session entries,
  which is what made exact query-count assertions flaky under xdist.
* ``MD5PasswordHasher`` — password strength is not what these tests assert;
  PBKDF2 costs ~100 ms per ``create_user``/``set_password``.

Everything else is inherited unchanged from ``betterangels_backend.settings``.
"""

import uuid

from .settings import *  # noqa: F403

DEBUG = False

# Unique per process: serial runs and each xdist worker get their own namespace.
CACHES["default"]["KEY_PREFIX"] = f"betterangels-test-{uuid.uuid4().hex[:8]}"  # noqa: F405

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
