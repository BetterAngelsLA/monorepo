from _typeshed import Incomplete
from allauth.account.models import EmailAddress as EmailAddress
from allauth.socialaccount.providers.base import ProviderAccount as ProviderAccount
from allauth.socialaccount.providers.oauth.provider import OAuthProvider as OAuthProvider

class PocketAccount(ProviderAccount):
    def to_str(self): ...

class PocketProvider(OAuthProvider):
    id: str
    name: str
    account_class = PocketAccount
    def extract_uid(self, data): ...
    def extract_common_fields(self, data): ...
    def extract_email_addresses(self, data): ...

provider_classes: Incomplete
