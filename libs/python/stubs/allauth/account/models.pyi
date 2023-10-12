from . import app_settings as app_settings, signals as signals
from .adapter import get_adapter as get_adapter
from .managers import EmailAddressManager as EmailAddressManager, EmailConfirmationManager as EmailConfirmationManager
from .utils import user_email as user_email
from _typeshed import Incomplete
from django.db import models

class EmailAddress(models.Model):
    user: Incomplete
    email: Incomplete
    verified: Incomplete
    primary: Incomplete
    objects: Incomplete
    class Meta:
        verbose_name: Incomplete
        verbose_name_plural: Incomplete
        unique_together: Incomplete
    def set_as_primary(self, conditional: bool = ...): ...
    def send_confirmation(self, request: Incomplete | None = ..., signup: bool = ...): ...
    def change(self, request, new_email, confirm: bool = ...) -> None: ...

class EmailConfirmation(models.Model):
    email_address: Incomplete
    created: Incomplete
    sent: Incomplete
    key: Incomplete
    objects: Incomplete
    class Meta:
        verbose_name: Incomplete
        verbose_name_plural: Incomplete
    @classmethod
    def create(cls, email_address): ...
    def key_expired(self): ...
    def confirm(self, request): ...
    def send(self, request: Incomplete | None = ..., signup: bool = ...) -> None: ...

class EmailConfirmationHMAC:
    email_address: Incomplete
    def __init__(self, email_address) -> None: ...
    @property
    def key(self): ...
    @classmethod
    def from_key(cls, key): ...
    def confirm(self, request): ...
    def send(self, request: Incomplete | None = ..., signup: bool = ...) -> None: ...
