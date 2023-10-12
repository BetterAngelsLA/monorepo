from _typeshed import Incomplete
from allauth.account.models import EmailAddress as EmailAddress
from allauth.socialaccount.app_settings import QUERY_EMAIL as QUERY_EMAIL
from allauth.socialaccount.providers.base import AuthAction as AuthAction, ProviderAccount as ProviderAccount
from allauth.socialaccount.providers.oauth2.provider import OAuth2Provider as OAuth2Provider

class Scope:
    OPENID: str
    EMAIL: str
    PROFILE: str
    USERINFO: str

class CILogonAccount(ProviderAccount):
    def to_str(self): ...

class CILogonProvider(OAuth2Provider):
    id: str
    name: str
    account_class = CILogonAccount
    def get_default_scope(self): ...
    def get_auth_params(self, request, action): ...
    def extract_uid(self, data): ...
    def extract_common_fields(self, data): ...
    def extract_email_addresses(self, data): ...

provider_classes: Incomplete
