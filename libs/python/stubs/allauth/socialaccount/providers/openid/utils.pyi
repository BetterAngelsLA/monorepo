from .models import OpenIDNonce as OpenIDNonce, OpenIDStore as OpenIDStore
from _typeshed import Incomplete
from allauth.utils import valid_email_or_none as valid_email_or_none
from collections import UserDict
from openid.store.interface import OpenIDStore as OIDStore

class JSONSafeSession(UserDict):
    data: Incomplete
    def __init__(self, session) -> None: ...
    def __setitem__(self, key, value): ...
    def __getitem__(self, key): ...

class OldAXAttribute:
    PERSON_NAME: str
    PERSON_FIRST_NAME: str
    PERSON_LAST_NAME: str

class AXAttribute:
    CONTACT_EMAIL: str
    PERSON_NAME: str
    PERSON_FIRST_NAME: str
    PERSON_LAST_NAME: str

AXAttributes: Incomplete

class SRegField:
    EMAIL: str
    NAME: str

SRegFields: Incomplete

class DBOpenIDStore(OIDStore):
    max_nonce_age: Incomplete
    def storeAssociation(self, server_url, assoc: Incomplete | None = ...) -> None: ...
    def getAssociation(self, server_url, handle: Incomplete | None = ...): ...
    def removeAssociation(self, server_url, handle) -> None: ...
    def useNonce(self, server_url, timestamp, salt): ...

def get_email_from_response(response): ...
def get_value_from_response(response, sreg_names: Incomplete | None = ..., ax_names: Incomplete | None = ...): ...
