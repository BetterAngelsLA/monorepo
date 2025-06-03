from typing import Any, Dict

from allauth.account.adapter import DefaultAccountAdapter
from django.conf import settings


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
