from typing import Any

import pghistory
from accounts.managers import UserManager
from common.models import BaseModel
from django.contrib.auth.models import AbstractBaseUser, Group, PermissionsMixin
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.indexes import GinIndex
from django.db import models
from django.db.models import Q
from django_choices_field import TextChoicesField
from guardian.models import GroupObjectPermissionAbstract, UserObjectPermissionAbstract
from organizations.models import Organization, OrganizationInvitation, OrganizationUser
from strawberry_django.descriptors import model_property


@pghistory.track(
    pghistory.InsertEvent("user.add"),
    pghistory.UpdateEvent("user.update"),
    pghistory.DeleteEvent("user.remove"),
)
class User(AbstractBaseUser, PermissionsMixin):
    username_validator = UnicodeUsernameValidator()

    email = models.EmailField(unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=50, blank=True, null=True, db_index=True)
    last_name = models.CharField(max_length=50, blank=True, null=True, db_index=True)
    middle_name = models.CharField(max_length=50, blank=True, null=True)
    username = models.CharField(
        ("username"),
        max_length=150,
        help_text=("Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only."),
        validators=[username_validator],
        unique=True,
    )

    date_joined = models.DateTimeField(auto_now_add=True)
    has_accepted_privacy_policy = models.BooleanField(default=False)
    has_accepted_tos = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(
        ("active"),
        default=True,
        help_text=(
            "Designates whether this user should be treated as active. Unselect this instead of deleting accounts."
        ),
    )
    is_staff = models.BooleanField(
        ("staff status"),
        default=False,
        help_text=("Designates whether the user can log into this admin site."),
    )
    is_superuser = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    organizations_organization: models.QuerySet[Organization]
    organizations_organizationuser: models.QuerySet[OrganizationUser]

    def __str__(self: "User") -> str:
        return f"{self.full_name if self.full_name else self.pk}"

    @model_property
    def full_name(self: "User") -> str:
        name_parts = filter(None, [self.first_name, self.middle_name, self.last_name])
        return " ".join(name_parts).strip()

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.email:
            self.email = self.email.lower()
        else:
            self.email = None

        super().save(*args, **kwargs)


class ExtendedOrganizationInvitation(OrganizationInvitation):
    accepted: models.BooleanField = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Organization Invitation"
        verbose_name_plural = "Organization Invitations"

    organization_invitation: OrganizationInvitation = models.OneToOneField(
        OrganizationInvitation,
        on_delete=models.CASCADE,
        parent_link=True,
        related_name="extended_invitation",
    )


class BigGroupObjectPermission(GroupObjectPermissionAbstract):
    # https://github.com/django-guardian/django-guardian/blob/77de2033951c2e6b8fba2ac6258defdd23902bbf/docs/configuration.rst#guardian_user_obj_perms_model
    id: models.BigAutoField = models.BigAutoField(editable=False, unique=True, primary_key=True)

    class Meta(GroupObjectPermissionAbstract.Meta):
        abstract = False
        indexes = [
            *GroupObjectPermissionAbstract.Meta.indexes,
            # TODO: Check if this field order is optimal
            models.Index(fields=["content_type", "object_pk", "group"]),
        ]


class BigUserObjectPermission(UserObjectPermissionAbstract):
    # https://github.com/django-guardian/django-guardian/blob/77de2033951c2e6b8fba2ac6258defdd23902bbf/docs/configuration.rst#guardian_group_obj_perms_model
    id: models.BigAutoField = models.BigAutoField(editable=False, unique=True, primary_key=True)

    class Meta(UserObjectPermissionAbstract.Meta):
        abstract = False
        indexes = [
            *UserObjectPermissionAbstract.Meta.indexes,
            # TODO: Check if this field order is optimal
            models.Index(fields=["content_type", "object_pk", "user"]),
        ]


class PermissionGroupTemplate(models.Model):
    """The name of a role, used as the FK target for :class:`PermissionGroup`.

    Permissions are not stored here — they live in the role's
    :class:`~common.permissions.config.TemplateConfig` and are written onto the
    ``auth.Group`` that grants them.  See :func:`accounts.seed.sync_group_permissions`.
    """

    name = models.CharField(max_length=255)

    objects = models.Manager()

    def __str__(self) -> str:
        return self.name


def group_name_for(organization_id: int, template_name: str) -> str:
    """Return the ``auth.Group`` name for *template_name* within *organization_id*."""
    return f"org:{organization_id}:{template_name}"


class PermissionGroup(models.Model):
    name = models.CharField(
        max_length=255,
        blank=True,
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="permission_groups",
    )
    group = models.OneToOneField(
        Group,
        on_delete=models.CASCADE,
        blank=True,
    )
    template = models.ForeignKey(
        PermissionGroupTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    objects = models.Manager()

    class Meta:
        unique_together = (("organization", "group"), ("organization", "template"))

    def save(self, *args: Any, **kwargs: Any) -> None:
        """Create the backing ``auth.Group`` on first save.

        Group lifecycle otherwise belongs to
        :func:`accounts.services.reconcile_org_groups`, which is the only caller
        that can keep the group, its permissions and this row consistent.
        """
        if not self.pk and not self.group_id:
            self.group = Group.objects.create(name=self.group_name())
        if self.template and not self.name:
            self.name = self.template.name
        super().save(*args, **kwargs)

    def group_name(self) -> str:
        """Return the deterministic ``auth.Group`` name for this row.

        Keyed on the organization's pk rather than its name: ``auth.Group.name``
        is unique and only 150 characters, while ``Organization.name`` is neither
        unique nor short, so a name-derived value both collides between
        same-named orgs and goes stale on rename.
        """
        return group_name_for(self.organization_id, self.template.name if self.template else self.name)


class OrgTypeChoices(models.TextChoices):
    OUTREACH = "outreach", "Outreach"
    SHELTER = "shelter", "Shelter"


class OrganizationProfile(BaseModel):
    organization = models.OneToOneField(
        Organization,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    org_types = ArrayField(
        base_field=TextChoicesField(choices_enum=OrgTypeChoices),
    )

    objects = models.Manager()

    class Meta:
        indexes = [GinIndex(fields=["org_types"])]
        constraints = [
            models.CheckConstraint(
                condition=Q(org_types__len__gt=0),
                name="org_profile_has_org_type",
                violation_error_message="An organization must have at least one org type.",
            )
        ]

    def __str__(self) -> str:
        types = ", ".join(t.label for t in self.org_types)
        return f"{self.organization.name} ({types or 'no type'})"
