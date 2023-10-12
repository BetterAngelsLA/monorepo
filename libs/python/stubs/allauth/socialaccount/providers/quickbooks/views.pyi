from .provider import QuickBooksOAuth2Provider as QuickBooksOAuth2Provider
from _typeshed import Incomplete
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

class QuickBooksOAuth2Adapter(OAuth2Adapter):
    provider_id: Incomplete
    access_token_url: str
    authorize_url: str
    profile_test: str
    profile_url: str
    profile_url_method: str
    access_token_method: str
    def complete_login(self, request, app, token, **kwargs): ...
    def get_user_info(self, token): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
