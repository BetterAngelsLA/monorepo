from typing import TYPE_CHECKING, Any, Dict, Iterable, List, Optional, Tuple

import pghistory
from accounts.enums import (
    ClientDocumentNamespaceEnum,
    EyeColorEnum,
    GenderEnum,
    HairColorEnum,
    HmisAgencyEnum,
    LanguageEnum,
    MaritalStatusEnum,
    PronounEnum,
    RaceEnum,
    RelationshipTypeEnum,
    YesNoPreferNotToSayEnum,
)
from accounts.groups import GroupTemplateNames
from accounts.managers import UserManager
from common.models import Attachment, BaseModel
from dateutil.relativedelta import relativedelta
from django.contrib.auth.models import (
    AbstractBaseUser,
    Group,
    Permission,
    PermissionsMixin,
)
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.contrib.contenttypes.fields import GenericRelation
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.forms import ValidationError
from django.utils import timezone
from django_choices_field import TextChoicesField
from guardian.models import GroupObjectPermissionAbstract, UserObjectPermissionAbstract
from organizations.models import Organization, OrganizationInvitation, OrganizationUser
from strawberry_django.descriptors import model_property

if TYPE_CHECKING:
    from common.models import AttachmentUserObjectPermission
    from notes.models import (
        NoteUserObjectPermission,
        ServiceRequestUserObjectPermission,
        TaskUserObjectPermission,
    )

DOC_READY_NAMESPACES = [
    ClientDocumentNamespaceEnum.DRIVERS_LICENSE_FRONT,
    ClientDocumentNamespaceEnum.DRIVERS_LICENSE_BACK,
    ClientDocumentNamespaceEnum.PHOTO_ID,
    ClientDocumentNamespaceEnum.BIRTH_CERTIFICATE,
    ClientDocumentNamespaceEnum.SOCIAL_SECURITY_CARD,
    ClientDocumentNamespaceEnum.OTHER_DOC_READY,
]
CONSENT_FORM_NAMESPACES = [
    ClientDocumentNamespaceEnum.CONSENT_FORM,
    ClientDocumentNamespaceEnum.HMIS_FORM,
    ClientDocumentNamespaceEnum.OTHER_FORM,
]


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
            "Designates whether this user should be treated as active. " "Unselect this instead of deleting accounts."
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

    # MyPy hints for Permission Reverses
    attachmentuserobjectpermission_set: models.QuerySet["AttachmentUserObjectPermission"]
    biguserobjectpermission_set: models.QuerySet["BigUserObjectPermission"]
    noteuserobjectpermission_set: models.QuerySet["NoteUserObjectPermission"]
    taskuserobjectpermission_set: models.QuerySet["TaskUserObjectPermission"]
    servicerequestuserobjectpermission_set: models.QuerySet["ServiceRequestUserObjectPermission"]

    def __str__(self: "User") -> str:
        return f"{self.full_name if self.full_name else self.pk}"

    @model_property
    def full_name(self: "User") -> str:
        name_parts = filter(None, [self.first_name, self.middle_name, self.last_name])
        return " ".join(name_parts).strip()

    @model_property
    def is_outreach_authorized(self: "User") -> bool:
        user_organizations = self.organizations_organization.all()

        if not user_organizations:
            return False

        # TODO: This is a temporary approach while we have just one permission group.
        # Once this list grows, we'll need to create an actual list of authorized groups.
        authorized_permission_groups = [template.value for template in GroupTemplateNames]

        return PermissionGroup.objects.filter(
            organization__in=user_organizations, template__name__in=authorized_permission_groups
        ).exists()


class HmisProfile(models.Model):
    client_profile = models.ForeignKey("ClientProfile", on_delete=models.CASCADE, related_name="hmis_profiles")
    hmis_id = models.CharField(max_length=50)
    agency = TextChoicesField(choices_enum=HmisAgencyEnum)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["hmis_id", "agency"], name="unique_hmis_id_agency")]


class ClientProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="client_profile")
    address = models.TextField(blank=True, null=True)
    place_of_birth = models.CharField(max_length=100, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    documents = GenericRelation(Attachment)
    eye_color = TextChoicesField(choices_enum=EyeColorEnum, blank=True, null=True)
    gender = TextChoicesField(choices_enum=GenderEnum, blank=True, null=True)
    hair_color = TextChoicesField(choices_enum=HairColorEnum, blank=True, null=True)
    height_in_inches = models.FloatField(blank=True, null=True)
    hmis_id = models.CharField(max_length=50, blank=True, null=True, db_index=True, unique=True)
    marital_status = TextChoicesField(choices_enum=MaritalStatusEnum, blank=True, null=True)
    nickname = models.CharField(max_length=50, blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    physical_description = models.TextField(blank=True, null=True)
    preferred_language = TextChoicesField(choices_enum=LanguageEnum, blank=True, null=True)
    pronouns = TextChoicesField(choices_enum=PronounEnum, blank=True, null=True)
    pronouns_other = models.CharField(max_length=100, null=True, blank=True)
    race = TextChoicesField(choices_enum=RaceEnum, blank=True, null=True)
    spoken_languages = ArrayField(base_field=TextChoicesField(choices_enum=LanguageEnum), blank=True, null=True)
    veteran_status = TextChoicesField(choices_enum=YesNoPreferNotToSayEnum, blank=True, null=True)

    @model_property
    def doc_ready_documents(self: "ClientProfile") -> List[Attachment]:
        return self.documents.filter(namespace__in=DOC_READY_NAMESPACES) or []

    @model_property
    def consent_form_documents(self: "ClientProfile") -> List[Attachment]:
        return self.documents.filter(namespace__in=CONSENT_FORM_NAMESPACES) or []

    @model_property
    def other_documents(self: "ClientProfile") -> List[Attachment]:
        return self.documents.filter(namespace=ClientDocumentNamespaceEnum.OTHER_CLIENT_DOCUMENT) or []

    @model_property
    def age(self) -> Optional[int]:
        if not self.date_of_birth:
            return None

        today = timezone.now().date()
        age = relativedelta(today, self.date_of_birth).years

        return age

    @model_property
    def display_pronouns(self) -> Optional[str]:
        if not self.pronouns:
            return None

        if self.pronouns == PronounEnum.OTHER:
            return self.pronouns_other

        return self.pronouns.label


class ClientContact(BaseModel):
    client_profile = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name="contacts")
    name = models.CharField(max_length=100, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    mailing_address = models.TextField(null=True, blank=True)
    relationship_to_client = TextChoicesField(RelationshipTypeEnum, null=True, blank=True)
    relationship_to_client_other = models.CharField(max_length=100, null=True, blank=True)


class ClientHouseholdMember(models.Model):
    client_profile = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name="household_members")
    name = models.CharField(max_length=100, null=True, blank=True)
    date_of_birth = models.DateField(blank=True, null=True)
    gender = TextChoicesField(choices_enum=GenderEnum, blank=True, null=True)
    relationship_to_client = TextChoicesField(RelationshipTypeEnum, null=True, blank=True)
    relationship_to_client_other = models.CharField(max_length=100, null=True, blank=True)


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
