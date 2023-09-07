from .forms import FacebookConnectForm as FacebookConnectForm
from .provider import FacebookProvider as FacebookProvider, GRAPH_API_URL as GRAPH_API_URL, GRAPH_API_VERSION as GRAPH_API_VERSION
from _typeshed import Incomplete
from allauth.socialaccount import app_settings as app_settings, providers as providers
from allauth.socialaccount.helpers import complete_social_login as complete_social_login, render_authentication_error as render_authentication_error
from allauth.socialaccount.models import SocialLogin as SocialLogin, SocialToken as SocialToken
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

logger: Incomplete

def compute_appsecret_proof(app, token): ...
def fb_complete_login(request, app, token): ...

class FacebookOAuth2Adapter(OAuth2Adapter):
    provider_id: Incomplete
    provider_default_auth_url: Incomplete
    settings: Incomplete
    scope_delimiter: str
    authorize_url: Incomplete
    access_token_url: Incomplete
    expires_in_key: str
    def complete_login(self, request, app, access_token, **kwargs): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete

def login_by_token(request): ...
