#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""

# flake8: noqa: F401
import os
import sys

from gevent import monkey

monkey.patch_all()


def _silence_geos_gevent_warnings() -> None:
    """Ignore GEOS RuntimeError in CPointerBase.__del__ during shutdown.

    GEOS finalizers access gevent thread-locals which are already
    destroyed when Python shuts down, producing harmless but noisy
    ``RuntimeError: greenlet is being finalized`` warnings.
    """
    try:
        from django.contrib.gis.ptr import CPointerBase

        _original_del = CPointerBase.__del__

        def _safe_del(self: "CPointerBase") -> None:
            try:
                _original_del(self)
            except RuntimeError:
                pass

        CPointerBase.__del__ = _safe_del  # type: ignore[method-assign]
    except ImportError:
        pass


_silence_geos_gevent_warnings()


def main() -> None:
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
