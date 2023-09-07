from _typeshed import Incomplete
from allauth.socialaccount.providers.base import ProviderAccount as ProviderAccount
from allauth.socialaccount.providers.oauth2.provider import OAuth2Provider as OAuth2Provider

class StripeAccount(ProviderAccount):
    def to_str(self): ...

class StripeProvider(OAuth2Provider):
    id: str
    name: str
    account_class = StripeAccount
    def extract_uid(self, data): ...
    def extract_common_fields(self, data): ...
    def get_default_scope(self): ...

provider_classes: Incomplete
