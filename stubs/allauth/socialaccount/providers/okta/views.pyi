from .provider import OktaProvider as OktaProvider
from _typeshed import Incomplete
from allauth.socialaccount import app_settings as app_settings
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

class OktaOAuth2Adapter(OAuth2Adapter):
    provider_id: Incomplete
    settings: Incomplete
    okta_base_url: Incomplete
    @property
    def access_token_url(self): ...
    @property
    def authorize_url(self): ...
    @property
    def userinfo_url(self): ...
    @property
    def access_token_method(self): ...
    def complete_login(self, request, app, token, **kwargs): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
