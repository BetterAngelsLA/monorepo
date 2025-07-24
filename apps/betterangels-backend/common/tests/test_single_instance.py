# common/tests/test_single_instance.py
from unittest.mock import MagicMock

from celery import Task
from celery.exceptions import Ignore
from common.celery import single_instance
from django.core.cache import caches
from django.test import SimpleTestCase, override_settings

# use Django’s in‑memory cache for isolation
LOC_MEM = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "single-instance-tests",
    }
}


@override_settings(CACHES=LOC_MEM)
class SingleInstanceDecoratorTests(SimpleTestCase):
    def setUp(self) -> None:
        self.cache = caches["default"]
        self.cache.clear()

    class FakeTask(Task):
        name = "test.task"
        apply_async: MagicMock

        def __init__(self) -> None:
            super().__init__()
            self.apply_async = MagicMock()

    def test_runs_when_no_lock(self) -> None:
        calls: list[int] = []

        @single_instance(lock_ttl=60, retry_delay=5)
        def my_task(self: Task, x: int) -> None:
            calls.append(x)

        t = self.FakeTask()
        my_task(t, 123)

        self.assertEqual(calls, [123])
        t.apply_async.assert_not_called()

    def test_skips_and_requeues_when_locked(self) -> None:
        calls: list[int] = []

        @single_instance(lock_ttl=60, retry_delay=5)
        def my_task(self: Task, x: int) -> None:
            calls.append(x)

        t = self.FakeTask()
        # simulate a held lock
        self.cache.add("celery-lock:test.task", "1", timeout=60)

        with self.assertRaises(Ignore):
            my_task(t, 42)

        t.apply_async.assert_called_once_with(args=(42,), kwargs={}, countdown=5)
        self.assertEqual(calls, [])

    def test_lock_released_on_success(self) -> None:
        key = "celery-lock:test.task"

        @single_instance(lock_ttl=60, retry_delay=5)
        def my_task(self: Task) -> str:
            return "done"

        t = self.FakeTask()
        result = my_task(t)

        # key should be gone
        self.assertIsNone(self.cache.get(key))
        self.assertEqual(result, "done")

    def test_lock_released_on_exception(self) -> None:
        key = "celery-lock:test.task"

        @single_instance(lock_ttl=60, retry_delay=5)
        def my_task(self: Task) -> None:
            raise RuntimeError("boom")

        t = self.FakeTask()
        with self.assertRaises(RuntimeError):
            my_task(t)

        self.assertIsNone(self.cache.get(key))
        self.assertIsNone(self.cache.get(key))
