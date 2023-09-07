from . import app_settings as app_settings, helpers as helpers
from ..account.views import AjaxCapableProcessFormViewMixin as AjaxCapableProcessFormViewMixin, CloseableSignupMixin as CloseableSignupMixin, RedirectAuthenticatedUserMixin as RedirectAuthenticatedUserMixin
from ..utils import get_form_class as get_form_class
from .adapter import get_adapter as get_adapter
from .forms import DisconnectForm as DisconnectForm, SignupForm as SignupForm
from .models import SocialAccount as SocialAccount, SocialLogin as SocialLogin
from _typeshed import Incomplete
from django.views.generic.base import TemplateView
from django.views.generic.edit import FormView

class SignupView(RedirectAuthenticatedUserMixin, CloseableSignupMixin, AjaxCapableProcessFormViewMixin, FormView):
    form_class = SignupForm
    template_name: Incomplete
    def get_form_class(self): ...
    sociallogin: Incomplete
    def dispatch(self, request, *args, **kwargs): ...
    def is_open(self): ...
    def get_form_kwargs(self): ...
    def form_valid(self, form): ...
    def get_context_data(self, **kwargs): ...
    def get_authenticated_redirect_url(self): ...

signup: Incomplete

class LoginCancelledView(TemplateView):
    template_name: Incomplete

login_cancelled: Incomplete

class LoginErrorView(TemplateView):
    template_name: Incomplete

login_error: Incomplete

class ConnectionsView(AjaxCapableProcessFormViewMixin, FormView):
    template_name: Incomplete
    form_class = DisconnectForm
    success_url: Incomplete
    def get_form_class(self): ...
    def get_form_kwargs(self): ...
    def form_valid(self, form): ...
    def get_ajax_data(self): ...

connections: Incomplete
