from .provider import UntappdProvider as UntappdProvider
from _typeshed import Incomplete
from allauth.socialaccount import app_settings as app_settings
from allauth.socialaccount.providers.oauth2.client import OAuth2Client as OAuth2Client, OAuth2Error as OAuth2Error

class UntappdOAuth2Client(OAuth2Client):
    def get_access_token(self, code, pkce_code_verifier: Incomplete | None = ...): ...
