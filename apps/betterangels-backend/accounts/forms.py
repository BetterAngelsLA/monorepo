from typing import Any, cast

from common.org_types import REGISTRY
from django import forms
from django.contrib.auth.forms import UserChangeForm as BaseUserChangeForm
from organizations.models import Organization

from common.permissions.config import TemplateConfig

from .models import OrganizationProfile, OrgTypeChoices, PermissionGroup, User

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


class OrganizationRoleSelectionForm(forms.Form):
    """Base for the admin forms that choose an organization member's roles."""

    permission_templates = forms.MultipleChoiceField(
        label="Roles",
        widget=forms.CheckboxSelectMultiple,
        help_text="Only the roles this organization's org types allow are listed.",
    )

    def __init__(self, *args: Any, organization: Organization | None = None, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.organization = organization
        names = (
            REGISTRY.invitable_template_names()
            if organization is None
            else REGISTRY.invitable_template_names_for(organization)
        )
        self.role_names = names
        permission_templates = cast(forms.MultipleChoiceField, self.fields["permission_templates"])
        permission_templates.choices = [(name, name) for name in names]

    def clean(self) -> dict[str, Any]:
        """Reject roles the chosen organization cannot hold.

        Checks membership of ``invitable_template_names_for`` rather than calling
        ``get_template_or_raise``, which despite its signature resolves names
        against the whole registry and uses the organization only to word its
        error — so it accepts a role the organization cannot grant.
        """
        cleaned_data = super().clean() or {}
        organization = self.organization or cleaned_data.get("organization")
        names = cleaned_data.get("permission_templates") or []

        if organization is not None and names:
            available = REGISTRY.invitable_template_names_for(organization)
            rejected = [name for name in names if name not in available]
            if rejected:
                self.add_error(
                    "permission_templates",
                    f"{organization.name} cannot grant {', '.join(rejected)}. "
                    f"Available: {', '.join(available) or 'none'}.",
                )

        return cleaned_data

    def selected_templates(self) -> tuple[TemplateConfig, ...]:
        """The chosen roles as configs, in the order the form offered them."""
        chosen = set(self.cleaned_data["permission_templates"])
        return tuple(
            template for name in self.role_names if name in chosen and (template := REGISTRY.template(name)) is not None
        )


class OrganizationMemberInviteForm(OrganizationRoleSelectionForm):
    """Invite a person into an organization with one or more roles.

    Pass *organization* to fix it — the roles offered are then the ones that
    organization can hold.  Pass ``None`` and the form asks which organization,
    offering every invitable role and validating the pair once it knows both.
    """

    email = forms.EmailField()

    def __init__(self, *args: Any, organization: Organization | None = None, **kwargs: Any) -> None:
        super().__init__(*args, organization=organization, **kwargs)

        if organization is None:
            self.fields["organization"] = forms.ModelChoiceField(
                queryset=Organization.objects.order_by("name"),
                help_text="Its org types decide which of the roles below it can grant.",
            )

        self.order_fields(["organization", "email", "permission_templates"])


class OrganizationMemberRoleForm(OrganizationRoleSelectionForm):
    """Set exactly which roles an existing member holds in *organization*.

    Unchecking a role revokes it, so this is one edit of what the person can do
    here rather than an additive grant.
    """

    def __init__(self, *args: Any, organization: Organization, member: User, **kwargs: Any) -> None:
        super().__init__(*args, organization=organization, **kwargs)
        # Clearing every role is a real state — it is what a member starts as
        # before any role is granted — so revoking the last one is allowed here,
        # unlike on the invite form where it would send a pointless invitation.
        self.fields["permission_templates"].required = False
        self.fields["permission_templates"].initial = sorted(
            PermissionGroup.objects.filter(organization=organization, group__user=member).values_list("name", flat=True)
        )
