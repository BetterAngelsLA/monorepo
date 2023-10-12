from .provider import DisqusProvider as DisqusProvider
from _typeshed import Incomplete
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

class DisqusOAuth2Adapter(OAuth2Adapter):
    provider_id: Incomplete
    access_token_url: str
    authorize_url: str
    profile_url: str
    scope_delimiter: str
    def complete_login(self, request, app, token, **kwargs): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
