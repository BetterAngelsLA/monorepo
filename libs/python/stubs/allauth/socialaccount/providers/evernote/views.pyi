from .provider import EvernoteProvider as EvernoteProvider
from _typeshed import Incomplete
from allauth.socialaccount import app_settings as app_settings
from allauth.socialaccount.providers.oauth.views import OAuthAdapter as OAuthAdapter, OAuthCallbackView as OAuthCallbackView, OAuthLoginView as OAuthLoginView

class EvernoteOAuthAdapter(OAuthAdapter):
    provider_id: Incomplete
    settings: Incomplete
    request_token_url: Incomplete
    access_token_url: Incomplete
    authorize_url: Incomplete
    def complete_login(self, request, app, token, response): ...

oauth_login: Incomplete
oauth_callback: Incomplete
