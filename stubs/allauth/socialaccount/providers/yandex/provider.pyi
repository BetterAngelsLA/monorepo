from _typeshed import Incomplete
from allauth.account.models import EmailAddress as EmailAddress
from allauth.socialaccount import app_settings as app_settings
from allauth.socialaccount.providers.base import ProviderAccount as ProviderAccount
from allauth.socialaccount.providers.oauth2.provider import OAuth2Provider as OAuth2Provider

class YandexAccout(ProviderAccount):
    def to_str(self): ...

class YandexProvider(OAuth2Provider):
    id: str
    name: str
    account_class = YandexAccout
    def get_default_scope(self): ...
    def extract_uid(self, data): ...
    def get_user_email(self, data): ...
    def extract_common_fields(self, data): ...
    def extract_email_addresses(self, data): ...

provider_classes: Incomplete
