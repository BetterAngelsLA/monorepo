from typing import Any, Dict, Optional

from betterangels_backend import settings
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.http import HttpRequest, HttpResponse

UserModel = get_user_model()


class CustomAdminSite(admin.AdminSite):
    def login(self, request: HttpRequest, extra_context: Optional[Dict[str, Any]] = None) -> HttpResponse:
        context = extra_context or {}
        is_local_dev = getattr(settings, "IS_LOCAL_DEV", False)
        context["is_local_dev"] = is_local_dev
        return super().login(request, context)
