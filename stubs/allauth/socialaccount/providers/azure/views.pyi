from .provider import AzureProvider as AzureProvider
from _typeshed import Incomplete
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

LOGIN_URL: str
GRAPH_URL: str

class AzureOAuth2Adapter(OAuth2Adapter):
    provider_id: Incomplete
    access_token_url: Incomplete
    authorize_url: Incomplete
    profile_url: str
    groups_url: Incomplete
    def complete_login(self, request, app, token, **kwargs): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
