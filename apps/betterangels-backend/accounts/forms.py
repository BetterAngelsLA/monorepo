from typing import Any, cast

from common.org_types import REGISTRY
from django import forms
from django.contrib.auth.forms import UserChangeForm as BaseUserChangeForm
from organizations.models import Organization

from .models import OrganizationProfile, OrgTypeChoices, User

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


class OrganizationProfileForm(forms.ModelForm):
    """Admin form for an organization's profile.

    ``org_types`` is declared explicitly because the default form field for an
    ``ArrayField`` is a comma-separated text input.
    """

    org_types = forms.MultipleChoiceField(
        choices=OrgTypeChoices.choices,
        widget=forms.CheckboxSelectMultiple,
        required=True,
        label="Org types",
        help_text="Determines which roles this organization's members can hold.",
    )

    class Meta:
        model = OrganizationProfile
        fields = ("org_types",)

    def clean_org_types(self) -> list[OrgTypeChoices]:
        """Return enum members, matching what the services write."""
        return [OrgTypeChoices(value) for value in self.cleaned_data["org_types"]]


class OrganizationMemberInviteForm(forms.Form):
    """Invite a person into *organization* with a single role."""

    email = forms.EmailField()
    permission_template = forms.ChoiceField(label="Role")

    def __init__(self, *args: Any, organization: Organization, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.organization = organization
        permission_template = cast(forms.ChoiceField, self.fields["permission_template"])
        permission_template.choices = [(name, name) for name in REGISTRY.invitable_template_names_for(organization)]

    def clean_permission_template(self) -> str:
        name: str = self.cleaned_data["permission_template"]
        REGISTRY.get_template_or_raise(name, self.organization)
        return name
