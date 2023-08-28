from django.contrib.auth.forms import UserChangeForm, UserCreationForm

from .models import BAUser


class BAUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = BAUser
        fields = ("username", "email")


class BAUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = BAUser
        fields = ("username", "email")
