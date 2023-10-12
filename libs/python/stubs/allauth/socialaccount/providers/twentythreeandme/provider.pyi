from _typeshed import Incomplete
from allauth.socialaccount.providers.base import ProviderAccount as ProviderAccount
from allauth.socialaccount.providers.oauth2.provider import OAuth2Provider as OAuth2Provider

class TwentyThreeAndMeAccount(ProviderAccount): ...

class TwentyThreeAndMeProvider(OAuth2Provider):
    id: str
    slug: str
    name: str
    account_class = TwentyThreeAndMeAccount
    def extract_uid(self, data): ...
    def get_default_scope(self): ...
    def extract_common_fields(self, data): ...

provider_classes: Incomplete
