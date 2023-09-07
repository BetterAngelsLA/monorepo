from _typeshed import Incomplete
from allauth.socialaccount.providers.base import ProviderAccount as ProviderAccount
from allauth.socialaccount.providers.oauth2.provider import OAuth2Provider as OAuth2Provider

class AzureAccount(ProviderAccount):
    def get_username(self): ...
    def to_str(self): ...

class AzureProvider(OAuth2Provider):
    id: Incomplete
    name: str
    account_class = AzureAccount
    def get_default_scope(self): ...
    def extract_uid(self, data): ...
    def extract_common_fields(self, data): ...

provider_classes: Incomplete
