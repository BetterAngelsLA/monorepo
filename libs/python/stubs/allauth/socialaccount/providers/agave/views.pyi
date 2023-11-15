from _typeshed import Incomplete
from allauth.socialaccount import app_settings as app_settings
from allauth.socialaccount.providers.agave.provider import AgaveProvider as AgaveProvider
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

class AgaveAdapter(OAuth2Adapter):
    provider_id: Incomplete
    settings: Incomplete
    provider_base_url: Incomplete
    access_token_url: Incomplete
    authorize_url: Incomplete
    profile_url: Incomplete
    def complete_login(self, request, app, token, response): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
