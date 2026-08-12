from typing import Any, cast

from allauth.account.models import EmailAddress
from allauth.headless.account.views import RequestLoginCodeView
from django.db import transaction
from django.http import HttpRequest, HttpResponse

from .services import get_or_create_user_by_email


class AutoCreateRequestLoginCodeView(RequestLoginCodeView):
    """Auto-creates a user for unknown emails during login-by-code self-signup.

    When ``ACCOUNT_PREVENT_ENUMERATION=True`` and an unknown email requests a
    login code, the headless input sets ``self.input._user = None`` (to avoid
    revealing that the account doesn't exist).  The parent's ``post()`` then
    calls ``initiate(user=None, ...)`` which silently fakes success without
    sending a real code.

    We override ``post()`` to provision the account and set ``self.input._user``
    so the verification process finds it and issues a real code.  Provisioning
    is delegated to :func:`accounts.services.get_or_create_user_by_email`, which
    reuses an existing account — reactivating it if it was deactivated — instead
    of creating a duplicate (which would raise a unique-constraint violation).
    This follows allauth's subclassing pattern: ``self.input._user`` is the
    documented protocol variable that ``RequestLoginCodeView.post()`` reads.
    """

    def post(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        if not self.input._user:  # type: ignore[union-attr]
            email = self.input.cleaned_data.get("email")  # type: ignore[union-attr]
            if email:
                email = email.strip().lower()
                with transaction.atomic():
                    user, _ = get_or_create_user_by_email(email)
                    # Ensure allauth can resolve the address: reuse any existing
                    # row (case-insensitive) so mixed-case input can't create a
                    # duplicate; new rows are primary and unverified.
                    email_address = EmailAddress.objects.filter(user=user, email__iexact=email).first()
                    if email_address is None:
                        EmailAddress.objects.create(
                            user=user,
                            email=email,
                            primary=True,
                            verified=False,
                        )
                self.input._user = user  # type: ignore[union-attr]
        return cast(HttpResponse, super().post(request, *args, **kwargs))
