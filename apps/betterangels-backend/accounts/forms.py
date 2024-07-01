from __future__ import annotations

from typing import Any, cast

from django import forms
from django.conf import settings
from django.contrib.auth.forms import UserChangeForm as BaseUserChangeForm
from django.contrib.auth.forms import UserCreationForm as BaseUserCreationForm
from django.contrib.sites.models import Site
from organizations.backends import invitation_backend

from .models import User


class UserCreationForm(BaseUserCreationForm):
    class Meta:
        model = User
        fields = ("email", "username")


class UserChangeForm(BaseUserChangeForm):
    class Meta:
        model = User
        fields = ("email",)


class OrganizationUserForm(forms.ModelForm):
    """
    Form class for editing OrganizationUsers *and* the linked user model.
    """

    email = forms.EmailField()

    class Meta:
        exclude = ("user", "is_admin")
        model = User

    def __init__(self, *args: Any, **kwargs: Any):
        self.request = kwargs.pop("request", None)
        super().__init__(*args, **kwargs)
        if self.instance.pk is not None:
            self.fields["email"].initial = self.instance.user.email

    def save(self, *args: Any, **kwargs: Any) -> User:
        """
        This method saves changes to the linked user model.
        """

        if self.instance.pk is None:
            site = Site.objects.get(pk=settings.SITE_ID)
            self.instance.user = invitation_backend().invite_by_email(
                self.cleaned_data["email"],
                **{
                    "organization": self.cleaned_data["organization"],
                    "domain": site,
                },
            )
            invitation_backend().create_organization_invite(
                self.cleaned_data["organization"], self.request.user, self.instance.user
            )
        self.instance.user.email = self.cleaned_data["email"]
        self.instance.user.save()

        return cast(User, super().save(*args, **kwargs))
