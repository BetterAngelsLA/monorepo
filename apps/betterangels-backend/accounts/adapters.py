from typing import Any, Dict

from allauth.account.adapter import DefaultAccountAdapter
from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import HttpRequest


class AccountAdapter(DefaultAccountAdapter):
    def is_open_for_signup(self, request: HttpRequest) -> bool:
        return True

    def clean_email(self, email: str) -> str:
        """Auto-create user for unknown emails during login-by-code self-signup.

        When an unknown email requests a login code, we create the user on the
        fly so that ``ACCOUNT_PREVENT_ENUMERATION=True`` doesn't silently reject
        brand-new operators before they can complete sign-in.
        """
        email = super().clean_email(email)
        if email:
            UserModel = get_user_model()
            if not UserModel.objects.filter(email=email).exists():
                UserModel.objects.create_user(email=email, username=email)
        return email

    def send_mail(
        self,
        template_prefix: str,
        email: str,
        context: Dict[str, Any],
    ) -> None:
        timeout_seconds = getattr(settings, "ACCOUNT_LOGIN_BY_CODE_TIMEOUT", 300)
        context["timeout_minutes"] = timeout_seconds // 60
        super().send_mail(template_prefix, email, context)
