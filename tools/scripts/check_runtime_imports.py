"""Import the backend the way a production task does.

The slim image syncs the venv with ``--no-dev``; modules that live in the dev
dependency group but are imported at runtime only fail on a deploy. Run this
against that runtime venv (``UV_PROJECT_ENVIRONMENT``) from CI.

Requires ``DJANGO_SETTINGS_MODULE`` and ``PYTHONPATH`` to point at
``apps/betterangels-backend``.
"""

import django

django.setup()

from django.urls import resolve  # noqa: E402

resolve("/")
import betterangels_backend.schema  # noqa: E402,F401

print("runtime imports ok")
