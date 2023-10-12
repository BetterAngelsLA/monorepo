from .provider import TwitterProvider as TwitterProvider
from _typeshed import Incomplete
from allauth.socialaccount.app_settings import QUERY_EMAIL as QUERY_EMAIL
from allauth.socialaccount.providers.oauth.client import OAuth as OAuth
from allauth.socialaccount.providers.oauth.views import OAuthAdapter as OAuthAdapter, OAuthCallbackView as OAuthCallbackView, OAuthLoginView as OAuthLoginView

class TwitterAPI(OAuth):
    url: Incomplete
    def get_user_info(self): ...

class TwitterOAuthAdapter(OAuthAdapter):
    provider_id: Incomplete
    request_token_url: str
    access_token_url: str
    authorize_url: str
    def complete_login(self, request, app, token, response): ...

oauth_login: Incomplete
oauth_callback: Incomplete
