from _typeshed import Incomplete
from allauth.account.models import EmailAddress as EmailAddress
from allauth.socialaccount.app_settings import QUERY_EMAIL as QUERY_EMAIL
from allauth.socialaccount.providers.base import ProviderAccount as ProviderAccount
from allauth.socialaccount.providers.oauth2.provider import OAuth2Provider as OAuth2Provider

class AppleProvider(OAuth2Provider):
    id: str
    name: str
    account_class = ProviderAccount
    def extract_uid(self, data): ...
    def extract_common_fields(self, data): ...
    def extract_email_addresses(self, data): ...
    def get_default_scope(self): ...

provider_classes: Incomplete
