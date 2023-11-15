from _typeshed import Incomplete
from allauth.account.views import ConfirmEmailView
from dj_rest_auth.app_settings import api_settings as api_settings
from dj_rest_auth.models import TokenModel as TokenModel
from dj_rest_auth.registration.serializers import ResendEmailVerificationSerializer as ResendEmailVerificationSerializer, SocialAccountSerializer as SocialAccountSerializer, SocialConnectSerializer as SocialConnectSerializer, SocialLoginSerializer as SocialLoginSerializer, VerifyEmailSerializer as VerifyEmailSerializer
from dj_rest_auth.utils import jwt_encode as jwt_encode
from dj_rest_auth.views import LoginView as LoginView
from rest_framework.generics import CreateAPIView, GenericAPIView, ListAPIView
from rest_framework.views import APIView

sensitive_post_parameters_m: Incomplete

class RegisterView(CreateAPIView):
    serializer_class: Incomplete
    permission_classes: Incomplete
    token_model = TokenModel
    throttle_scope: str
    def dispatch(self, *args, **kwargs): ...
    def get_response_data(self, user): ...
    def create(self, request, *args, **kwargs): ...
    def perform_create(self, serializer): ...

class VerifyEmailView(APIView, ConfirmEmailView):
    permission_classes: Incomplete
    allowed_methods: Incomplete
    def get_serializer(self, *args, **kwargs): ...
    def get(self, *args, **kwargs) -> None: ...
    def post(self, request, *args, **kwargs): ...

class ResendEmailVerificationView(CreateAPIView):
    permission_classes: Incomplete
    serializer_class = ResendEmailVerificationSerializer
    queryset: Incomplete
    def create(self, request, *args, **kwargs): ...

class SocialLoginView(LoginView):
    serializer_class = SocialLoginSerializer
    def process_login(self) -> None: ...

class SocialConnectView(LoginView):
    serializer_class = SocialConnectSerializer
    permission_classes: Incomplete
    def process_login(self) -> None: ...

class SocialAccountListView(ListAPIView):
    serializer_class = SocialAccountSerializer
    permission_classes: Incomplete
    def get_queryset(self): ...

class SocialAccountDisconnectView(GenericAPIView):
    serializer_class = SocialConnectSerializer
    permission_classes: Incomplete
    def get_queryset(self): ...
    def post(self, request, *args, **kwargs): ...
