from _typeshed import Incomplete
from allauth.socialaccount import app_settings as app_settings
from allauth.socialaccount.providers.gumroad.provider import GumroadProvider as GumroadProvider
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

class GumroadOauth2Adapter(OAuth2Adapter):
    provider_id: Incomplete
    supports_state: bool
    settings: Incomplete
    provider_base_url: Incomplete
    access_token_url: Incomplete
    authorize_url: Incomplete
    profile_url: str
    def complete_login(self, request, app, token, response): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
