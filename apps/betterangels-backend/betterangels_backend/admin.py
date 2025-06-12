from typing import Any, Dict, Optional

from betterangels_backend import settings
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.http import HttpRequest, HttpResponse
from django.shortcuts import render

UserModel = get_user_model()


class CustomAdminSite(admin.AdminSite):
    def login(self, request: HttpRequest, extra_context: Optional[Dict[str, Any]] = None) -> HttpResponse:
        context = extra_context or {}
        is_local_dev = getattr(settings, "IS_LOCAL_DEV", False)
        context["is_local_dev"] = is_local_dev

        if not is_local_dev:
            # In production, render the login page directly (disable username/password auth)
            return render(request, "admin/login.html", context)

        return super().login(request, context)


magic_link_admin_site = CustomAdminSite(name="admin")
