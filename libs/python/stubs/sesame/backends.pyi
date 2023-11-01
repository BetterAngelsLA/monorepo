from _typeshed import Incomplete
from django.contrib.auth import backends as auth_backends

class SesameBackendMixin:
    def authenticate(self, request, sesame, scope: str = ..., max_age: Incomplete | None = ...): ...

class ModelBackend(SesameBackendMixin, auth_backends.ModelBackend):
    def get_user(self, user_id): ...
