import zoneinfo
from typing import Callable

from django.http import HttpRequest, HttpResponse
from django.utils import timezone


class TimezoneMiddleware:
    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response: Callable[[HttpRequest], HttpResponse] = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        try:
            # get django_timezone from cookie
            tzname: str | None = request.COOKIES.get("django_timezone")
            if tzname:
                timezone.activate(zoneinfo.ZoneInfo(tzname))
            else:
                timezone.deactivate()
        except Exception:
            timezone.deactivate()

        return self.get_response(request)
