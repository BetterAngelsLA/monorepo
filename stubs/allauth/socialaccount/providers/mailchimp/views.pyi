from .provider import MailChimpProvider as MailChimpProvider
from _typeshed import Incomplete
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

class MailChimpOAuth2Adapter(OAuth2Adapter):
    provider_id: Incomplete
    authorize_url: str
    access_token_url: str
    profile_url: str
    def complete_login(self, request, app, token, **kwargs): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
