from .provider import ShareFileProvider as ShareFileProvider
from _typeshed import Incomplete
from allauth.socialaccount import app_settings as app_settings
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

class ShareFileOAuth2Adapter(OAuth2Adapter):
    provider_id: Incomplete
    settings: Incomplete
    subdomain: Incomplete
    apicp: Incomplete
    provider_default_url: Incomplete
    provider_default_api_url: Incomplete
    provider_api_version: str
    access_token_url: Incomplete
    refresh_token_url: Incomplete
    authorize_url: Incomplete
    profile_url: Incomplete
    def complete_login(self, request, app, token, response): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
