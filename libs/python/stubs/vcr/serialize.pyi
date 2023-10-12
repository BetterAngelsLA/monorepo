from vcr.request import Request as Request
from vcr.serializers import compat as compat

CASSETTE_FORMAT_VERSION: int

def deserialize(cassette_string, serializer): ...
def serialize(cassette_dict, serializer): ...
