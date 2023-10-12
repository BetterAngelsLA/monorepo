from _typeshed import Incomplete
from allauth.socialaccount.providers.globus.provider import GlobusProvider as GlobusProvider
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

class GlobusAdapter(OAuth2Adapter):
    provider_id: Incomplete
    provider_default_url: str
    provider_base_url: str
    access_token_url: Incomplete
    authorize_url: Incomplete
    profile_url: Incomplete
    def complete_login(self, request, app, token, response): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
