from .provider import OpenStreetMapProvider as OpenStreetMapProvider
from _typeshed import Incomplete
from allauth.socialaccount.providers.oauth.client import OAuth as OAuth
from allauth.socialaccount.providers.oauth.views import OAuthAdapter as OAuthAdapter, OAuthCallbackView as OAuthCallbackView, OAuthLoginView as OAuthLoginView

class OpenStreetMapAPI(OAuth):
    url: str
    def get_user_info(self): ...

class OpenStreetMapOAuthAdapter(OAuthAdapter):
    provider_id: Incomplete
    request_token_url: str
    access_token_url: str
    authorize_url: str
    def complete_login(self, request, app, token, response): ...

oauth_login: Incomplete
oauth_callback: Incomplete
