from .client import FeishuOAuth2Client as FeishuOAuth2Client
from .provider import FeishuProvider as FeishuProvider
from _typeshed import Incomplete
from allauth.account import app_settings as app_settings
from allauth.socialaccount.providers.oauth2.client import OAuth2Error as OAuth2Error
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView
from allauth.utils import build_absolute_uri as build_absolute_uri

class FeishuOAuth2Adapter(OAuth2Adapter):
    provider_id: Incomplete
    authorization_url: str
    access_token_url: str
    app_access_token_url: str
    user_info_url: str
    @property
    def authorize_url(self): ...
    def complete_login(self, request, app, token, **kwargs): ...

class FeishuOAuth2ClientMixin:
    def get_client(self, request, app): ...

class FeishuOAuth2LoginView(FeishuOAuth2ClientMixin, OAuth2LoginView): ...
class FeishuOAuth2CallbackView(FeishuOAuth2ClientMixin, OAuth2CallbackView): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
