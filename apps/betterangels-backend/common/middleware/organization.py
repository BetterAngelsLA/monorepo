"""Attaches ``request.organization_id`` from the X-Organization-ID header.

Zero-cost middleware — no DB queries.  Membership validation happens
downstream in the ``HasOrgPerm`` extension and in selectors, folded
into their existing queries so Django can optimize.
"""

from django.http import HttpRequest, HttpResponse

HEADER = "HTTP_X_ORGANIZATION_ID"


class OrganizationMiddleware:
    """Sets ``request.organization_id`` (str or None) from the request header."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        request.organization_id = request.META.get(HEADER)
        return self.get_response(request)