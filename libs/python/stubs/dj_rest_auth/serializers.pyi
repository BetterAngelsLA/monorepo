from .app_settings import api_settings as api_settings
from .forms import AllAuthPasswordResetForm as AllAuthPasswordResetForm
from .models import TokenModel as TokenModel
from _typeshed import Incomplete
from django.contrib.auth.forms import SetPasswordForm
from rest_framework import serializers

UserModel: Incomplete

class LoginSerializer(serializers.Serializer):
    username: Incomplete
    email: Incomplete
    password: Incomplete
    def authenticate(self, **kwargs): ...
    def get_auth_user_using_allauth(self, username, email, password): ...
    def get_auth_user_using_orm(self, username, email, password): ...
    def get_auth_user(self, username, email, password): ...
    @staticmethod
    def validate_auth_user_status(user) -> None: ...
    @staticmethod
    def validate_email_verification_status(user, email: Incomplete | None = ...) -> None: ...
    def validate(self, attrs): ...

class TokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = TokenModel
        fields: Incomplete

class UserDetailsSerializer(serializers.ModelSerializer):
    @staticmethod
    def validate_username(username): ...
    class Meta:
        extra_fields: Incomplete
        model = UserModel
        fields: Incomplete
        read_only_fields: Incomplete

class JWTSerializer(serializers.Serializer):
    access: Incomplete
    refresh: Incomplete
    user: Incomplete
    def get_user(self, obj): ...

class JWTSerializerWithExpiration(JWTSerializer):
    access_expiration: Incomplete
    refresh_expiration: Incomplete

class PasswordResetSerializer(serializers.Serializer):
    email: Incomplete
    reset_form: Incomplete
    @property
    def password_reset_form_class(self): ...
    def get_email_options(self): ...
    def validate_email(self, value): ...
    def save(self) -> None: ...

class PasswordResetConfirmSerializer(serializers.Serializer):
    new_password1: Incomplete
    new_password2: Incomplete
    uid: Incomplete
    token: Incomplete
    set_password_form_class = SetPasswordForm
    user: Incomplete
    set_password_form: Incomplete
    def custom_validation(self, attrs) -> None: ...
    def validate(self, attrs): ...
    def save(self): ...

class PasswordChangeSerializer(serializers.Serializer):
    old_password: Incomplete
    new_password1: Incomplete
    new_password2: Incomplete
    set_password_form_class = SetPasswordForm
    set_password_form: Incomplete
    old_password_field_enabled: Incomplete
    logout_on_password_change: Incomplete
    request: Incomplete
    user: Incomplete
    def __init__(self, *args, **kwargs) -> None: ...
    def validate_old_password(self, value): ...
    def custom_validation(self, attrs) -> None: ...
    def validate(self, attrs): ...
    def save(self) -> None: ...
