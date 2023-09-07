from _typeshed import Incomplete
from allauth.socialaccount import providers as providers
from allauth.socialaccount.helpers import complete_social_login as complete_social_login, render_authentication_error as render_authentication_error
from allauth.socialaccount.models import SocialLogin as SocialLogin, SocialToken as SocialToken
from allauth.socialaccount.providers.base.constants import AuthAction as AuthAction, AuthError as AuthError
from allauth.socialaccount.providers.base.mixins import OAuthLoginMixin as OAuthLoginMixin
from allauth.socialaccount.providers.oauth.client import OAuthClient as OAuthClient, OAuthError as OAuthError

class OAuthAdapter:
    request: Incomplete
    def __init__(self, request) -> None: ...
    def complete_login(self, request, app) -> None: ...
    def get_provider(self): ...

class OAuthView:
    request: Incomplete
    adapter: Incomplete
    @classmethod
    def adapter_view(cls, adapter): ...

class OAuthLoginView(OAuthLoginMixin, OAuthView):
    def login(self, request, *args, **kwargs): ...

class OAuthCallbackView(OAuthView):
    def dispatch(self, request): ...
