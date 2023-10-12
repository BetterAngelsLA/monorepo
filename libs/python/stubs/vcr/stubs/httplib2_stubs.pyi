from ..stubs import VCRHTTPConnection as VCRHTTPConnection, VCRHTTPSConnection as VCRHTTPSConnection
from _typeshed import Incomplete
from httplib2 import HTTPConnectionWithTimeout, HTTPSConnectionWithTimeout

class VCRHTTPConnectionWithTimeout(VCRHTTPConnection, HTTPConnectionWithTimeout):
    proxy_info: Incomplete
    sock: Incomplete
    def __init__(self, *args, **kwargs) -> None: ...

class VCRHTTPSConnectionWithTimeout(VCRHTTPSConnection, HTTPSConnectionWithTimeout):
    proxy_info: Incomplete
    ca_certs: Incomplete
    disable_ssl_certificate_validation: Incomplete
    sock: Incomplete
    def __init__(self, *args, **kwargs) -> None: ...
