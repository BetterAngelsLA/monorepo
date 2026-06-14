"""Break/fix tests for newrelic/newrelic-python-agent#1756.

graphql-core >= 3.2.10 renamed ExecutionContext.errors → collected_errors.
New Relic 11.4.0 accessed the old .errors attribute and crashed.
The fix (PR #1760, commit 825d7bd) provides _execution_context_has_errors.
"""

import strawberry
from django.test import SimpleTestCase
from strawberry.extensions import SchemaExtension


@strawberry.type
class _Result:
    ok: bool


@strawberry.type
class _Query:
    @strawberry.field
    def noop(self) -> _Result:
        return _Result(ok=True)


class _CaptureExecutionContext(SchemaExtension):
    """Captures the graphql-core ExecutionContext, which is the object where
    .errors was removed in graphql-core >= 3.2.10."""

    ctx = None

    def on_operation(self):
        _CaptureExecutionContext.ctx = self.execution_context
        yield


class NewRelicFixVerificationTestCase(SimpleTestCase):
    """Prove the break and verify the fix without any app queries or DB."""

    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()
        cls._synthetic_schema = strawberry.Schema(query=_Query, extensions=[_CaptureExecutionContext])
        # Initialize NewRelic so its graphql-core hooks are active.
        try:
            import newrelic.agent

            newrelic.agent.initialize()
        except Exception:
            pass

    def _has_nr_fix(self) -> bool:
        """Return True if the _execution_context_has_errors fix is present."""
        try:
            import newrelic.hooks.framework_graphql as fg

            return hasattr(fg, "_execution_context_has_errors")
        except ImportError:
            return False

    def test_01_execution_context_errors_is_broken(self) -> None:
        """graphql-core >= 3.2.10 removed .errors from ExecutionContext."""
        self._synthetic_schema.execute_sync("query { noop { ok } }")
        ctx = _CaptureExecutionContext.ctx
        self.assertIsNotNone(ctx)
        with self.assertRaises(AttributeError):
            _ = ctx.errors  # type: ignore[attr-defined]

    def test_02_newrelic_fix_helper_exists(self) -> None:
        """The fix ships _execution_context_has_errors in framework_graphql."""
        if not self._has_nr_fix():
            self.skipTest("NewRelic not installed or initialized")
        import newrelic.hooks.framework_graphql as fg

        fn = fg._execution_context_has_errors
        self.assertTrue(callable(fn))

    def test_03_wrap_execute_operation_uses_fix(self) -> None:
        """wrap_execute_operation must call _execution_context_has_errors."""
        if not self._has_nr_fix():
            self.skipTest("NewRelic not installed or initialized")
        import inspect

        import newrelic.hooks.framework_graphql as fg

        src = inspect.getsource(fg.wrap_execute_operation)
        self.assertIn("_execution_context_has_errors", src)

    def test_04_background_task_graphql_no_crash(self) -> None:
        """A strawberry query inside an NR background_task must not crash."""
        if not self._has_nr_fix():
            self.skipTest("NewRelic not installed or initialized")
        import newrelic.agent

        schema = strawberry.Schema(query=_Query)

        @newrelic.agent.background_task(name="test_graphql")
        def run():
            return schema.execute_sync("query { noop { ok } }")

        result = run()
        self.assertIsNone(result.errors)
        self.assertEqual(result.data, {"noop": {"ok": True}})
