from .locale import get_default_locale_callable as get_default_locale_callable
from _typeshed import Incomplete
from allauth.account.models import EmailAddress as EmailAddress
from allauth.socialaccount.app_settings import QUERY_EMAIL as QUERY_EMAIL
from allauth.socialaccount.providers.base import AuthAction as AuthAction, AuthProcess as AuthProcess, ProviderAccount as ProviderAccount
from allauth.socialaccount.providers.oauth2.provider import OAuth2Provider as OAuth2Provider
from allauth.utils import import_callable as import_callable

GRAPH_API_VERSION: Incomplete
GRAPH_API_URL: Incomplete
NONCE_SESSION_KEY: str
NONCE_LENGTH: int

class FacebookAccount(ProviderAccount):
    def get_profile_url(self): ...
    def get_avatar_url(self): ...
    def to_str(self): ...

class FacebookProvider(OAuth2Provider):
    id: str
    name: str
    account_class = FacebookAccount
    def __init__(self, request) -> None: ...
    def get_method(self): ...
    def get_login_url(self, request, **kwargs): ...
    def get_locale_for_request(self, request): ...
    def get_default_scope(self): ...
    def get_fields(self): ...
    def get_auth_params(self, request, action): ...
    def get_init_params(self, request, app): ...
    def get_fb_login_options(self, request): ...
    def get_sdk_url(self, request): ...
    def media_js(self, request): ...
    def get_nonce(self, request, or_create: bool = ..., pop: bool = ...): ...
    def extract_uid(self, data): ...
    def extract_common_fields(self, data): ...
    def extract_email_addresses(self, data): ...

provider_classes: Incomplete
