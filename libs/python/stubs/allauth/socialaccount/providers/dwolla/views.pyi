from .provider import DwollaProvider as DwollaProvider
from _typeshed import Incomplete
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

ENVIRONMENTS: Incomplete
ENV: Incomplete
AUTH_URL: Incomplete
TOKEN_URL: Incomplete

class DwollaOAuth2Adapter(OAuth2Adapter):
    scope_delimiter: str
    provider_id: Incomplete
    access_token_url = TOKEN_URL
    authorize_url = AUTH_URL
    def complete_login(self, request, app, token, response, **kwargs): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
