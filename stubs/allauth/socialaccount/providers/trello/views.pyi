from .provider import TrelloProvider as TrelloProvider
from _typeshed import Incomplete
from allauth.socialaccount.providers.oauth.views import OAuthAdapter as OAuthAdapter, OAuthCallbackView as OAuthCallbackView, OAuthLoginView as OAuthLoginView

class TrelloOAuthAdapter(OAuthAdapter):
    provider_id: Incomplete
    request_token_url: str
    authorize_url: str
    access_token_url: str
    def complete_login(self, request, app, token, response): ...

oauth_login: Incomplete
oauth_callback: Incomplete
