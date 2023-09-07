from _typeshed import Incomplete
from dj_rest_auth.registration.serializers import SocialConnectMixin as SocialConnectMixin
from rest_framework import serializers

class TwitterLoginSerializer(serializers.Serializer):
    access_token: Incomplete
    token_secret: Incomplete
    def get_social_login(self, adapter, app, token, response): ...
    def validate(self, attrs): ...

class TwitterConnectSerializer(SocialConnectMixin, TwitterLoginSerializer): ...
