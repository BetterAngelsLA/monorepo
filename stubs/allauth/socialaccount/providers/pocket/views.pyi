from ..oauth.views import OAuthAdapter as OAuthAdapter, OAuthCallbackView as OAuthCallbackView, OAuthLoginView as OAuthLoginView
from .client import PocketOAuthClient as PocketOAuthClient
from .provider import PocketProvider as PocketProvider
from _typeshed import Incomplete

class PocketOAuthAdapter(OAuthAdapter):
    provider_id: Incomplete
    request_token_url: str
    access_token_url: str
    authorize_url: str
    def complete_login(self, request, app, token, response): ...

class PocketOAuthLoginView(OAuthLoginView): ...
class PocketOAuthCallbackView(OAuthCallbackView): ...

oauth_login: Incomplete
oauth_callback: Incomplete
