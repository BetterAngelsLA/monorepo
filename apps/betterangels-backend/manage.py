#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""

# TODO: Delete our generated type stubs once the below PR has been merged.
# https://github.com/python/typeshed/pull/10527
from gevent import monkey

monkey.patch_all()

# flake8: noqa: F401
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "betterangels_backend.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
