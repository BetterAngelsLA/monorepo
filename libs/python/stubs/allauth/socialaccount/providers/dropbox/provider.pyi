from allauth.socialaccount import providers as providers
from allauth.socialaccount.providers.base import ProviderAccount as ProviderAccount
from allauth.socialaccount.providers.oauth2.provider import OAuth2Provider as OAuth2Provider

class DropboxOAuth2Account(ProviderAccount): ...

class DropboxOAuth2Provider(OAuth2Provider):
    id: str
    name: str
    account_class = DropboxOAuth2Account
    def extract_uid(self, data): ...
    def extract_common_fields(self, data): ...
