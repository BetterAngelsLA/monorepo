from vcr.errors import CannotOverwriteExistingCassetteException as CannotOverwriteExistingCassetteException
from vcr.request import Request as Request

def vcr_fetch_impl(cassette, real_fetch_impl): ...
