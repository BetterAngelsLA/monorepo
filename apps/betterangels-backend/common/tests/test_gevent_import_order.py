"""
Test that gunicorn doesn't break gevent monkey patching.

Gunicorn v25 imported concurrent.futures at module level, which captured
unpatched threading primitives before gevent could patch them. This caused
boto3 S3 operations to hang, killing file uploads.

See: https://github.com/benoitc/gunicorn/issues/3482
"""

import subprocess
import sys


def _run(code: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, "-c", code],
        capture_output=True,
        text=True,
        timeout=10,
    )


def test_gunicorn_arbiter_does_not_import_concurrent_futures():
    """Importing gunicorn.arbiter must not pull in concurrent.futures."""
    r = _run(
        "import sys; import gunicorn.arbiter; "
        "sys.exit(0 if 'concurrent.futures' not in sys.modules else 1)"
    )
    assert r.returncode == 0, (
        "gunicorn.arbiter imported concurrent.futures as a side effect, "
        "which breaks gevent patching and hangs S3 uploads. "
        "See: https://github.com/benoitc/gunicorn/issues/3482"
    )


def test_gevent_patching_works_after_gunicorn_import():
    """After importing gunicorn then patching gevent, concurrent.futures
    must use gevent locks — not stdlib ones."""
    r = _run(
        "import gunicorn.arbiter; "
        "import gevent.monkey; gevent.monkey.patch_all(); "
        "import concurrent.futures.thread; "
        "lock_mod = type(concurrent.futures.thread._global_shutdown_lock).__module__; "
        "import sys; sys.exit(0 if 'gevent' in lock_mod else 1)"
    )
    assert r.returncode == 0, (
        "concurrent.futures is using unpatched locks after gevent.monkey.patch_all(). "
        "This means gunicorn broke the patching order. "
        "See: https://github.com/benoitc/gunicorn/issues/3482"
    )
