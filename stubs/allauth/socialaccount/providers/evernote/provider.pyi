from _typeshed import Incomplete
from allauth.socialaccount.providers.base import ProviderAccount as ProviderAccount
from allauth.socialaccount.providers.oauth.provider import OAuthProvider as OAuthProvider

class EvernoteAccount(ProviderAccount):
    def get_profile_url(self) -> None: ...
    def get_avatar_url(self) -> None: ...

class EvernoteProvider(OAuthProvider):
    id: str
    name: str
    account_class = EvernoteAccount
    def extract_uid(self, data): ...
    def extract_common_fields(self, data): ...

provider_classes: Incomplete
