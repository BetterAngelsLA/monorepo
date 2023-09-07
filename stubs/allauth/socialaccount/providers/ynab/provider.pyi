from _typeshed import Incomplete
from allauth.socialaccount.providers.base import AuthAction as AuthAction, ProviderAccount as ProviderAccount
from allauth.socialaccount.providers.oauth2.provider import OAuth2Provider as OAuth2Provider

class Scope:
    ACCESS: str

class YNABAccount(ProviderAccount): ...

class YNABProvider(OAuth2Provider):
    id: str
    name: str
    account_class = YNABAccount
    def get_default_scope(self): ...
    def get_auth_params(self, request, action): ...
    def extract_uid(self, data): ...

provider_classes: Incomplete
