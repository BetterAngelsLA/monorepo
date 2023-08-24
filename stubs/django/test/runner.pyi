"""
This type stub file was generated by pyright.
"""

import logging
from argparse import ArgumentParser
from collections.abc import Iterator, Sequence
from contextlib import contextmanager
from io import StringIO
from typing import Any, Literal
from unittest import TestCase, TestLoader, TestSuite, TextTestResult, TextTestRunner
from django.db.backends.base.base import BaseDatabaseWrapper
from django.test.testcases import SimpleTestCase
from django.test.utils import TimeKeeperProtocol
from django.utils.datastructures import OrderedSet

"""
This type stub file was generated by pyright.
"""
class DebugSQLTextTestResult(TextTestResult):
    buffer: bool
    descriptions: bool
    dots: bool
    expectedFailures: list[Any]
    failfast: bool
    shouldStop: bool
    showAll: bool
    skipped: list[Any]
    tb_locals: bool
    testsRun: int
    unexpectedSuccesses: list[Any]
    logger: logging.Logger
    stream: Any
    def __init__(self, stream: Any, descriptions: bool, verbosity: int) -> None:
        ...
    
    debug_sql_stream: StringIO
    handler: logging.StreamHandler
    def startTest(self, test: TestCase) -> None:
        ...
    
    def stopTest(self, test: TestCase) -> None:
        ...
    
    def addError(self, test: Any, err: Any) -> None:
        ...
    
    def addFailure(self, test: Any, err: Any) -> None:
        ...
    


class PDBDebugResult(TextTestResult):
    ...


class RemoteTestResult:
    events: list[Any]
    failfast: bool
    shouldStop: bool
    testsRun: int
    def __init__(self) -> None:
        ...
    
    @property
    def test_index(self) -> int:
        ...
    
    def check_picklable(self, test: Any, err: Any) -> None:
        ...
    
    def check_subtest_picklable(self, test: Any, subtest: Any) -> None:
        ...
    
    def stop_if_failfast(self) -> None:
        ...
    
    def stop(self) -> None:
        ...
    
    def startTestRun(self) -> None:
        ...
    
    def stopTestRun(self) -> None:
        ...
    
    def startTest(self, test: Any) -> None:
        ...
    
    def stopTest(self, test: Any) -> None:
        ...
    
    def addError(self, test: Any, err: Any) -> None:
        ...
    
    def addFailure(self, test: Any, err: Any) -> None:
        ...
    
    def addSubTest(self, test: Any, subtest: Any, err: Any) -> None:
        ...
    
    def addSuccess(self, test: Any) -> None:
        ...
    
    def addSkip(self, test: Any, reason: Any) -> None:
        ...
    
    def addExpectedFailure(self, test: Any, err: Any) -> None:
        ...
    
    def addUnexpectedSuccess(self, test: Any) -> None:
        ...
    


class RemoteTestRunner:
    resultclass: Any
    failfast: bool
    buffer: bool
    def __init__(self, failfast: bool = ..., resultclass: Any | None = ..., buffer: bool = ...) -> None:
        ...
    
    def run(self, test: Any) -> Any:
        ...
    


def default_test_processes() -> int:
    ...

class ParallelTestSuite(TestSuite):
    init_worker: Any
    run_subsuite: Any
    runner_class: Any
    subsuites: list[TestSuite]
    processes: int
    failfast: bool
    buffer: bool
    initial_settings: Any
    serialized_contents: Any
    def __init__(self, subsuites: list[TestSuite], processes: int, failfast: bool = ..., buffer: bool = ...) -> None:
        ...
    
    def run(self, result: Any) -> Any:
        ...
    


class DiscoverRunner:
    test_suite: type[TestSuite]
    parallel_test_suite: type[ParallelTestSuite]
    test_runner: type[TextTestRunner]
    test_loader: TestLoader
    reorder_by: tuple[SimpleTestCase, ...]
    pattern: str | None
    top_level: str | None
    verbosity: int
    interactive: bool
    failfast: bool
    keepdb: bool
    reverse: bool
    debug_mode: bool
    debug_sql: bool
    parallel: int
    tags: set[str]
    exclude_tags: set[str]
    pdb: bool
    buffer: bool
    test_name_patterns: set[str] | None
    time_keeper: TimeKeeperProtocol
    shuffle: int | Literal[False]
    logger: logging.Logger | None
    def __init__(self, pattern: str | None = ..., top_level: str | None = ..., verbosity: int = ..., interactive: bool = ..., failfast: bool = ..., keepdb: bool = ..., reverse: bool = ..., debug_mode: bool = ..., debug_sql: bool = ..., parallel: int = ..., tags: list[str] | None = ..., exclude_tags: list[str] | None = ..., test_name_patterns: list[str] | None = ..., pdb: bool = ..., buffer: bool = ..., enable_faulthandler: bool = ..., timing: bool = ..., shuffle: int | Literal[False] = ..., logger: logging.Logger | None = ..., **kwargs: Any) -> None:
        ...
    
    @classmethod
    def add_arguments(cls, parser: ArgumentParser) -> None:
        ...
    
    @property
    def shuffle_seed(self) -> int | None:
        ...
    
    def log(self, msg: str, level: int | None) -> None:
        ...
    
    def setup_test_environment(self, **kwargs: Any) -> None:
        ...
    
    def setup_shuffler(self) -> None:
        ...
    
    @contextmanager
    def load_with_patterns(self) -> Iterator[None]:
        ...
    
    def load_tests_for_label(self, label: str, discover_kwargs: dict[str, str]) -> TestSuite:
        ...
    
    def build_suite(self, test_labels: Sequence[str] = ..., extra_tests: list[Any] | None = ..., **kwargs: Any) -> TestSuite:
        ...
    
    def setup_databases(self, **kwargs: Any) -> list[tuple[BaseDatabaseWrapper, str, bool]]:
        ...
    
    def get_resultclass(self) -> type[TextTestResult] | None:
        ...
    
    def get_test_runner_kwargs(self) -> dict[str, Any]:
        ...
    
    def run_checks(self, databases: set[str]) -> None:
        ...
    
    def run_suite(self, suite: TestSuite, **kwargs: Any) -> TextTestResult:
        ...
    
    def teardown_databases(self, old_config: list[tuple[BaseDatabaseWrapper, str, bool]], **kwargs: Any) -> None:
        ...
    
    def teardown_test_environment(self, **kwargs: Any) -> None:
        ...
    
    def suite_result(self, suite: TestSuite, result: TextTestResult, **kwargs: Any) -> int:
        ...
    
    def get_databases(self, suite: TestSuite) -> set[str]:
        ...
    
    def run_tests(self, test_labels: list[str], extra_tests: list[Any] | None = ..., **kwargs: Any) -> int:
        ...
    


def is_discoverable(label: str) -> bool:
    ...

def reorder_suite(suite: TestSuite, classes: tuple[type[TestCase], type[SimpleTestCase]], reverse: bool = ...) -> TestSuite:
    ...

def partition_suite_by_type(suite: TestSuite, classes: tuple[type[TestCase], type[SimpleTestCase]], bins: list[OrderedSet], reverse: bool = ...) -> None:
    ...

def partition_suite_by_case(suite: Any) -> list[Any]:
    ...

def filter_tests_by_tags(suite: TestSuite, tags: set[str], exclude_tags: set[str]) -> TestSuite:
    ...

