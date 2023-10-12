from _typeshed import Incomplete
from allauth.socialaccount.providers.base import ProviderAccount as ProviderAccount
from allauth.socialaccount.providers.oauth.provider import OAuthProvider as OAuthProvider

class VimeoAccount(ProviderAccount): ...

class VimeoProvider(OAuthProvider):
    id: str
    name: str
    account_class = VimeoAccount
    def get_default_scope(self): ...
    def extract_uid(self, data): ...
    def extract_common_fields(self, data): ...

provider_classes: Incomplete
