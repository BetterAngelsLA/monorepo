# admin_site.py
from typing import Any, Dict, Optional

from django.conf import settings
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.http import HttpRequest, HttpResponse
from django.template.response import TemplateResponse

# If you use django-sesame, import and generate tokens as needed:
# from sesame.utils import get_query_string

UserModel = get_user_model()


class MagicLinkAdminSite(admin.AdminSite):
    """
    Custom AdminSite that shows:
      1) The default username/password form (handled by super().login)
      2) A "magic link" form that emails a link to a staff user.
    """

    def login(self, request: HttpRequest, extra_context: Optional[Dict[str, Any]] = None) -> HttpResponse:
        context = extra_context or {}

        if request.method == "POST":
            # Check if the user submitted the magic-link form
            if "email" in request.POST:
                email = request.POST["email"]
                try:
                    user = UserModel.objects.get(email=email, is_staff=True)
                except UserModel.DoesNotExist:
                    # No staff user with this email
                    context["error"] = "No staff user found with that email."
                else:
                    # Generate and send your magic link here. Example only:
                    # sesame_token = get_query_string(user)
                    # admin_url = request.build_absolute_uri(self.urls[0][0])
                    # magic_link = f"{admin_url}?{sesame_token}"

                    send_mail(
                        subject="Magic Link Example",
                        message="Here is your magic link!",
                        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "admin@example.com"),
                        recipient_list=[email],
                        fail_silently=False,
                    )

                    context["email_sent"] = True
                    context["sent_email_address"] = email

                #
                # IMPORTANT: Force the request back to GET mode so that when
                # we call super().login, Django’s default admin logic will just
                # render the login form (rather than trying to validate username/password).
                #
                request.method = "GET"

                return super().login(request, context)

            else:
                # The user likely posted the username/password form, so let the default
                # admin login process handle it (including any validation errors).
                return super().login(request, context)

        # If GET, just do the normal thing:
        return super().login(request, context)


# Instantiate the site and reference it in your urls.py
magic_link_admin_site = MagicLinkAdminSite(name="admin")
