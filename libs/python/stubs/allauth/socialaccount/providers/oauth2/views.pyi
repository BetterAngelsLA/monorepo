from _typeshed import Incomplete
from allauth.exceptions import ImmediateHttpResponse as ImmediateHttpResponse
from allauth.socialaccount import providers as providers
from allauth.socialaccount.helpers import complete_social_login as complete_social_login, render_authentication_error as render_authentication_error
from allauth.socialaccount.models import SocialLogin as SocialLogin, SocialToken as SocialToken
from allauth.socialaccount.providers.base import ProviderException as ProviderException
from allauth.socialaccount.providers.base.constants import AuthAction as AuthAction, AuthError as AuthError
from allauth.socialaccount.providers.base.mixins import OAuthLoginMixin as OAuthLoginMixin
from allauth.socialaccount.providers.oauth2.client import OAuth2Client as OAuth2Client, OAuth2Error as OAuth2Error
from allauth.utils import build_absolute_uri as build_absolute_uri, get_request_param as get_request_param

class OAuth2Adapter:
    expires_in_key: str
    client_class = OAuth2Client
    supports_state: bool
    redirect_uri_protocol: Incomplete
    access_token_method: str
    login_cancelled_error: str
    scope_delimiter: str
    basic_auth: bool
    headers: Incomplete
    request: Incomplete
    def __init__(self, request) -> None: ...
    def get_provider(self): ...
    def complete_login(self, request, app, access_token, **kwargs) -> None: ...
    def get_callback_url(self, request, app): ...
    def parse_token(self, data): ...
    def get_access_token_data(self, request, app, client): ...

class OAuth2View:
    request: Incomplete
    adapter: Incomplete
    @classmethod
    def adapter_view(cls, adapter): ...
    def get_client(self, request, app): ...

class OAuth2LoginView(OAuthLoginMixin, OAuth2View):
    def login(self, request, *args, **kwargs): ...

class OAuth2CallbackView(OAuth2View):
    def dispatch(self, request, *args, **kwargs): ...
