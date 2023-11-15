from _typeshed import Incomplete
from allauth.socialaccount.providers.oauth.client import OAuthClient as OAuthClient, OAuthError as OAuthError, get_token_prefix as get_token_prefix
from allauth.utils import build_absolute_uri as build_absolute_uri

class PocketOAuthClient(OAuthClient):
    def get_redirect(self, authorization_url, extra_params): ...
    access_token: Incomplete
    def get_access_token(self): ...
