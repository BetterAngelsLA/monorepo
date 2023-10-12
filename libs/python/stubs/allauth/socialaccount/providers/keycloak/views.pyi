from _typeshed import Incomplete
from allauth.socialaccount.providers.keycloak.provider import KeycloakProvider as KeycloakProvider
from allauth.socialaccount.providers.oauth2.views import OAuth2CallbackView as OAuth2CallbackView, OAuth2LoginView as OAuth2LoginView
from allauth.socialaccount.providers.openid_connect.views import OpenIDConnectAdapter as OpenIDConnectAdapter

class KeycloakOAuth2Adapter(OpenIDConnectAdapter):
    provider_id: Incomplete
    @property
    def authorize_url(self): ...
    @property
    def access_token_url(self): ...
    @property
    def profile_url(self): ...

oauth2_login: Incomplete
oauth2_callback: Incomplete
