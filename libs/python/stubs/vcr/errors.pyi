from _typeshed import Incomplete

class CannotOverwriteExistingCassetteException(Exception):
    cassette: Incomplete
    failed_request: Incomplete
    def __init__(self, *args, **kwargs) -> None: ...

class UnhandledHTTPRequestError(KeyError): ...
