from _typeshed import Incomplete
from allauth.account.models import EmailAddress as EmailAddress
from allauth.socialaccount import app_settings as app_settings
from allauth.socialaccount.providers.base import AuthAction as AuthAction, ProviderAccount as ProviderAccount
from allauth.socialaccount.providers.oauth2.provider import OAuth2Provider as OAuth2Provider

class Scope:
    NAME: str
    EMAIL: str
    PHONE: str
    ADDRESS: str
    LOCATION: str
    PUSH: str

IDENTITY_CLAIMS: Incomplete

class AuthentiqAccount(ProviderAccount):
    def get_profile_url(self): ...
    def get_avatar_url(self): ...
    def to_str(self): ...

class AuthentiqProvider(OAuth2Provider):
    id: str
    name: str
    account_class = AuthentiqAccount
    def get_scope(self, request): ...
    def get_default_scope(self): ...
    def get_auth_params(self, request, action): ...
    def extract_uid(self, data): ...
    def extract_common_fields(self, data): ...
    def extract_extra_data(self, data): ...
    def extract_email_addresses(self, data): ...

provider_classes: Incomplete
