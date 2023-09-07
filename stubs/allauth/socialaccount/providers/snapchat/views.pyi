from .provider import Scope as Scope, SnapchatProvider as SnapchatProvider
from _typeshed import Incomplete
from allauth.socialaccount import app_settings as app_settings
from allauth.socialaccount.providers.oauth2.client import OAuth2Error as OAuth2Error
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

class SnapchatOAuth2Adapter(OAuth2Adapter):
    provider_id: Incomplete
    access_token_url: str
    authorize_url: str
    identity_url: str
    def complete_login(self, request, app, token, **kwargs): ...
    def get_data(self, token): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
