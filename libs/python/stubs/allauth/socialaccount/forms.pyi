from . import app_settings as app_settings, signals as signals
from .adapter import get_adapter as get_adapter
from .models import SocialAccount as SocialAccount
from _typeshed import Incomplete
from allauth.account.forms import BaseSignupForm as BaseSignupForm
from django import forms

class SignupForm(BaseSignupForm):
    sociallogin: Incomplete
    def __init__(self, *args, **kwargs) -> None: ...
    def save(self, request): ...
    def validate_unique_email(self, value): ...

class DisconnectForm(forms.Form):
    account: Incomplete
    request: Incomplete
    accounts: Incomplete
    def __init__(self, *args, **kwargs) -> None: ...
    def clean(self): ...
    def save(self) -> None: ...
