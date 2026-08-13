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

    We override ``post()`` to provision brand-new emails and set
    ``self.input._user`` so the verification process issues a real code.
    An email that already belongs to an existing-but-deactivated account is
    deliberately left untouched — no reactivation, no email — anonymous
    requests can't reactivate a deactivated user; ``super().post()`` then
    fakes success exactly as it does for unknown accounts.
    """

    def post(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        if not self.input._user:  # type: ignore[union-attr]
            email = self.input.cleaned_data.get("email")  # type: ignore[union-attr]
            if email:
                email = email.strip().lower()
                with transaction.atomic():
                    user, created = get_or_create_user_by_email(email)
                    if created:
                        # Brand-new email: auto-provision so allauth can issue a
                        # real code.  Reuse any existing EmailAddress row
                        # (case-insensitive) so mixed-case input can't create a
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
                    elif user.is_active:
                        # Defensive: an active account allauth didn't resolve
                        # still gets a real code.
                        self.input._user = user  # type: ignore[union-attr]
                    # else: existing-but-inactive — leave ``_user`` unset so
                    # super().post() fakes success without sending anything
                    # (ACCOUNT_EMAIL_UNKNOWN_ACCOUNTS=False) and the account
                    # stays deactivated.
        return cast(HttpResponse, super().post(request, *args, **kwargs))
