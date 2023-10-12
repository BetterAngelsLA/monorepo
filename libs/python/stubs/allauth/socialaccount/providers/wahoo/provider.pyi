from _typeshed import Incomplete
from allauth.account.models import EmailAddress as EmailAddress
from allauth.socialaccount import app_settings as app_settings
from allauth.socialaccount.providers.base import ProviderAccount as ProviderAccount
from allauth.socialaccount.providers.oauth2.provider import OAuth2Provider as OAuth2Provider

class WahooAccount(ProviderAccount):
    def get_profile_url(self): ...

class WahooProvider(OAuth2Provider):
    id: str
    name: str
    account_class = WahooAccount
    def extract_uid(self, data): ...
    def extract_common_fields(self, data): ...
    def extract_email_addresses(self, data): ...
    def get_default_scope(self): ...

provider_classes: Incomplete
