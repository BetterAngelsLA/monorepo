from .app_settings import api_settings as api_settings
from _typeshed import Incomplete
from allauth.account.forms import ResetPasswordForm as DefaultPasswordResetForm

def default_url_generator(request, user, temp_key): ...

class AllAuthPasswordResetForm(DefaultPasswordResetForm):
    users: Incomplete
    def clean_email(self): ...
    def save(self, request, **kwargs): ...
