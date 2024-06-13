from django.http import HttpRequest, HttpResponse
from django.shortcuts import render


def privacy_policy(request: HttpRequest) -> HttpResponse:
    return render(request, "legal/privacy_policy.html")
