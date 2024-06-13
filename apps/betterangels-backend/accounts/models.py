from typing import TYPE_CHECKING, Any, Dict, Iterable, Tuple

import pghistory
from accounts.enums import GenderEnum, LanguageEnum, YesNoPreferNotToSayEnum
from accounts.managers import UserManager
from django.contrib.auth.models import (
    AbstractBaseUser,
    Group,
    Permission,
    PermissionsMixin,
)
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.forms import ValidationError
from django_choices_field import TextChoicesField
from guardian.models import GroupObjectPermissionAbstract, UserObjectPermissionAbstract
from organizations.models import Organization, OrganizationInvitation, OrganizationUser

if TYPE_CHECKING:
    from common.models import AttachmentUserObjectPermission
    from notes.models import (
        NoteUserObjectPermission,
        ServiceRequestUserObjectPermission,
        TaskUserObjectPermission,
    )


@pghistory.track(
    pghistory.InsertEvent("user.add"),
    pghistory.UpdateEvent("user.update"),
    pghistory.DeleteEvent("user.remove"),
)
class User(AbstractBaseUser, PermissionsMixin):
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

    # MyPy hints for Permission Reverses
    attachmentuserobjectpermission_set: models.QuerySet["AttachmentUserObjectPermission"]
    biguserobjectpermission_set: models.QuerySet["BigUserObjectPermission"]
    noteuserobjectpermission_set: models.QuerySet["NoteUserObjectPermission"]
    taskuserobjectpermission_set: models.QuerySet["TaskUserObjectPermission"]
    servicerequestuserobjectpermission_set: models.QuerySet["ServiceRequestUserObjectPermission"]

    def __str__(self: "User") -> str:
        return self.email

    @property
    def full_name(self: "User") -> str:
        return f"{self.first_name} {self.last_name}"


class ClientProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="client_profile")
    address = models.TextField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    gender = TextChoicesField(choices_enum=GenderEnum, blank=True, null=True)
    hmis_id = models.CharField(max_length=50, blank=True, null=True, db_index=True, unique=True)
    nickname = models.CharField(max_length=50, blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    preferred_language = TextChoicesField(choices_enum=LanguageEnum, blank=True, null=True)
    pronouns = models.CharField(max_length=50, blank=True, null=True)
    spoken_languages = ArrayField(base_field=TextChoicesField(choices_enum=LanguageEnum), blank=True, null=True)
    veteran_status = TextChoicesField(choices_enum=YesNoPreferNotToSayEnum, blank=True, null=True)


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
