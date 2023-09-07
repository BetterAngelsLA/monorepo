from _typeshed import Incomplete
from allauth.socialaccount import app_settings as app_settings
from allauth.socialaccount.providers.gitlab.provider import GitLabProvider as GitLabProvider
from allauth.socialaccount.providers.oauth2.client import OAuth2Error as OAuth2Error
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

class GitLabOAuth2Adapter(OAuth2Adapter):
    provider_id: Incomplete
    provider_default_url: str
    provider_api_version: str
    settings: Incomplete
    provider_base_url: Incomplete
    access_token_url: Incomplete
    authorize_url: Incomplete
    profile_url: Incomplete
    def complete_login(self, request, app, token, response): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
