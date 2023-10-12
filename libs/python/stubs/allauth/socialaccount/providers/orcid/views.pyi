from .provider import OrcidProvider as OrcidProvider
from _typeshed import Incomplete
from allauth.socialaccount import app_settings as app_settings
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

class OrcidOAuth2Adapter(OAuth2Adapter):
    provider_id: Incomplete
    member_api_default: bool
    base_domain_default: str
    settings: Incomplete
    base_domain: Incomplete
    member_api: Incomplete
    api_domain: Incomplete
    authorize_url: Incomplete
    access_token_url: Incomplete
    profile_url: Incomplete
    def complete_login(self, request, app, token, **kwargs): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
