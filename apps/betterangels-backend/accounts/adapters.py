from typing import Any, Dict, Optional

from allauth.account.adapter import DefaultAccountAdapter
from allauth.account.models import EmailAddress
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.socialaccount.models import SocialLogin
from django.conf import settings
from django.http import HttpRequest


class AccountAdapter(DefaultAccountAdapter):
    def send_mail(
        self,
        template_prefix: str,
        email: str,
        context: Dict[str, Any],
    ) -> None:
        timeout_seconds = getattr(settings, "ACCOUNT_LOGIN_BY_CODE_TIMEOUT", 300)
        context["timeout_minutes"] = timeout_seconds // 60
        super().send_mail(template_prefix, email, context)


# https://github.com/pennersr/django-allauth/issues/418#issuecomment-137259550
class SocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request: HttpRequest, sociallogin: SocialLogin) -> None:
        # Some social logins don't have an email address
        if not sociallogin.email_addresses:
            return

        # Find the first verified email that we get from this sociallogin
        verified_email: Optional[EmailAddress] = None
        for email in sociallogin.email_addresses:
            if email.verified:
                verified_email = email
                break

        # No verified emails found, nothing more to do
        if not verified_email:
            return

        # Check if the given email address already exists as a verified email on
        # an existing user's account
        try:
            existing_email: EmailAddress = EmailAddress.objects.get(email__iexact=verified_email.email, verified=True)
        except EmailAddress.DoesNotExist:
            return

        # If it does, connect this new social login to the existing user
        sociallogin.connect(request, existing_email.user)
