from .provider import FXA_OAUTH_ENDPOINT as FXA_OAUTH_ENDPOINT, FXA_PROFILE_ENDPOINT as FXA_PROFILE_ENDPOINT, FirefoxAccountsProvider as FirefoxAccountsProvider
from _typeshed import Incomplete
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

class FirefoxAccountsOAuth2Adapter(OAuth2Adapter):
    provider_id: Incomplete
    access_token_url: Incomplete
    authorize_url: Incomplete
    profile_url: Incomplete
    def complete_login(self, request, app, token, **kwargs): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
