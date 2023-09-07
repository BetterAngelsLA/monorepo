from .provider import TelegramProvider as TelegramProvider
from allauth.socialaccount import providers as providers
from allauth.socialaccount.helpers import complete_social_login as complete_social_login, render_authentication_error as render_authentication_error

def telegram_login(request): ...
