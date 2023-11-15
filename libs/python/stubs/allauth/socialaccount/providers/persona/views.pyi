from .provider import PersonaProvider as PersonaProvider
from allauth.socialaccount import app_settings as app_settings, providers as providers
from allauth.socialaccount.helpers import complete_social_login as complete_social_login, render_authentication_error as render_authentication_error
from allauth.socialaccount.models import SocialLogin as SocialLogin

def persona_login(request): ...
