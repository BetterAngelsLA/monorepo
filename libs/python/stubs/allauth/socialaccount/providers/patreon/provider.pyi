from _typeshed import Incomplete
from allauth.socialaccount.providers.base import ProviderAccount as ProviderAccount
from allauth.socialaccount.providers.oauth2.provider import OAuth2Provider as OAuth2Provider

API_VERSION: Incomplete
USE_API_V2: Incomplete
API_URL: Incomplete

class PatreonAccount(ProviderAccount):
    def get_avatar_url(self): ...

class PatreonProvider(OAuth2Provider):
    id: str
    name: str
    account_class = PatreonAccount
    def get_default_scope(self): ...
    def extract_uid(self, data): ...
    def extract_common_fields(self, data): ...

provider_classes: Incomplete
