from .provider import PaypalProvider as PaypalProvider
from _typeshed import Incomplete
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

class PaypalOAuth2Adapter(OAuth2Adapter):
    provider_id: Incomplete
    supports_state: bool
    @property
    def authorize_url(self): ...
    @property
    def access_token_url(self): ...
    @property
    def profile_url(self): ...
    def complete_login(self, request, app, token, **kwargs): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
