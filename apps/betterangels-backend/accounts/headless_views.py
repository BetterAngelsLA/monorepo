from typing import Any

from allauth.headless.account.views import RequestLoginCodeView
from django.contrib.auth import get_user_model
from django.http import HttpRequest, HttpResponse


class AutoCreateRequestLoginCodeView(RequestLoginCodeView):
    """Auto-creates a user for unknown emails during login-by-code.

    The headless ``APIView`` input validation flow sets ``self.input._user = None``
    when ``ACCOUNT_PREVENT_ENUMERATION=True`` and the email is unknown.  The
    built-in ``post()`` then calls ``initiate(user=None, ...)`` which silently
    fakes success without sending a code.

    We override ``post()`` to create the user (and stash it on ``self.input._user``)
    before the parent's ``post()`` runs, so the verification process issues a
    real code.
    """

    def post(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        email = self.input.cleaned_data.get("email")  # type: ignore[union-attr]
        if email:
            UserModel = get_user_model()
            if not UserModel.objects.filter(email=email).exists():
                UserModel.objects.create_user(email=email, username=email)
            # Re-resolve the user so initiate() picks it up
            self.input._user = UserModel.objects.filter(email=email).first()  # type: ignore[union-attr]
        return super().post(request, *args, **kwargs)