from .client import UntappdOAuth2Client as UntappdOAuth2Client
from .provider import UntappdProvider as UntappdProvider
from _typeshed import Incomplete
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

class UntappdOAuth2Adapter(OAuth2Adapter):
    client_class = UntappdOAuth2Client
    provider_id: Incomplete
    access_token_url: str
    access_token_method: str
    authorize_url: str
    user_info_url: str
    supports_state: bool
    def complete_login(self, request, app, token, **kwargs): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
