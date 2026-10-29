from django.http import HttpRequest, HttpResponse
from django.views.decorators.http import require_GET


@require_GET
def healthz(request: HttpRequest) -> HttpResponse:
    """Liveness probe for the load balancer: no DB, sessions or templates."""
    return HttpResponse("ok", content_type="text/plain")
