# In your Django views
from typing import Any

from betterangels_backend.schema import schema
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from rest_framework.request import Request


class GraphQLSchemaView(View):
    @method_decorator(csrf_exempt)
    def get(self, request: Request, *args: Any, **kwargs: Any) -> HttpResponse:
        schema_str = str(schema)
        return HttpResponse(schema_str, content_type="text/plain")
