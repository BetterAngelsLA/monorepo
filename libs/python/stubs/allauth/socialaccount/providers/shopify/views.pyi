from .provider import ShopifyProvider as ShopifyProvider
from _typeshed import Incomplete
from allauth.exceptions import ImmediateHttpResponse as ImmediateHttpResponse
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

class ShopifyOAuth2Adapter(OAuth2Adapter):
    provider_id: Incomplete
    supports_state: bool
    scope_delimiter: str
    @property
    def access_token_url(self): ...
    @property
    def authorize_url(self): ...
    @property
    def profile_url(self): ...
    def complete_login(self, request, app, token, **kwargs): ...

class ShopifyOAuth2LoginView(OAuth2LoginView):
    def dispatch(self, request, *args, **kwargs): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
