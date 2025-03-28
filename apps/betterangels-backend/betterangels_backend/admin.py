from typing import Any, Dict, Optional

from accounts.services import send_magic_link
from betterangels_backend import settings
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.http import HttpRequest, HttpResponse
from django.shortcuts import render

UserModel = get_user_model()


class MagicLinkAdminSite(admin.AdminSite):
    def login(self, request: HttpRequest, extra_context: Optional[Dict[str, Any]] = None) -> HttpResponse:
        context = extra_context or {}
        is_local_dev = getattr(settings, "IS_LOCAL_DEV", False)
        context["is_local_dev"] = is_local_dev

        if request.method == "POST" and "email" in request.POST:
            email = request.POST["email"]
            if UserModel.objects.filter(email=email, is_staff=True).exists():
                send_magic_link(email, request)
            context.update({"email_sent": True, "sent_email_address": email})

            # Keep login form instead of trying to validate empty fields
            request.method = "GET"

        if not is_local_dev:
            # In production, render the login page directly (disable username/password auth)
            return render(request, "admin/login.html", context)

        return super().login(request, context)


magic_link_admin_site = MagicLinkAdminSite(name="admin")
