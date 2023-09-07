from .provider import CleverProvider as CleverProvider
from _typeshed import Incomplete
from allauth.socialaccount.providers.oauth2.client import OAuth2Error as OAuth2Error
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

class CleverOAuth2Adapter(OAuth2Adapter):
    provider_id: Incomplete
    access_token_url: str
    authorize_url: str
    identity_url: str
    user_details_url: str
    supports_state: bool
    def complete_login(self, request, app, token, **kwargs): ...
    def get_data(self, token): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
