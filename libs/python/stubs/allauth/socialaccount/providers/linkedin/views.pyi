from .provider import LinkedInProvider as LinkedInProvider
from _typeshed import Incomplete
from allauth.socialaccount import providers as providers
from allauth.socialaccount.providers.oauth.client import OAuth as OAuth
from allauth.socialaccount.providers.oauth.views import OAuthAdapter as OAuthAdapter, OAuthCallbackView as OAuthCallbackView, OAuthLoginView as OAuthLoginView

class LinkedInAPI(OAuth):
    url: str
    def get_user_info(self): ...
    def to_dict(self, xml): ...

class LinkedInOAuthAdapter(OAuthAdapter):
    provider_id: Incomplete
    request_token_url: str
    access_token_url: str
    authorize_url: str
    def complete_login(self, request, app, token, response): ...

oauth_login: Incomplete
oauth_callback: Incomplete
