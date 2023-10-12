from .provider import EdxProvider as EdxProvider
from _typeshed import Incomplete
from allauth.socialaccount import app_settings as app_settings
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

class EdxOAuth2Adapter(OAuth2Adapter):
    provider_id: Incomplete
    provider_default_url: str
    settings: Incomplete
    provider_base_url: Incomplete
    access_token_url: Incomplete
    authorize_url: Incomplete
    profile_url: Incomplete
    account_url: str
    supports_state: bool
    redirect_uri_protocol: str
    def complete_login(self, request, app, token, **kwargs): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
