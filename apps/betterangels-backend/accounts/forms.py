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
    """Invite a person into an organization with a single role.

    Pass *organization* to fix it — the roles offered are then the ones that
    organization can hold.  Pass ``None`` and the form asks which organization,
    offering every invitable role and validating the pair once it knows both.
    """

    email = forms.EmailField()
    permission_template = forms.ChoiceField(label="Role")

    def __init__(self, *args: Any, organization: Organization | None = None, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.organization = organization

        if organization is None:
            self.fields["organization"] = forms.ModelChoiceField(
                queryset=Organization.objects.order_by("name"),
                help_text="Its org types decide which of the roles below it can grant.",
            )
            self.order_fields(["organization", "email", "permission_template"])
            names = REGISTRY.invitable_template_names()
        else:
            names = REGISTRY.invitable_template_names_for(organization)

        permission_template = cast(forms.ChoiceField, self.fields["permission_template"])
        permission_template.choices = [(name, name) for name in names]

    def clean(self) -> dict[str, Any]:
        """Reject a role the chosen organization cannot hold.

        Both fields are needed to check the pair, so this cannot be a
        ``clean_permission_template``: when the organization is picked on the
        form, it is not resolved until here.

        Checks membership of ``invitable_template_names_for`` rather than calling
        ``get_template_or_raise``, which despite its signature resolves the name
        against the whole registry and uses the organization only to word its
        error — so it accepts a role the organization cannot grant.
        """
        cleaned_data = super().clean() or {}
        organization = self.organization or cleaned_data.get("organization")
        name = cleaned_data.get("permission_template")

        if organization is not None and name:
            available = REGISTRY.invitable_template_names_for(organization)
            if name not in available:
                self.add_error(
                    "permission_template",
                    f"{organization.name} cannot grant {name}. Available: {', '.join(available) or 'none'}.",
                )

        return cleaned_data
