from .provider import BitbucketOAuth2Provider as BitbucketOAuth2Provider
from _typeshed import Incomplete
from allauth.socialaccount import app_settings as app_settings
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

class BitbucketOAuth2Adapter(OAuth2Adapter):
    provider_id: Incomplete
    access_token_url: str
    authorize_url: str
    profile_url: str
    emails_url: str
    def complete_login(self, request, app, token, **kwargs): ...
    def get_email(self, token): ...

oauth_login: Incomplete
oauth_callback: Incomplete
