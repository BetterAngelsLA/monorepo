from _typeshed import Incomplete
from allauth.socialaccount.providers.base import ProviderAccount as ProviderAccount
from allauth.socialaccount.providers.oauth2.provider import OAuth2Provider as OAuth2Provider

class FeedlyAccount(ProviderAccount):
    def get_avatar_url(self): ...
    def to_str(self): ...

class FeedlyProvider(OAuth2Provider):
    id: Incomplete
    name: str
    account_class = FeedlyAccount
    def get_default_scope(self): ...
    def extract_uid(self, data): ...
    def extract_common_fields(self, data): ...

provider_classes: Incomplete
