from _typeshed import Incomplete
from allauth.socialaccount import app_settings as app_settings
from allauth.socialaccount.providers.openid_connect.provider import OpenIDConnectProvider as OpenIDConnectProvider, OpenIDConnectProviderAccount as OpenIDConnectProviderAccount

OVERRIDE_NAME: Incomplete

class KeycloakAccount(OpenIDConnectProviderAccount):
    def get_avatar_url(self): ...

class KeycloakProvider(OpenIDConnectProvider):
    id: str
    name = OVERRIDE_NAME
    account_class = KeycloakAccount
    @property
    def provider_base_url(self): ...
    @property
    def settings(self): ...

provider_classes: Incomplete
