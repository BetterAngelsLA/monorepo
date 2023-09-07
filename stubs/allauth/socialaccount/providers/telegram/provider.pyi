from _typeshed import Incomplete
from allauth.socialaccount.providers.base import Provider as Provider, ProviderAccount as ProviderAccount

class TelegramAccount(ProviderAccount): ...

class TelegramProvider(Provider):
    id: str
    name: str
    account_class = TelegramAccount
    def get_login_url(self, request, **kwargs): ...
    def extract_uid(self, data): ...
    def extract_common_fields(self, data): ...

provider_classes: Incomplete
