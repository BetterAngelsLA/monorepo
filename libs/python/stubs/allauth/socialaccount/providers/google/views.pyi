from .provider import GoogleProvider as GoogleProvider
from _typeshed import Incomplete
from allauth.socialaccount.providers.oauth2.client import OAuth2Error as OAuth2Error
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

ACCESS_TOKEN_URL: Incomplete
AUTHORIZE_URL: Incomplete
ID_TOKEN_ISSUER: Incomplete

class GoogleOAuth2Adapter(OAuth2Adapter):
    provider_id: Incomplete
    access_token_url = ACCESS_TOKEN_URL
    authorize_url = AUTHORIZE_URL
    id_token_issuer = ID_TOKEN_ISSUER
    def complete_login(self, request, app, token, response, **kwargs): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
