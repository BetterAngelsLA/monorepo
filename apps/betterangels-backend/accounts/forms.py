from typing import Any, cast

from common.org_types import REGISTRY
from django import forms
from django.contrib.auth.forms import UserChangeForm as BaseUserChangeForm
from django.core.exceptions import ValidationError
from organizations.models import Organization

from common.permissions.config import TemplateConfig

from .models import Grant, OrganizationProfile, OrgTypeChoices, PermissionGroup, Role, User

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


class PermissionGroupInlineForm(forms.ModelForm):
    """Admin inline form for an organization's permission groups.

    ``template`` is fixed once the row exists.  Repointing it leaves the row
    holding a group still named after the old role, so reconciliation's
    ``get_or_create`` for that role tries to create a second ``auth.Group`` with
    the same name and hits ``auth_group_name_key`` — the admin's transaction rolls
    back, so nothing is lost, but the save 500s.  ``main`` refused it outright.
    ``disabled`` rather than ``readonly`` so submitted data is ignored entirely.
    """

    class Meta:
        model = PermissionGroup
        fields = ("template", "label")

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        if self.instance.pk:
            self.fields["template"].disabled = True


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

        Checks the whole selection against ``invitable_template_names_for`` rather
        than calling ``get_template_or_raise`` per name, so every rejected role is
        named in one error instead of only the first.
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


class OrganizationOwnerTransferForm(forms.Form):
    """Choose which member of *organization* becomes its owner.

    Only members are offered, because ``organization_transfer_ownership`` refuses
    anyone else — the choices and the rule agree rather than the form promising
    something the service rejects.
    """

    new_owner = forms.ModelChoiceField(
        queryset=User.objects.none(),
        label="New owner",
        help_text="The current owner keeps their membership and roles; they simply stop owning.",
    )

    def __init__(self, *args: Any, organization: Organization, current_owner: User | None, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        members = User.objects.filter(organizations_organization=organization).order_by("email")
        if current_owner is not None:
            members = members.exclude(pk=current_owner.pk)
        new_owner = cast(forms.ModelChoiceField, self.fields["new_owner"])
        new_owner.queryset = members


class OrganizationMemberRoleForm(OrganizationRoleSelectionForm):
    """Set which of *organization*'s invitable roles an existing member holds.

    Unchecking a role revokes it, so this is one edit of what the person can do
    here rather than an additive grant.  Roles the organization does not offer by
    invitation are held but not editable here; they are listed in
    ``locked_role_names`` so the page says what it is not showing checkboxes for.
    """

    def __init__(self, *args: Any, organization: Organization, member: User, **kwargs: Any) -> None:
        super().__init__(*args, organization=organization, **kwargs)
        held = sorted(
            PermissionGroup.objects.filter(organization=organization, user=member).values_list("label", flat=True)
        )
        offered = set(self.role_names)
        self.locked_role_names = [name for name in held if name not in offered]
        # Clearing every role is a real state — it is what a member starts as
        # before any role is granted — so revoking the last one is allowed here,
        # unlike on the invite form where it would send a pointless invitation.
        self.fields["permission_templates"].required = False
        self.fields["permission_templates"].initial = [name for name in held if name in offered]


class GrantForm(forms.ModelForm):
    """Admin form for :class:`Grant` — mirrors the write-service rules in the UI.

    * ``permissions.E002`` — only scoped Roles can sit in a Grant; a global Role
      lives in ``user.groups``, never in a Grant row, so the role choices never
      offer one.
    * ``permissions.E003`` — a *new* object grant may only target a whitelisted
      model (ADR 0001 §2.5).  While the ``object_grants_enabled`` waffle switch
      is off the whitelist is empty and every object grant is refused here,
      before a row exists — the same gate ``grant_obj`` applies to service
      writes, so the admin cannot mint grants the predicate will not honor.
    """

    class Meta:
        model = Grant
        fields = (
            "principal_user",
            "principal_org",
            "role",
            "scope_org",
            "scope_object_type",
            "scope_object_id",
        )

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        # E002 up front: never offer a global Role in the grant form.
        self.fields["role"].queryset = Role.objects.filter(is_global=False)

    def clean(self) -> dict[str, Any]:
        cleaned = super().clean()
        scope_object_type = cleaned.get("scope_object_type")
        if scope_object_type is not None and self.instance.pk is None:
            # New object grants only — an existing object-grant row stays
            # editable once the feature is disabled (E003 still flags it at
            # deploy time rather than silently dropping it).
            from common.permissions.object_grants import object_grant_whitelist

            target = scope_object_type.model_class()
            if target is None or not any(issubclass(target, cls) for cls in object_grant_whitelist()):
                raise ValidationError(
                    {
                        "scope_object_type": (
                            f"{scope_object_type} is not object-grantable: the object-grant "
                            "feature is off or the model is not whitelisted (ADR 0001 §2.5, "
                            "permissions.E003)."
                        )
                    }
                )
        return cleaned
