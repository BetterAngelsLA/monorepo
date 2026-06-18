from typing import Any

from allauth.headless.account.views import RequestLoginCodeView
from django.contrib.auth import get_user_model


class AutoCreateRequestLoginCodeView(RequestLoginCodeView):
    """Auto-creates a user for unknown emails during login-by-code.

    When ``ACCOUNT_PREVENT_ENUMERATION=True`` and an unknown email requests
    a login code, allauth silently fakes success.  This override ensures the
    user is created before the code is sent so self-signup works.
    """

    def form_valid(self, form: Any) -> Any:
        email = form.cleaned_data.get("email")
        if email:
            UserModel = get_user_model()
            if not UserModel.objects.filter(email=email).exists():
                UserModel.objects.create_user(email=email, username=email)
        return super().form_valid(form)