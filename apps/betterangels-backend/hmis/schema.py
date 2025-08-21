import strawberry
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth import login as django_login
from strawberry.types import Info

from .client import create_auth_token
from .types import HmisLoginError, HmisLoginResult, HmisLoginSuccess

User = get_user_model()


@strawberry.type
class Mutation:
    @strawberry.mutation
    def hmisLogin(self, info: Info, email: str, password: str) -> HmisLoginResult:
        request = info.context["request"]

        token = create_auth_token(email, password)
        if not token:
            return HmisLoginError(message="Invalid credentials or HMIS login failed")

        # Require an existing user record.
        # We never auto-create accounts here — users must be pre-invited
        # into an organization that is linked to HMIS.
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return HmisLoginError(message="Invalid credentials or HMIS login failed")

        backend = settings.AUTHENTICATION_BACKENDS[0]
        django_login(request, user, backend=backend)

        return HmisLoginSuccess(hmisToken=token)
