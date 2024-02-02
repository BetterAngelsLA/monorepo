from typing import Any, Optional

from accounts.managers import UserManager
from django.contrib.auth.models import (
    AbstractBaseUser,
    Group,
    Permission,
    PermissionsMixin,
)
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.db import models
from guardian.models import GroupObjectPermissionAbstract, UserObjectPermissionAbstract
from organizations.models import Organization, OrganizationInvitation
from simple_history.models import HistoricalRecords


# TODO: Figure out why User/Group Perms are failing type checks
# https://github.com/typeddjango/django-stubs/issues/1354
class User(AbstractBaseUser, PermissionsMixin):  # type: ignore[django-manager-missing]
    username_validator = UnicodeUsernameValidator()

    username = models.CharField(
        ("username"),
        max_length=150,
        help_text=(
            "Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only."
        ),
        validators=[username_validator],
    )
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)
    email = models.EmailField(unique=True)
    is_superuser = models.BooleanField(default=False)
    is_staff = models.BooleanField(
        ("staff status"),
        default=False,
        help_text=("Designates whether the user can log into this admin site."),
    )

    is_active = models.BooleanField(
        ("active"),
        default=True,
        help_text=(
            "Designates whether this user should be treated as active. "
            "Unselect this instead of deleting accounts."
        ),
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    history = HistoricalRecords()

    def __str__(self: "User") -> str:
        return self.email


class ExtendedOrganizationInvitation(OrganizationInvitation):
    accepted = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Organization Invitation"
        verbose_name_plural = "Organization Invitations"

    organization_invitation = models.OneToOneField(
        OrganizationInvitation,
        on_delete=models.CASCADE,
        parent_link=True,
        related_name="extended_invitation",
    )


class BigGroupObjectPermission(GroupObjectPermissionAbstract):
    # https://github.com/django-guardian/django-guardian/blob/77de2033951c2e6b8fba2ac6258defdd23902bbf/docs/configuration.rst#guardian_user_obj_perms_model
    id = models.BigAutoField(editable=False, unique=True, primary_key=True)

    class Meta(GroupObjectPermissionAbstract.Meta):
        abstract = False
        indexes = [
            *GroupObjectPermissionAbstract.Meta.indexes,
            # TODO: Check if this field order is optimal
            models.Index(fields=["content_type", "object_pk", "group"]),
        ]


class BigUserObjectPermission(UserObjectPermissionAbstract):
    # https://github.com/django-guardian/django-guardian/blob/77de2033951c2e6b8fba2ac6258defdd23902bbf/docs/configuration.rst#guardian_group_obj_perms_model
    id = models.BigAutoField(editable=False, unique=True, primary_key=True)

    class Meta(UserObjectPermissionAbstract.Meta):
        abstract = False
        indexes = [
            *UserObjectPermissionAbstract.Meta.indexes,
            # TODO: Check if this field order is optimal
            models.Index(fields=["content_type", "object_pk", "user"]),
        ]


class PermissionGroupTemplate(models.Model):
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
    group = models.ForeignKey(
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
        unique_together = ("organization", "group")

    def save(self, *args: Any, **kwargs: Any) -> None:
        if not hasattr(self, "group"):
            self._create_group()
        super().save(*args, **kwargs)

    def _create_group(self) -> None:
        permission_group_name = self.name
        if self.template:
            permission_group_name = self.template.name
            self.name = self.template.name

        group_name = f"{self.organization.name}_{permission_group_name}"
        group = Group.objects.create(name=group_name)

        if self.template:
            permissions = self.template.permissions.all()
            group.permissions.set(permissions)

        self.group = group
