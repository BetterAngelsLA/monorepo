from django.http import HttpRequest, HttpResponse
from django.views.decorators.http import require_safe


@require_safe
def healthz(request: HttpRequest) -> HttpResponse:
    """Liveness probe for the load balancer: no DB, sessions or templates."""
    return HttpResponse("ok", content_type="text/plain")
