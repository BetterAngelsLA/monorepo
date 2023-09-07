from _typeshed import Incomplete
from allauth.socialaccount import app_settings as app_settings
from allauth.socialaccount.providers.netiq.provider import NetIQProvider as NetIQProvider
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

class NetIQOAuth2Adapter(OAuth2Adapter):
    provider_id: Incomplete
    supports_state: bool
    settings: Incomplete
    provider_base_url: Incomplete
    @property
    def access_token_url(self): ...
    @property
    def authorize_url(self): ...
    @property
    def userinfo_url(self): ...
    def complete_login(self, request, app, token, **kwargs): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
