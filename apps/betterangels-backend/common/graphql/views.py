from typing import Any, Union

from django.http import HttpRequest, HttpResponse, HttpResponseNotAllowed
from django.template.response import TemplateResponse
from strawberry.django.views import GraphQLView


class ProtectedGraphQLView(GraphQLView):
    """
    This subclass of GraphQLView is used to remove the CSRF exemption that is
    applied by default in Strawberry Django's GraphQLView. Strawberry Django
    typically exempts GraphQL views from CSRF checks to facilitate API interactions
    from various origins or clients. However, this exemption might not be desirable
    in all cases, especially when there's a need for increased security.

    By subclassing GraphQLView and not applying the @csrf_exempt decorator,
    this class effectively reinstates the default CSRF protection provided by Django.
    """

    def dispatch(
        self, request: HttpRequest, *args: Any, **kwargs: Any
    ) -> Union[HttpResponseNotAllowed, TemplateResponse, HttpResponse]:
        return super().dispatch(request, *args, **kwargs)
