"""Tests for freezing the acting user's identity into the pghistory context."""

from accounts.models import User
from common.middleware import HistoryMiddleware
from django.contrib.auth.models import AnonymousUser
from django.http import HttpRequest, HttpResponse
from django.test import RequestFactory, TestCase
from model_bakery import baker
from shelters.models import City


class HistoryMiddlewareTests(TestCase):
    def setUp(self) -> None:
        self.factory = RequestFactory()
        self.middleware = HistoryMiddleware(lambda request: HttpResponse())

    def test_freezes_authenticated_user_identity(self) -> None:
        user = baker.make(User, first_name="Ada", middle_name="B", last_name="Lovelace", email="ada@example.com")
        request = self.factory.get("/shelters/")
        request.user = user

        ctx = self.middleware.get_context(request)

        self.assertEqual(ctx["user"], user.pk)
        self.assertEqual(ctx["url"], "/shelters/")
        self.assertEqual(ctx["user_name"], "Ada B Lovelace")
        self.assertEqual(ctx["user_email"], "ada@example.com")

    def test_omits_identity_for_anonymous_user(self) -> None:
        request = self.factory.get("/shelters/")
        request.user = AnonymousUser()

        ctx = self.middleware.get_context(request)

        self.assertNotIn("user_name", ctx)
        self.assertNotIn("user_email", ctx)

    def test_omits_identity_when_user_is_absent(self) -> None:
        request = self.factory.get("/shelters/")

        ctx = self.middleware.get_context(request)

        self.assertNotIn("user_name", ctx)
        self.assertNotIn("user_email", ctx)

    def test_write_during_request_records_frozen_identity(self) -> None:
        user = baker.make(User, first_name="Ada", last_name="Lovelace", email="ada@example.com")

        def get_response(request: HttpRequest) -> HttpResponse:
            baker.make(City, name="Frozenville")
            return HttpResponse()

        request = self.factory.post("/shelters/")
        request.user = user
        HistoryMiddleware(get_response)(request)

        event = City.pgh_event_model.objects.latest("pgh_id")  # type: ignore[attr-defined]
        self.assertIsNotNone(event.pgh_context)
        assert event.pgh_context is not None
        self.assertEqual(event.pgh_context.metadata["user_name"], "Ada Lovelace")
        self.assertEqual(event.pgh_context.metadata["user_email"], "ada@example.com")

    def test_write_during_anonymous_request_records_no_identity(self) -> None:
        def get_response(request: HttpRequest) -> HttpResponse:
            baker.make(City, name="Anonville")
            return HttpResponse()

        request = self.factory.post("/shelters/")
        request.user = AnonymousUser()
        HistoryMiddleware(get_response)(request)

        event = City.pgh_event_model.objects.latest("pgh_id")  # type: ignore[attr-defined]
        assert event.pgh_context is not None
        self.assertNotIn("user_name", event.pgh_context.metadata)
