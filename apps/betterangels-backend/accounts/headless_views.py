from typing import Any, cast

from allauth.account.models import EmailAddress
from allauth.headless.account.views import RequestLoginCodeView
from django.contrib.auth import get_user_model
from django.db import transaction
from django.http import HttpRequest, HttpResponse

User = get_user_model()


class AutoCreateRequestLoginCodeView(RequestLoginCodeView):
    """Auto-creates a user for unknown emails during login-by-code self-signup.

    When ``ACCOUNT_PREVENT_ENUMERATION=True`` and an unknown email requests a
    login code, the headless input sets ``self.input._user = None`` (to avoid
    revealing that the account doesn't exist).  The parent's ``post()`` then
    calls ``initiate(user=None, ...)`` which silently fakes success without
    sending a real code.

    We override ``post()`` to create the user first and set ``self.input._user``
    so the verification process finds the account and issues a real code.  This
    follows allauth's subclassing pattern — ``self.input._user`` is the
    documented protocol variable that ``RequestLoginCodeView.post()`` reads.
    """

    def post(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        if not self.input._user:  # type: ignore[union-attr]
            email = self.input.cleaned_data.get("email")  # type: ignore[union-attr]
            if email:
                with transaction.atomic():
                    user = User.objects.create_user(email=email, username=email)
                    user.set_unusable_password()
                    user.save()
                    EmailAddress.objects.create(
                        user=user,
                        email=email,
                        primary=True,
                        verified=False,
                    )
                self.input._user = user  # type: ignore[union-attr]
        return cast(HttpResponse, super().post(request, *args, **kwargs))
