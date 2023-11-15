from _typeshed import Incomplete
from allauth.socialaccount.providers.base import ProviderAccount as ProviderAccount
from allauth.socialaccount.providers.oauth2.provider import OAuth2Provider as OAuth2Provider

class BasecampAccount(ProviderAccount):
    def get_avatar_url(self) -> None: ...
    def to_str(self): ...

class BasecampProvider(OAuth2Provider):
    id: str
    name: str
    account_class = BasecampAccount
    def get_auth_params(self, request, action): ...
    def extract_uid(self, data): ...
    def extract_common_fields(self, data): ...

provider_classes: Incomplete
