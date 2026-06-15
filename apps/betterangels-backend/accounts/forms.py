import json
from typing import Any, cast

from accounts.services import member_add
from common.org_types import REGISTRY
from common.permissions.config import TemplateConfig
from django import forms
from django.conf import settings
from django.contrib.auth.forms import UserChangeForm as BaseUserChangeForm
from django.contrib.sites.models import Site
from django.core.exceptions import ValidationError
from organizations.backends import invitation_backend
from organizations.models import Organization, OrganizationUser

from .models import PermissionGroup, User
from .role_manager import OrgRoleManager

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
    """Form class for editing OrganizationUsers *and* the linked user model.

    When creating a new member (pk is None), this form:

    1. Creates or retrieves a user via ``member_add()``, linking them
       to the organization with the selected permission templates.
    2. Sends the appropriate invitation email via the template's
       ``invite_html``/``invite_txt`` paths.
    3. Creates an ``OrganizationInvitation`` record.

    When editing an existing member, the selected templates are diffed
    against the current set — roles are added or removed as needed.
    """

    email = forms.EmailField()
    permission_templates = forms.MultipleChoiceField(
        required=False,
        widget=forms.CheckboxSelectMultiple,
        help_text="Select one or more invitable roles. Deselecting a role removes it.",
    )

    class Meta:
        exclude = ("user", "is_admin")

    class Media:
        js = ("accounts/js/organization_user_form.js",)

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        self.request = kwargs.pop("request", None)
        super().__init__(*args, **kwargs)

        # Seed choices with the full set — JavaScript filters them
        # client-side based on the selected organization.
        self.fields["permission_templates"].choices = [  # type: ignore[attr-defined]
            (name, name) for name in REGISTRY.invitable_template_names()
        ]

        # Provide org→template mapping for client-side filtering.
        org_templates: dict[str, list[str]] = {}
        for org in Organization.objects.prefetch_related("profile").all():
            org_templates[str(org.pk)] = REGISTRY.invitable_template_names_for(org)
        self.fields["permission_templates"].widget.attrs["data-org-templates"] = json.dumps(org_templates)

        if self.instance.pk is not None:
            self.fields["email"].initial = self.instance.user.email
            # Pre-select templates the user already holds.
            self.fields["permission_templates"].initial = list(self._get_current_template_names())

    def clean_permission_templates(self) -> list[str]:
        """Validate that the selected templates are valid for the org."""
        template_names: list[str] = self.cleaned_data["permission_templates"]
        organization = self.cleaned_data.get("organization")
        if organization is None:
            raise ValidationError("Organization is required.")

        valid = set(REGISTRY.invitable_template_names_for(organization))
        for name in template_names:
            if name not in valid:
                raise ValidationError(
                    f"'{name}' is not an invitable template for {organization.name}. "
                    f"Available: {', '.join(sorted(valid))}"
                )
        return template_names

    # ── Helpers ───────────────────────────────────────────────────────

    def _get_current_template_names(self) -> list[str]:
        """Return invitable template names the user currently holds."""
        return list(
            PermissionGroup.objects.filter(
                organization=self.instance.organization,
                group__user=self.instance.user,
                template__name__in=REGISTRY.invitable_template_names(),
            ).values_list("template__name", flat=True)
        )

    def _get_current_invitable_templates(self) -> tuple[TemplateConfig, ...]:
        """Return the TemplateConfigs the user currently holds (invitable only)."""
        selected: list[TemplateConfig] = []
        for name in self._get_current_template_names():
            template = REGISTRY.template(name)
            if template is not None:
                selected.append(template)
        return tuple(selected)

    def _get_selected_templates(self) -> tuple[TemplateConfig, ...]:
        """Resolve selected template names to TemplateConfig objects."""
        template_names: list[str] = self.cleaned_data["permission_templates"]
        selected: list[TemplateConfig] = []
        for name in template_names:
            template = REGISTRY.template(name)
            if template is not None:
                selected.append(template)
        return tuple(selected)

    # ── Save ──────────────────────────────────────────────────────────

    def save(self, *args: Any, **kwargs: Any) -> User:
        """Create or update the linked user model and assign roles."""
        organization = self.cleaned_data["organization"]

        if self.instance.pk is None:
            # ── New member ────────────────────────────────────────────
            templates = self._get_selected_templates()
            if not templates:
                raise ValidationError("At least one permission template must be selected.")

            user = member_add(
                email=self.cleaned_data["email"],
                first_name="",
                last_name="",
                middle_name=None,
                organization=organization,
                permission_templates=templates,
            )

            # First selected template drives the invite email.
            role_template = templates[0]

            site = Site.objects.get(pk=settings.SITE_ID)
            invitation_backend().create_organization_invite(
                organization=organization,
                invited_by_user=self.request.user,
                invitee_user=user,
            )
            invitation_backend().send_invitation(
                user=user,
                sender=self.request.user,
                organization=organization,
                domain=site,
                role_template=role_template,
            )

            self.instance.user = user

            # member_add already created the OrganizationUser row via
            # organization.add_user().  Point the form instance at it so
            # super().save() sees an existing record (update, not insert).
            org_user = OrganizationUser.objects.get(organization=organization, user=user)
            self.instance.pk = org_user.pk
            self.instance.user.email = self.cleaned_data["email"]
            self.instance.user.save()
            return cast(User, super().save(*args, **kwargs))

        # ── Update existing member ────────────────────────────────────
        role_manager = OrgRoleManager(organization)
        current = self._get_current_invitable_templates()
        selected = self._get_selected_templates()

        # Remove deselected roles.
        for t in current:
            if t not in selected:
                role_manager.remove_roles(self.instance.user, t)

        # Add newly selected roles.
        for t in selected:
            if t not in current:
                role_manager.add_roles(self.instance.user, t)

        self.instance.user.email = self.cleaned_data["email"]
        self.instance.user.save()
        return cast(User, super().save(*args, **kwargs))
