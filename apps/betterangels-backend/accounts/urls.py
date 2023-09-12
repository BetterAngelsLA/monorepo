from django.urls import path

from .views import GoogleLogin, SignUpView

urlpatterns = [
    path("signup/", SignUpView.as_view(), name="signup"),
    path("rest-auth/google/", GoogleLogin.as_view(), name="google_login"),
]
