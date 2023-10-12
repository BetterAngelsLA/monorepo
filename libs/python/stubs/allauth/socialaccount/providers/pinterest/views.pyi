from .provider import PinterestProvider as PinterestProvider
from _typeshed import Incomplete
from allauth.socialaccount import app_settings as app_settings
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

class PinterestOAuth2Adapter(OAuth2Adapter):
    provider_id: Incomplete
    provider_default_url: str
    provider_default_api_version: str
    settings: Incomplete
    provider_base_url: Incomplete
    provider_api_version: Incomplete
    authorize_url: str
    access_token_url: Incomplete
    basic_auth: bool
    profile_url: Incomplete
    access_token_method: str
    def complete_login(self, request, app, token, **kwargs): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
