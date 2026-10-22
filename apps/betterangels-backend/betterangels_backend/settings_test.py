"""Settings for the test suite.

Selected with ``DJANGO_SETTINGS_MODULE=betterangels_backend.settings_test``
(see ``pyproject.toml``).  Test-only; production settings are unchanged.

* ``DEBUG = False`` — pytest-django already forces this (``django_debug_mode``
  defaults to false); kept explicit so the module is self-describing and so
  the value is right if these settings are loaded outside pytest.
* A process-local ``LocMemCache`` — the suite has tests that call
  ``cache.clear()`` (the region density tests).  Against Redis that is
  ``FLUSHDB``, which wipes the cache for every xdist worker and logs their
  sessions out.  A local cache makes ``clear()`` process-local.  The cache
  session backend derives its TTL from the (patched) clock, so
  ``SESSION_COOKIE_AGE`` is extended for the run; no test asserts expiry.
* ``MD5PasswordHasher`` — password strength is not what these tests assert.

Everything else is inherited unchanged from ``betterangels_backend.settings``.
"""

from .settings import *  # noqa: F403

DEBUG = False

CACHES["default"] = {  # noqa: F405
    "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    "LOCATION": "betterangels-test",
    "OPTIONS": {"MAX_ENTRIES": 10_000},
}

# Cache sessions expire on the patched clock; keep them for the run so
# `time_machine` travel in a test does not log the client out.
SESSION_COOKIE_AGE = 60 * 60 * 24 * 365 * 10

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
