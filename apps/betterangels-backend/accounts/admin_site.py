# admin_site.py
from typing import Any, Dict, Optional

from django.conf import settings
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.http import HttpRequest, HttpResponse
from django.shortcuts import render
from django.urls import reverse
from sesame.utils import get_query_string

UserModel = get_user_model()


class MagicLinkAdminSite(admin.AdminSite):
    # When not in local dev, use our custom template.
    custom_login_template = "admin/login.html"

    def login(self, request: HttpRequest, extra_context: Optional[Dict[str, Any]] = None) -> HttpResponse:
        is_local_dev = getattr(settings, "IS_LOCAL_DEV", False)
        is_local_dev = True
        context: Dict[str, Any] = extra_context or {}
        context["is_local_dev"] = is_local_dev

        if is_local_dev:
            # In local development, use Django’s built-in login view.
            return super().login(request, context)

        # Otherwise, we’re in production.

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

        return render(request, self.custom_login_template, context)


# In your urls.py, instantiate and use this custom admin site.
magic_link_admin_site = MagicLinkAdminSite()
