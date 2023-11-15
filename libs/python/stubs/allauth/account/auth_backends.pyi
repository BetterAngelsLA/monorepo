from . import app_settings as app_settings
from ..utils import get_user_model as get_user_model
from .app_settings import AuthenticationMethod as AuthenticationMethod
from .utils import filter_users_by_email as filter_users_by_email, filter_users_by_username as filter_users_by_username
from django.contrib.auth.backends import ModelBackend

class AuthenticationBackend(ModelBackend):
    def authenticate(self, request, **credentials): ...
    @classmethod
    def unstash_authenticated_user(cls): ...
