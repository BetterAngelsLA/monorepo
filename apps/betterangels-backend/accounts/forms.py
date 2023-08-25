from django.contrib.auth.forms import UserChangeForm, UserCreationForm

from .models import BAUser


class BAUserCreationForm(UserCreationForm):
    class Meta:  # type: ignore
        model = BAUser
        fields = ("username", "email")


class BAUserChangeForm(UserChangeForm):
    class Meta:  # type: ignore
        model = BAUser
        fields = ("username", "email")
