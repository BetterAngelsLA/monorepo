from _typeshed import Incomplete
from allauth.socialaccount import app_settings as app_settings
from allauth.socialaccount.providers.base import ProviderAccount as ProviderAccount, ProviderException as ProviderException
from allauth.socialaccount.providers.oauth2.provider import OAuth2Provider as OAuth2Provider

class QuickBooksAccount(ProviderAccount):
    def to_str(self): ...

class QuickBooksOAuth2Provider(OAuth2Provider):
    id: str
    name: str
    account_class = QuickBooksAccount
    def extract_uid(self, data): ...
    def get_profile_fields(self): ...
    def get_default_scope(self): ...
    def extract_common_fields(self, data): ...

provider_classes: Incomplete
