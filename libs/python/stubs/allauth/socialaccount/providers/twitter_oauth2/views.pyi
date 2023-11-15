from .provider import TwitterOAuth2Provider as TwitterOAuth2Provider
from _typeshed import Incomplete
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

class TwitterOAuth2Adapter(OAuth2Adapter):
    provider_id: Incomplete
    access_token_url: str
    authorize_url: str
    profile_url: str
    def complete_login(self, request, app, access_token, **kwargs): ...
    def get_user_info(self, token): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
