from .provider import FiveHundredPxProvider as FiveHundredPxProvider
from _typeshed import Incomplete
from allauth.socialaccount.providers.oauth.client import OAuth as OAuth
from allauth.socialaccount.providers.oauth.views import OAuthAdapter as OAuthAdapter, OAuthCallbackView as OAuthCallbackView, OAuthLoginView as OAuthLoginView

API_BASE: str

class FiveHundredPxAPI(OAuth):
    url: Incomplete
    def get_user_info(self): ...

class FiveHundredPxOAuthAdapter(OAuthAdapter):
    provider_id: Incomplete
    request_token_url: Incomplete
    access_token_url: Incomplete
    authorize_url: Incomplete
    def complete_login(self, request, app, token, response): ...

oauth_login: Incomplete
oauth_callback: Incomplete
