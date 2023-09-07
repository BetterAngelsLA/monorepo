from _typeshed import Incomplete
from allauth.account.models import EmailAddress as EmailAddress
from allauth.socialaccount.providers.base import ProviderAccount as ProviderAccount
from allauth.socialaccount.providers.oauth2.provider import OAuth2Provider as OAuth2Provider

class NaverAccount(ProviderAccount):
    def get_avatar_url(self): ...
    def to_str(self): ...

class NaverProvider(OAuth2Provider):
    id: str
    name: str
    account_class = NaverAccount
    def extract_uid(self, data): ...
    def extract_common_fields(self, data): ...
    def extract_email_addresses(self, data): ...

provider_classes: Incomplete
