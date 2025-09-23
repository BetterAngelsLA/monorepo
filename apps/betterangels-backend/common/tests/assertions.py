from typing import Any, Protocol


class _AssertionsProto(Protocol):
    def assertIsNone(self, obj: Any, msg: str | None = None) -> None:
        pass

    def assertEqual(self, a: Any, b: Any, msg: str | None = None) -> None:
        pass

    def assertIsInstance(self, obj: Any, cls: type, msg: str | None = None) -> None:
        pass

    def assertGreater(self, a: Any, b: Any, msg: str | None = None) -> None:
        pass


class GraphQLAssertionsMixin:
    def assertGraphQLUnauthenticated(
        self: _AssertionsProto,
        response: dict[str, Any],
        *,
        expected_message: str = "You must be logged in to perform this action.",
        expected_code: str = "UNAUTHENTICATED",
        expected_status: int = 401,
    ) -> None:
        self.assertIsNone(response.get("data"))

        errors = response.get("errors", [])

        self.assertIsInstance(errors, list)
        self.assertGreater(len(errors), 0)

        error = errors[0]

        self.assertEqual(error.get("message"), expected_message)
        self.assertEqual(error.get("extensions", {}).get("code"), expected_code)
        self.assertEqual(error.get("extensions", {}).get("http", {}).get("status"), expected_status)
