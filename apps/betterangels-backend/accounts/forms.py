from __future__ import annotations

from typing import Any, cast

from django import forms
from django.conf import settings
from django.contrib.auth.forms import UserChangeForm as BaseUserChangeForm
from django.contrib.sites.models import Site
from organizations.backends import invitation_backend

from .models import User

# isort: off
# We ignore this type check because there's an issue with django-stubs not recognizing
# AdminUserCreationForm in Django 5.1. Upgrading django-stubs to the latest version
# introduces additional type-related bugs are referenced in the below Github issues.
# As a workaround, we use `# type: ignore[attr-defined]` to suppress the type checker error.
# We also prevent isort from moving this import line to ensure the comment stays effective.
# References:
# - https://github.com/typeddjango/django-stubs/issues/1354
# - https://github.com/typeddjango/django-stubs/issues/2341
from django.contrib.auth.forms import (  # type: ignore[attr-defined]
    AdminUserCreationForm as BaseAdminUserCreationForm,
)

# isort: on


class UserCreationForm(BaseAdminUserCreationForm):
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
