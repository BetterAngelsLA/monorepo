from typing import Any, ClassVar, Dict, Iterable, Tuple

import pghistory
from accounts.managers import ClientManager, UserManager
from django.contrib.auth.models import (
    AbstractBaseUser,
    Group,
    Permission,
    PermissionsMixin,
)
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.db import models
from django.forms import ValidationError
from guardian.models import (
    GroupObjectPermissionAbstract,
    GroupObjectPermissionBase,
    UserObjectPermissionAbstract,
    UserObjectPermissionBase,
)
from organizations.models import Organization, OrganizationInvitation, OrganizationUser
from polymorphic.models import PolymorphicModel


@pghistory.track(
    pghistory.InsertEvent("user.add"),
    pghistory.UpdateEvent("user.update"),
    pghistory.DeleteEvent("user.remove"),
)
class User(AbstractBaseUser, PermissionsMixin, PolymorphicModel):
    username_validator = UnicodeUsernameValidator()

    username = models.CharField(
        ("username"),
        max_length=150,
        help_text=("Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only."),
        validators=[username_validator],
    )
    first_name = models.CharField(max_length=30, blank=True, null=True, db_index=True)
    last_name = models.CharField(max_length=30, blank=True, null=True, db_index=True)
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
            "Designates whether this user should be treated as active. " "Unselect this instead of deleting accounts."
        ),
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    organizations_organizationuser: models.QuerySet[OrganizationUser]

    def __str__(self: "User") -> str:
        return self.email


class Client(User):
    objects: ClassVar = ClientManager()

    clientuserobjectpermission_set: models.QuerySet["ClientUserObjectPermission"]
    clientgroupobjectpermission_set: models.QuerySet["ClientGroupObjectPermission"]


class ClientProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="client_profile")
    hmis_id = models.CharField(max_length=50, blank=True, null=True, db_index=True, unique=True)


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
        unique_together = ("organization", "group")

    def delete(self, *args: Any, **kwargs: Any) -> Tuple[int, Dict[str, int]]:
        self.group.delete()
        return super().delete(*args, **kwargs)

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.pk and self.template:
            raise ValidationError("Updating a PermissionGroup with a template is not allowed.")
        # TODO: Update the admin so that when a template is defined you can't enter in a
        # name. Also make it clear that the name of the group will be prefixed by the
        # org name.
        if hasattr(self, "template"):
            permissions_to_apply: Iterable[Permission] = []
            if self.template:
                group_name = f"{self.organization.name}_{self.template.name}"
                permissions_to_apply = self.template.permissions.all()
                self.name = self.template.name
            else:
                group_name = f"{self.organization.name}_{self.name}"

            self.group = Group.objects.create(name=group_name)
            self.group.permissions.set(permissions_to_apply)

        super().save(*args, **kwargs)


class ClientUserObjectPermission(UserObjectPermissionBase):
    content_object: models.ForeignKey = models.ForeignKey(
        Client, on_delete=models.CASCADE, related_name="client_user_object_permission"
    )


class ClientGroupObjectPermission(GroupObjectPermissionBase):
    content_object: models.ForeignKey = models.ForeignKey(
        Client, on_delete=models.CASCADE, related_name="client_group_object_permission"
    )
