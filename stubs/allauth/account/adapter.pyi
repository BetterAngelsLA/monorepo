from . import app_settings as app_settings
from _typeshed import Incomplete
from allauth import ratelimit as ratelimit
from allauth.account import signals as signals
from allauth.account.app_settings import EmailVerificationMethod as EmailVerificationMethod
from allauth.utils import build_absolute_uri as build_absolute_uri, email_address_exists as email_address_exists, generate_unique_username as generate_unique_username, get_user_model as get_user_model, import_attribute as import_attribute

class DefaultAccountAdapter:
    error_messages: Incomplete
    request: Incomplete
    def __init__(self, request: Incomplete | None = ...) -> None: ...
    def stash_verified_email(self, request, email) -> None: ...
    def unstash_verified_email(self, request): ...
    def stash_user(self, request, user) -> None: ...
    def unstash_user(self, request): ...
    def is_email_verified(self, request, email): ...
    def format_email_subject(self, subject): ...
    def get_from_email(self): ...
    def render_mail(self, template_prefix, email, context, headers: Incomplete | None = ...): ...
    def send_mail(self, template_prefix, email, context) -> None: ...
    def get_signup_redirect_url(self, request): ...
    def get_login_redirect_url(self, request): ...
    def get_logout_redirect_url(self, request): ...
    def get_email_confirmation_redirect_url(self, request): ...
    def is_open_for_signup(self, request): ...
    def new_user(self, request): ...
    def populate_username(self, request, user) -> None: ...
    def generate_unique_username(self, txts, regex: Incomplete | None = ...): ...
    def save_user(self, request, user, form, commit: bool = ...): ...
    def clean_username(self, username, shallow: bool = ...): ...
    def clean_email(self, email): ...
    def clean_password(self, password, user: Incomplete | None = ...): ...
    def validate_unique_email(self, email): ...
    def add_message(self, request, level, message_template, message_context: Incomplete | None = ..., extra_tags: str = ...) -> None: ...
    def ajax_response(self, request, response, redirect_to: Incomplete | None = ..., form: Incomplete | None = ..., data: Incomplete | None = ...): ...
    def ajax_response_form(self, form): ...
    def pre_login(self, request, user, *, email_verification, signal_kwargs, email, signup, redirect_url): ...
    def post_login(self, request, user, *, email_verification, signal_kwargs, email, signup, redirect_url): ...
    def login(self, request, user) -> None: ...
    def logout(self, request) -> None: ...
    def confirm_email(self, request, email_address) -> None: ...
    def set_password(self, user, password) -> None: ...
    def get_user_search_fields(self): ...
    def is_safe_url(self, url): ...
    def get_email_confirmation_url(self, request, emailconfirmation): ...
    def should_send_confirmation_mail(self, request, email_address): ...
    def send_confirmation_mail(self, request, emailconfirmation, signup) -> None: ...
    def respond_user_inactive(self, request, user): ...
    def respond_email_verification_sent(self, request, user): ...
    def pre_authenticate(self, request, **credentials) -> None: ...
    def authenticate(self, request, **credentials): ...
    def authentication_failed(self, request, **credentials) -> None: ...
    def is_ajax(self, request): ...
    def get_client_ip(self, request): ...
    def generate_emailconfirmation_key(self, email): ...

def get_adapter(request: Incomplete | None = ...): ...
