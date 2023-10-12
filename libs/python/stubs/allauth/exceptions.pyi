from _typeshed import Incomplete

class ImmediateHttpResponse(Exception):
    response: Incomplete
    def __init__(self, response) -> None: ...
