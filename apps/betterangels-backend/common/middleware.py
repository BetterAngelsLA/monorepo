import zoneinfo
from typing import Any, Callable, Dict

from common.utils import set_current_request
from django.http import HttpRequest, HttpResponse
from django.utils import timezone


class TimezoneMiddleware:
    """
    Middleware for setting the timezone based on the user's preference stored in a
    cookie.

    This middleware looks for a cookie named 'django_timezone' and uses its value
    to set the current timezone using Django's timezone utilities. If the cookie is
    not set, or if the timezone name is not recognized, it falls back to the default
    timezone as specified in Django settings.

    The middleware should be added to the MIDDLEWARE setting in your Django project's
    settings.py file to be executed for each request.

    Attributes:
        get_response: A callable that takes an HttpRequest and returns an HttpResponse.
                      This callable represents the next middleware or view in the
                      request processing chain.

    References:
        Django Time Zones documentation:
        https://docs.djangoproject.com/en/5.0/topics/i18n/timezones/#selecting-the-current-time-zone
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        try:
            tzname = request.COOKIES.get("django_timezone")
            if tzname:
                timezone.activate(zoneinfo.ZoneInfo(tzname))
            else:
                timezone.deactivate()
        except Exception:
            timezone.deactivate()

        return self.get_response(request)


class ThreadLocalRequestMiddleware:
    """
    Middleware that stores the current request in thread-local storage (greenlet-local for gevent).
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        # Store the current request in thread-local (greenlet-local) storage
        set_current_request(request)

        # Process the request and generate the response
        response = self.get_response(request)

        # Clear the request from thread-local storage after the response
        set_current_request(None)

        return response
