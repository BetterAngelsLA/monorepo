from typing import Any

from django import forms
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import UserChangeForm as BaseUserChangeForm
from django.contrib.auth.forms import UserCreationForm as BaseUserCreationForm
from django.contrib.sites.models import Site
from organizations.backends import invitation_backend

from .models import User


class UserCreationForm(BaseUserCreationForm[User]):
    class Meta(BaseUserCreationForm.Meta):
        model = get_user_model()
        fields = ("email", "username")


class UserChangeForm(BaseUserChangeForm[User]):
    class Meta(BaseUserChangeForm.Meta):
        model = get_user_model()
        fields = ("email",)


class OrganizationUserForm(forms.ModelForm):  # type:ignore
    """
    Form class for editing OrganizationUsers *and* the linked user model.
    """

    email = forms.EmailField()

    class Meta:
        exclude = ("user", "is_admin")
        model = User

    def __init__(self, *args: Any, **kwargs: Any):
        self.request = kwargs.pop("request", None)
        super(OrganizationUserForm, self).__init__(*args, **kwargs)
        if self.instance.pk is not None:
            self.fields["email"].initial = self.instance.user.email

    def save(self, *args: Any, **kwargs: Any):  # type:ignore
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
                }
            )
            invitation_backend().create_organization_invite(
                self.cleaned_data["organization"], self.request.user, self.instance.user
            )
        self.instance.user.email = self.cleaned_data["email"]
        self.instance.user.save()

        return super(OrganizationUserForm, self).save(*args, **kwargs)
