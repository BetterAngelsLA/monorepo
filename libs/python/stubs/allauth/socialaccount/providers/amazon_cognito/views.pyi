from _typeshed import Incomplete
from allauth.socialaccount import app_settings as app_settings
from allauth.socialaccount.providers.amazon_cognito.provider import AmazonCognitoProvider as AmazonCognitoProvider
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

class AmazonCognitoOAuth2Adapter(OAuth2Adapter):
    provider_id: Incomplete
    DOMAIN_KEY_MISSING_ERROR: str
    @property
    def settings(self): ...
    @property
    def domain(self): ...
    @property
    def access_token_url(self): ...
    @property
    def authorize_url(self): ...
    @property
    def profile_url(self): ...
    def complete_login(self, request, app, access_token, **kwargs): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
