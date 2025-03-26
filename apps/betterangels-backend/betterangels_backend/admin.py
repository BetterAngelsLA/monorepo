from typing import Any, Dict, Optional

from accounts.services import send_magic_link
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.http import HttpRequest, HttpResponse

UserModel = get_user_model()


class MagicLinkAdminSite(admin.AdminSite):
    def login(self, request: HttpRequest, extra_context: Optional[Dict[str, Any]] = None) -> HttpResponse:
        context = extra_context or {}

        if request.method == "POST" and "email" in request.POST:
            email = request.POST["email"]
            user = UserModel.objects.filter(email=email, is_staff=True).first()

            # Only send if the user exists
            if user:
                send_magic_link(email, request)

            # Always show a success message (avoid user enumeration)
            context["email_sent"] = True
            context["sent_email_address"] = email

            # Switch the request to GET so default admin login logic just shows the form
            request.method = "GET"

        return super().login(request, context)


magic_link_admin_site = MagicLinkAdminSite(name="admin")
