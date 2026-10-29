from django.test import SimpleTestCase


class HealthzTests(SimpleTestCase):
    def test_returns_ok_without_touching_the_database(self) -> None:
        response = self.client.get("/healthz")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, b"ok")
        self.assertEqual(response["Content-Type"], "text/plain")

    def test_rejects_non_get(self) -> None:
        self.assertEqual(self.client.post("/healthz").status_code, 405)
