from .app_settings import api_settings as api_settings
from .models import get_token_model as get_token_model
from .utils import jwt_encode as jwt_encode
from _typeshed import Incomplete
from rest_framework.generics import GenericAPIView, RetrieveUpdateAPIView
from rest_framework.views import APIView

sensitive_post_parameters_m: Incomplete

class LoginView(GenericAPIView):
    permission_classes: Incomplete
    serializer_class: Incomplete
    throttle_scope: str
    user: Incomplete
    access_token: Incomplete
    token: Incomplete
    def dispatch(self, *args, **kwargs): ...
    def process_login(self) -> None: ...
    def get_response_serializer(self): ...
    def login(self) -> None: ...
    def get_response(self): ...
    request: Incomplete
    serializer: Incomplete
    def post(self, request, *args, **kwargs): ...

class LogoutView(APIView):
    permission_classes: Incomplete
    throttle_scope: str
    def get(self, request, *args, **kwargs): ...
    def post(self, request, *args, **kwargs): ...
    def logout(self, request): ...

class UserDetailsView(RetrieveUpdateAPIView):
    serializer_class: Incomplete
    permission_classes: Incomplete
    def get_object(self): ...
    def get_queryset(self): ...

class PasswordResetView(GenericAPIView):
    serializer_class: Incomplete
    permission_classes: Incomplete
    throttle_scope: str
    def post(self, request, *args, **kwargs): ...

class PasswordResetConfirmView(GenericAPIView):
    serializer_class: Incomplete
    permission_classes: Incomplete
    throttle_scope: str
    def dispatch(self, *args, **kwargs): ...
    def post(self, request, *args, **kwargs): ...

class PasswordChangeView(GenericAPIView):
    serializer_class: Incomplete
    permission_classes: Incomplete
    throttle_scope: str
    def dispatch(self, *args, **kwargs): ...
    def post(self, request, *args, **kwargs): ...
