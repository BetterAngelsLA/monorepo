from _typeshed import Incomplete
from allauth.socialaccount.providers.base import ProviderAccount as ProviderAccount
from allauth.socialaccount.providers.oauth2.provider import OAuth2Provider as OAuth2Provider

class InstagramAccount(ProviderAccount):
    PROFILE_URL: str
    def get_profile_url(self): ...
    def to_str(self): ...

class InstagramProvider(OAuth2Provider):
    id: str
    name: str
    account_class = InstagramAccount
    def extract_extra_data(self, data): ...
    def get_default_scope(self): ...
    def extract_uid(self, data): ...
    def extract_common_fields(self, data): ...

provider_classes: Incomplete
