from django.test import SimpleTestCase


class HealthzTests(SimpleTestCase):
    def test_returns_ok_without_touching_the_database(self) -> None:
        response = self.client.get("/healthz")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, b"ok")
        self.assertEqual(response["Content-Type"], "text/plain")
        self.assertEqual(response["Cache-Control"], "no-store")

    def test_accepts_trailing_slash(self) -> None:
        self.assertEqual(self.client.get("/healthz/").status_code, 200)

    def test_accepts_head(self) -> None:
        response = self.client.head("/healthz")

        self.assertEqual(response.status_code, 200)

    def test_rejects_non_safe_methods(self) -> None:
        self.assertEqual(self.client.post("/healthz").status_code, 405)
