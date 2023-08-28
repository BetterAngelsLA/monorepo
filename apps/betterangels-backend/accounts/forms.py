from django.contrib.auth.forms import UserChangeForm, UserCreationForm

from .models import BetterAngelsUser


class BetterAngelsUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = BetterAngelsUser
        fields = ("username", "email")


class BetterAngelsUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = BetterAngelsUser
        fields = ("username", "email")
