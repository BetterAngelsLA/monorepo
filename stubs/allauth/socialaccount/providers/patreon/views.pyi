from .provider import API_URL as API_URL, PatreonProvider as PatreonProvider, USE_API_V2 as USE_API_V2
from _typeshed import Incomplete
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

class PatreonOAuth2Adapter(OAuth2Adapter):
    provider_id: Incomplete
    access_token_url: str
    authorize_url: str
    profile_url: Incomplete
    def complete_login(self, request, app, token, **kwargs): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
