from _typeshed import Incomplete

class OAuth2Error(Exception): ...

class OAuth2Client:
    request: Incomplete
    access_token_method: Incomplete
    access_token_url: Incomplete
    callback_url: Incomplete
    consumer_key: Incomplete
    consumer_secret: Incomplete
    scope: Incomplete
    state: Incomplete
    headers: Incomplete
    basic_auth: Incomplete
    def __init__(self, request, consumer_key, consumer_secret, access_token_method, access_token_url, callback_url, scope, scope_delimiter: str = ..., headers: Incomplete | None = ..., basic_auth: bool = ...) -> None: ...
    def get_redirect_url(self, authorization_url, extra_params): ...
    def get_access_token(self, code, pkce_code_verifier: Incomplete | None = ...): ...
