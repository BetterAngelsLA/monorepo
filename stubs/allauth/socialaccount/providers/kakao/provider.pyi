from _typeshed import Incomplete
from allauth.account.models import EmailAddress as EmailAddress
from allauth.socialaccount.providers.base import ProviderAccount as ProviderAccount
from allauth.socialaccount.providers.oauth2.provider import OAuth2Provider as OAuth2Provider

class KakaoAccount(ProviderAccount):
    @property
    def properties(self): ...
    def get_avatar_url(self): ...
    def to_str(self): ...

class KakaoProvider(OAuth2Provider):
    id: str
    name: str
    account_class = KakaoAccount
    def extract_uid(self, data): ...
    def extract_common_fields(self, data): ...
    def extract_email_addresses(self, data): ...

provider_classes: Incomplete
