from ..base import AuthError as AuthError
from .provider import DraugiemProvider as DraugiemProvider
from allauth.socialaccount import providers as providers
from allauth.socialaccount.helpers import complete_social_login as complete_social_login, render_authentication_error as render_authentication_error
from allauth.socialaccount.models import SocialLogin as SocialLogin, SocialToken as SocialToken

class DraugiemApiError(Exception): ...

ACCESS_TOKEN_URL: str
AUTHORIZE_URL: str

def login(request): ...
def callback(request): ...
def draugiem_complete_login(request, app, code): ...
