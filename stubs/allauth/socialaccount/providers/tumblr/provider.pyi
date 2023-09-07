from _typeshed import Incomplete
from allauth.socialaccount.providers.base import ProviderAccount as ProviderAccount
from allauth.socialaccount.providers.oauth.provider import OAuthProvider as OAuthProvider

class TumblrAccount(ProviderAccount):
    def get_profile_url_(self): ...
    def to_str(self): ...

class TumblrProvider(OAuthProvider):
    id: str
    name: str
    account_class = TumblrAccount
    def extract_uid(self, data): ...
    def extract_common_fields(self, data): ...

provider_classes: Incomplete
