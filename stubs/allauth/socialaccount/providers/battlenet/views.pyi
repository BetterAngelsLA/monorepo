from .provider import BattleNetProvider as BattleNetProvider
from _typeshed import Incomplete
from allauth.socialaccount.providers.oauth2.client import OAuth2Error as OAuth2Error
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter as OAuth2Adapter, OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView

class Region:
    APAC: str
    CN: str
    EU: str
    KR: str
    SEA: str
    TW: str
    US: str

class BattleNetOAuth2Adapter(OAuth2Adapter):
    provider_id: Incomplete
    valid_regions: Incomplete
    @property
    def battlenet_region(self): ...
    @property
    def battlenet_base_url(self): ...
    @property
    def access_token_url(self): ...
    @property
    def authorize_url(self): ...
    @property
    def profile_url(self): ...
    def complete_login(self, request, app, token, **kwargs): ...
    def get_callback_url(self, request, app): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
