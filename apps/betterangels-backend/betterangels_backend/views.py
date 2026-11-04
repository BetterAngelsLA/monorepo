from django.http import HttpRequest, HttpResponse
from django.views.decorators.http import require_safe


@require_safe
def healthz(request: HttpRequest) -> HttpResponse:
    """Liveness probe for the load balancer: no DB, sessions or templates."""
    response = HttpResponse("ok", content_type="text/plain")
    # CloudFront's default behaviour caches 200s; a probe must not be cached.
    response["Cache-Control"] = "no-store"
    return response
