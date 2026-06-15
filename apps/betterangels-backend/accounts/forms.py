from typing import Any, cast

from common.org_types import REGISTRY
from django import forms
from django.conf import settings
from django.contrib.auth.forms import UserChangeForm as BaseUserChangeForm
from django.contrib.sites.models import Site
from django.core.exceptions import ValidationError
from organizations.backends import invitation_backend
from organizations.models import OrganizationUser

from .models import User
from .services import member_add

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

    When creating a new member, automatically assigns all invitable
    permission templates for the selected organization.  The invite email
    uses the first template's ``invite_html``/``invite_txt`` paths.

    When editing, the organization field serves as a read-only identifier;
    role changes should be made via the GraphQL API or the User admin.
    """

    email = forms.EmailField()

    class Meta:
        exclude = ("user", "is_admin")

    def __init__(self, *args: Any, **kwargs: Any):
        self.request = kwargs.pop("request", None)
        super().__init__(*args, **kwargs)
        if self.instance.pk is not None:
            self.fields["email"].initial = self.instance.user.email

    def save(self, *args: Any, **kwargs: Any) -> User:
        """Create or update the linked user model."""
        organization = self.cleaned_data["organization"]

        if self.instance.pk is None:
            # ── New member ────────────────────────────────────────────
            templates = tuple(REGISTRY.invitable_templates_for(organization))
            if not templates:
                raise ValidationError(
                    f"Organization '{organization.name}' has no invitable "
                    f"permission templates.  Ensure the org has a profile "
                    f"with org_types set."
                )

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
