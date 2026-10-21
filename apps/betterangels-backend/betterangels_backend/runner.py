"""Run pytest through ``manage.py test``.

pytest is the primary entry point (CI and docs), but ``manage.py test`` is
common muscle memory.  Django's ``DiscoverRunner`` only understands unittest,
so this translates the options we support and delegates to pytest, preserving
``conftest.py``, fixtures and ``settings_test``.

Reference:
https://pytest-django.readthedocs.io/en/latest/faq.html#how-can-i-use-manage-py-test-with-pytest-django
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import pytest


class PytestTestRunner:
    def __init__(
        self,
        verbosity: int = 1,
        failfast: bool = False,
        keepdb: bool = False,
        parallel: str | None = None,
        keep: str | None = None,
        **kwargs: Any,
    ) -> None:
        self.verbosity = verbosity
        self.failfast = failfast
        self.keepdb = keepdb
        self.parallel = parallel
        self.keep = keep

    @classmethod
    def add_arguments(cls, parser: argparse.ArgumentParser) -> None:
        parser.add_argument(
            "--keepdb",
            action="store_true",
            help="Preserve the test database between runs (pytest --reuse-db).",
        )
        parser.add_argument(
            "--failfast",
            action="store_true",
            help="Stop on the first failure (pytest -x).",
        )
        parser.add_argument(
            "-k",
            "--keep",
            dest="keep",
            help="Only run tests matching this pytest -k expression.",
        )
        parser.add_argument(
            "--parallel",
            default=None,
            metavar="N|auto",
            help="Run with N pytest-xdist workers, or 'auto' for logical CPUs.",
        )

    def run_tests(self, test_labels: list[str], **kwargs: Any) -> int:
        argv: list[str] = []
        if self.verbosity == 0:
            argv.append("-q")
        elif self.verbosity == 2:
            argv.append("-v")
        elif self.verbosity >= 3:
            argv.append("-vv")
        if self.failfast:
            argv.append("-x")
        if self.keepdb:
            argv.append("--reuse-db")
        if self.parallel:
            workers = "logical" if self.parallel == "auto" else self.parallel
            argv.extend(["-n", workers])
        if self.keep:
            argv.extend(["-k", self.keep])
        for label in test_labels:
            # Django labels are importable module paths; paths and nodeids are
            # passed through.  ``--pyargs`` lets pytest import the former.
            if "::" in label or Path(label).exists():
                argv.append(label)
            else:
                argv.extend(["--pyargs", label])
        return pytest.main(argv)
