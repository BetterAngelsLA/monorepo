from django.http import HttpRequest, JsonResponse


def health_check(request: HttpRequest) -> JsonResponse:
    return JsonResponse({"status": "healthy"}, status=200)
