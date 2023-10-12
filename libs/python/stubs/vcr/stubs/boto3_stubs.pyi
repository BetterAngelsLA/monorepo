from ..stubs import VCRHTTPConnection as VCRHTTPConnection, VCRHTTPSConnection as VCRHTTPSConnection
from _typeshed import Incomplete
from botocore.awsrequest import AWSHTTPConnection as HTTPConnection, AWSHTTPSConnection as VerifiedHTTPSConnection

class VCRRequestsHTTPConnection(VCRHTTPConnection, HTTPConnection): ...

class VCRRequestsHTTPSConnection(VCRHTTPSConnection, VerifiedHTTPSConnection):
    real_connection: Incomplete
    def __init__(self, *args, **kwargs) -> None: ...
