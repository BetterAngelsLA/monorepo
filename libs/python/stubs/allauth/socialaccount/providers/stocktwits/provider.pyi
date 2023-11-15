from _typeshed import Incomplete
from allauth.socialaccount.providers.base import ProviderAccount as ProviderAccount
from allauth.socialaccount.providers.oauth2.provider import OAuth2Provider as OAuth2Provider

class StocktwitsAccount(ProviderAccount):
    def get_avatar_url(self): ...
    def to_str(self): ...

class StocktwitsProvider(OAuth2Provider):
    id: str
    name: str
    account_class = StocktwitsAccount
    def extract_uid(self, data): ...
    def extract_common_fields(self, data): ...

provider_classes: Incomplete
