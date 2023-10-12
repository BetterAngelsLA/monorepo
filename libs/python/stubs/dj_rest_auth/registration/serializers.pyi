from _typeshed import Incomplete
from allauth.socialaccount.models import SocialAccount
from rest_framework import serializers

class SocialAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialAccount
        fields: Incomplete

class SocialLoginSerializer(serializers.Serializer):
    access_token: Incomplete
    code: Incomplete
    id_token: Incomplete
    def get_social_login(self, adapter, app, token, response): ...
    callback_url: Incomplete
    def set_callback_url(self, view, adapter_class) -> None: ...
    client_class: Incomplete
    def validate(self, attrs): ...
    def post_signup(self, login, attrs) -> None: ...

class SocialConnectMixin:
    def get_social_login(self, *args, **kwargs): ...

class SocialConnectSerializer(SocialConnectMixin, SocialLoginSerializer): ...

class RegisterSerializer(serializers.Serializer):
    username: Incomplete
    email: Incomplete
    password1: Incomplete
    password2: Incomplete
    def validate_username(self, username): ...
    def validate_email(self, email): ...
    def validate_password1(self, password): ...
    def validate(self, data): ...
    def custom_signup(self, request, user) -> None: ...
    def get_cleaned_data(self): ...
    cleaned_data: Incomplete
    def save(self, request): ...

class VerifyEmailSerializer(serializers.Serializer):
    key: Incomplete

class ResendEmailVerificationSerializer(serializers.Serializer):
    email: Incomplete
