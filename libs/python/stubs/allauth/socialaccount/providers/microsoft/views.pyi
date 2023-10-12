from .provider import MicrosoftGraphProvider as MicrosoftGraphProvider
from _typeshed import Incomplete
from allauth.socialaccount import app_settings as app_settings
from allauth.socialaccount.providers.oauth2.client import OAuth2Error as OAuth2Error
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

class MicrosoftGraphOAuth2Adapter(OAuth2Adapter):
    provider_id: Incomplete
    settings: Incomplete
    tenant: Incomplete
    provider_base_url: Incomplete
    access_token_url: Incomplete
    authorize_url: Incomplete
    profile_url: str
    user_properties: Incomplete
    profile_url_params: Incomplete
    def complete_login(self, request, app, token, **kwargs): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
