from typing import Any, cast

import pghistory
from accounts.managers import UserManager
from common.models import BaseModel
from django.contrib.auth.models import AbstractBaseUser, Group, Permission, PermissionsMixin
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.indexes import GinIndex
from django.core.exceptions import ValidationError
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
    """A role that :class:`PermissionGroup` scopes to an organization.

    Where its permissions come from depends on whether the code knows the role:

    * named in :data:`common.org_types.REGISTRY` — its
      :class:`~common.permissions.config.TemplateConfig` is authoritative, and
      ``permissions`` here is kept as a mirror of it.
    * created by hand in the admin — ``permissions`` here *is* the definition, and
      is left alone.

    Either way :func:`accounts.seed.sync_group_permissions` is what applies it to
    the ``auth.Group`` that actually grants the access, so a role defined once
    reaches every organization holding it.
    """

    name = models.CharField(max_length=255)
    permissions = models.ManyToManyField(Permission, blank=True)

    objects = models.Manager()

    def __str__(self) -> str:
        return self.name


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

    def clean(self) -> None:
        """Require a template or a name to identify the role.

        Both are optional individually, so the admin inline could otherwise save
        a row with neither — leaving its group's role segment empty and colliding
        with the next such row on the unique ``auth.Group.name``.
        """
        if not self.template_id and not self.name:
            raise ValidationError("A permission group needs either a template or a name.")

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
        """Return the ``auth.Group`` name for this row, e.g. ``Acme Housing [3] · Caseworker``.

        The pk is what makes the name unique — ``auth.Group.name`` is unique and
        ``Organization.name`` is not — and the organization's name rides alongside
        it because this string is the label in the group picker and the
        ``auth.Group`` changelist.  Organization first so those lists sort
        alphabetically by organization rather than by pk-as-string.

        Truncated to fit: ``Organization.name`` allows 200 characters and a
        hand-entered role name 255, against ``auth.Group.name``'s 150.

        Nothing reads this as data — every lookup goes through ``PermissionGroup``
        — so :func:`accounts.services.reconcile_org_groups` refreshing it is
        enough.  A rename outside that path leaves the label stale until the next
        reconcile, which is only acceptable while nothing keys off it.
        """
        max_length = cast(int, Group._meta.get_field("name").max_length)
        role = self.template.name if self.template else self.name
        suffix = f" [{self.organization_id}] · {role}"
        budget = max(max_length - len(suffix), 0)
        return f"{self.organization.name[:budget]}{suffix}"[:max_length]


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
