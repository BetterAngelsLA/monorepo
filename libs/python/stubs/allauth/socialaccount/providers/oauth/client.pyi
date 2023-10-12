from _typeshed import Incomplete
from allauth.utils import build_absolute_uri as build_absolute_uri, get_request_param as get_request_param

def get_token_prefix(url): ...

class OAuthError(Exception): ...

class OAuthClient:
    request: Incomplete
    request_token_url: Incomplete
    access_token_url: Incomplete
    consumer_key: Incomplete
    consumer_secret: Incomplete
    parameters: Incomplete
    callback_url: Incomplete
    provider: Incomplete
    errors: Incomplete
    request_token: Incomplete
    access_token: Incomplete
    def __init__(self, request, consumer_key, consumer_secret, request_token_url, access_token_url, callback_url, parameters: Incomplete | None = ..., provider: Incomplete | None = ...) -> None: ...
    def get_access_token(self): ...
    def is_valid(self): ...
    def get_redirect(self, authorization_url, extra_params): ...

class OAuth:
    request: Incomplete
    consumer_key: Incomplete
    secret_key: Incomplete
    request_token_url: Incomplete
    def __init__(self, request, consumer_key, secret_key, request_token_url) -> None: ...
    def query(self, url, method: str = ..., params: Incomplete | None = ..., headers: Incomplete | None = ...): ...
