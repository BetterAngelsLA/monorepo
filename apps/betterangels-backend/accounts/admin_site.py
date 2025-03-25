# admin_site.py
from typing import Any, Dict, Optional

from django.conf import settings
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.http import HttpRequest, HttpResponse
from django.urls import reverse
from sesame.utils import get_query_string

UserModel = get_user_model()


class MagicLinkAdminSite(admin.AdminSite):
    def login(self, request: HttpRequest, extra_context: Optional[Dict[str, Any]] = None) -> HttpResponse:
        is_local_dev = getattr(settings, "IS_LOCAL_DEV", False)
        context: Dict[str, Any] = extra_context or {}
        context["is_local_dev"] = is_local_dev

        if request.method == "POST" and "email" in request.POST:
            email = request.POST["email"]
            try:
                user = UserModel.objects.get(email=email, is_staff=True)
            except UserModel.DoesNotExist:
                context["error"] = "No staff user found with that email."
            else:
                token = get_query_string(user)
                admin_index_url = request.build_absolute_uri(reverse("admin:index")) + token
                subject = "Your Magic Link to Django Admin"
                message = f"Click here to log in:\n{admin_index_url}"
                send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])
                context["email_sent"] = True
                context["sent_email_address"] = email
        return super().login(request, context)


magic_link_admin_site = MagicLinkAdminSite()
