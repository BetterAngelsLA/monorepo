from typing import Any

from allauth.headless.account.views import RequestLoginCodeView
from allauth.headless.constants import Client
from allauth.headless.internal.decorators import mark_request_as_headless
from django.contrib.auth import get_user_model
from django.http import HttpRequest


class AutoCreateRequestLoginCodeView(RequestLoginCodeView):
    """Auto-creates a user for unknown emails during login-by-code.

    Replaces the import-time ``clean_email`` patch from ``accounts/forms.py``
    with a proper view subclass.  When an unknown email requests a login code,
    a user is created on the fly.  This preserves ``ACCOUNT_PREVENT_ENUMERATION=True``
    while still allowing brand-new operators to sign in.
    """

    def dispatch(self, request: HttpRequest, *args: Any, **kwargs: Any) -> Any:
        mark_request_as_headless(request, Client.BROWSER)
        return super().dispatch(request, *args, **kwargs)

    def form_valid(self, form: Any) -> Any:
        email = form.cleaned_data.get("email")
        if email:
            UserModel = get_user_model()
            if not UserModel.objects.filter(email=email).exists():
                UserModel.objects.create_user(email=email, username=email)
        return super().form_valid(form)
