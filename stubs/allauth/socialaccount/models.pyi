from . import app_settings as app_settings, providers as providers
from ..utils import get_request_param as get_request_param
from .adapter import get_adapter as get_adapter
from .fields import JSONField as JSONField
from _typeshed import Incomplete
from allauth.account.models import EmailAddress as EmailAddress
from allauth.account.utils import get_next_redirect_url as get_next_redirect_url, setup_user_email as setup_user_email
from allauth.utils import get_user_model as get_user_model
from django.db import models

class SocialAppManager(models.Manager):
    def get_current(self, provider, request: Incomplete | None = ...): ...

class SocialApp(models.Model):
    objects: Incomplete
    provider: Incomplete
    name: Incomplete
    client_id: Incomplete
    secret: Incomplete
    key: Incomplete
    sites: Incomplete
    certificate_key: Incomplete
    class Meta:
        verbose_name: Incomplete
        verbose_name_plural: Incomplete

class SocialAccount(models.Model):
    user: Incomplete
    provider: Incomplete
    uid: Incomplete
    last_login: Incomplete
    date_joined: Incomplete
    extra_data: Incomplete
    class Meta:
        unique_together: Incomplete
        verbose_name: Incomplete
        verbose_name_plural: Incomplete
    def authenticate(self): ...
    def get_profile_url(self): ...
    def get_avatar_url(self): ...
    def get_provider(self): ...
    def get_provider_account(self): ...

class SocialToken(models.Model):
    app: Incomplete
    account: Incomplete
    token: Incomplete
    token_secret: Incomplete
    expires_at: Incomplete
    class Meta:
        unique_together: Incomplete
        verbose_name: Incomplete
        verbose_name_plural: Incomplete

class SocialLogin:
    token: Incomplete
    user: Incomplete
    account: Incomplete
    email_addresses: Incomplete
    state: Incomplete
    def __init__(self, user: Incomplete | None = ..., account: Incomplete | None = ..., token: Incomplete | None = ..., email_addresses=...) -> None: ...
    def connect(self, request, user) -> None: ...
    def serialize(self): ...
    @classmethod
    def deserialize(cls, data): ...
    def save(self, request, connect: bool = ...) -> None: ...
    @property
    def is_existing(self): ...
    def lookup(self) -> None: ...
    def get_redirect_url(self, request): ...
    @classmethod
    def state_from_request(cls, request): ...
    @classmethod
    def stash_state(cls, request): ...
    @classmethod
    def unstash_state(cls, request): ...
    @classmethod
    def verify_and_unstash_state(cls, request, verifier): ...
