import os
import uuid
from typing import Any, List, Optional

from accounts.models import User
from betterangels_backend import settings
from clients.enums import (
    AdaAccommodationEnum,
    ClientDocumentNamespaceEnum,
    EyeColorEnum,
    GenderEnum,
    HairColorEnum,
    HmisAgencyEnum,
    LanguageEnum,
    LivingSituationEnum,
    MaritalStatusEnum,
    PreferredCommunicationEnum,
    PronounEnum,
    RaceEnum,
    RelationshipTypeEnum,
    SocialMediaEnum,
    VeteranStatusEnum,
)
from common.constants import CALIFORNIA_ID_REGEX
from common.models import Attachment, BaseModel, PhoneNumber
from dateutil.relativedelta import relativedelta
from django.contrib.contenttypes.fields import GenericRelation
from django.contrib.postgres.fields import ArrayField
from django.core.validators import RegexValidator
from django.db import models
from django.db.models import Model
from django.utils import timezone
from django_choices_field import TextChoicesField
from phonenumber_field.modelfields import PhoneNumberField
from strawberry_django.descriptors import model_property

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
    ClientDocumentNamespaceEnum.INCOME_FORM,
    ClientDocumentNamespaceEnum.OTHER_FORM,
]


def get_client_profile_photo_file_path(instance: Model, filename: str) -> str:
    """
    Generates a unique path for storing an uploaded file by appending a UUID to the
    file's original name, preserving its extension. Designed for use in Django's
    FileField or ImageField 'upload_to' parameter, it ensures each file has a unique
    name and organizes files in the 'client_profile_photos/' directory.

    Parameters:
    - instance (models.Model): The model instance the file is attached to. Not used in
      this function, but required for 'upload_to'.
    - filename (str): The original filename, used to keep the file extension.

    Returns:
    - str: The unique file storage path, combining 'client_profile_photos/' and the UUID-named
      file.

    Example:
        Use in a Django model to ensure uploaded files are uniquely named and organized.
        file = models.FileField(upload_to=get_client_profile_photo_file_path)
    """
    ext = filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join("client_profile_photos/", unique_filename)


class HmisProfile(models.Model):
    client_profile = models.ForeignKey("ClientProfile", on_delete=models.CASCADE, related_name="hmis_profiles")
    hmis_id = models.CharField(max_length=50)
    agency = TextChoicesField(choices_enum=HmisAgencyEnum)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["hmis_id", "agency"], name="unique_hmis_id_agency")]


class ClientProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="client_profile")
    ada_accommodation = ArrayField(
        base_field=TextChoicesField(choices_enum=AdaAccommodationEnum), blank=True, null=True
    )
    address = models.TextField(blank=True, null=True)
    california_id = models.CharField(
        max_length=8,
        unique=True,
        blank=True,
        null=True,
        validators=[
            RegexValidator(regex=CALIFORNIA_ID_REGEX, message="California ID must be 1 letter followed by 7 numbers")
        ],
    )
    date_of_birth = models.DateField(blank=True, null=True)
    documents = GenericRelation(Attachment)
    eye_color = TextChoicesField(choices_enum=EyeColorEnum, blank=True, null=True)
    gender = TextChoicesField(choices_enum=GenderEnum, blank=True, null=True)
    gender_other = models.CharField(max_length=100, null=True, blank=True)
    hair_color = TextChoicesField(choices_enum=HairColorEnum, blank=True, null=True)
    height_in_inches = models.FloatField(blank=True, null=True)
    important_notes = models.TextField(blank=True, null=True)
    living_situation = TextChoicesField(choices_enum=LivingSituationEnum, blank=True, null=True)
    mailing_address = models.TextField(blank=True, null=True)
    marital_status = TextChoicesField(choices_enum=MaritalStatusEnum, blank=True, null=True)
    nickname = models.CharField(max_length=50, blank=True, null=True)
    phone_number = PhoneNumberField(region="US", blank=True, null=True)
    phone_numbers = GenericRelation(PhoneNumber)
    physical_description = models.TextField(blank=True, null=True)
    place_of_birth = models.CharField(max_length=100, blank=True, null=True)
    preferred_communication = ArrayField(
        base_field=TextChoicesField(choices_enum=PreferredCommunicationEnum), blank=True, null=True
    )
    preferred_language = TextChoicesField(choices_enum=LanguageEnum, blank=True, null=True)
    profile_photo = models.ImageField(upload_to=get_client_profile_photo_file_path, blank=True, null=True)
    pronouns = TextChoicesField(choices_enum=PronounEnum, blank=True, null=True)
    pronouns_other = models.CharField(max_length=100, null=True, blank=True)
    race = TextChoicesField(choices_enum=RaceEnum, blank=True, null=True)
    residence_address = models.TextField(blank=True, null=True)
    spoken_languages = ArrayField(base_field=TextChoicesField(choices_enum=LanguageEnum), blank=True, null=True)
    veteran_status = TextChoicesField(choices_enum=VeteranStatusEnum, blank=True, null=True)

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

    @model_property
    def display_gender(self) -> Optional[str]:
        if not self.gender:
            return None

        if self.gender == GenderEnum.OTHER:
            return self.gender_other

        return self.gender.label

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.california_id:
            self.california_id = self.california_id.upper()
        else:
            self.california_id = None

        super().save(*args, **kwargs)

    class Meta:
        ordering = ["user__first_name"]


class SocialMediaProfile(models.Model):
    client_profile = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name="social_media_profiles")
    platform = TextChoicesField(choices_enum=SocialMediaEnum)
    platform_user_id = models.CharField(max_length=100)


class ClientContact(BaseModel):
    client_profile = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name="contacts")
    name = models.CharField(max_length=100, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    phone_number = PhoneNumberField(region="US", blank=True, null=True)
    mailing_address = models.TextField(null=True, blank=True)
    relationship_to_client = TextChoicesField(RelationshipTypeEnum, null=True, blank=True)
    relationship_to_client_other = models.CharField(max_length=100, null=True, blank=True)


class ClientHouseholdMember(models.Model):
    client_profile = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name="household_members")
    name = models.CharField(max_length=100, null=True, blank=True)
    date_of_birth = models.DateField(blank=True, null=True)
    gender = TextChoicesField(choices_enum=GenderEnum, blank=True, null=True)
    gender_other = models.CharField(max_length=100, null=True, blank=True)
    relationship_to_client = TextChoicesField(RelationshipTypeEnum, null=True, blank=True)
    relationship_to_client_other = models.CharField(max_length=100, null=True, blank=True)

    @model_property
    def display_gender(self) -> Optional[str]:
        if not self.gender:
            return None

        if self.gender == GenderEnum.OTHER:
            return self.gender_other

        return self.gender.label


# Data Import #
class ClientProfileDataImport(models.Model):
    """
    Model to track a client profile import job.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    imported_at = models.DateTimeField(auto_now_add=True)
    source_file = models.CharField(max_length=255)
    imported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    notes = models.TextField(blank=True, default="")

    def __str__(self) -> str:
        return f"ClientProfile Import {self.id} from {self.source_file} at {self.imported_at}"


class ClientProfileImportRecord(models.Model):
    """
    Model to record each imported row (i.e. client profile) for a given
    ClientProfileDataImport job.

    Stores the original CSV row (raw_data), the original CSV id (source_id),
    and, if successfully imported, a link to the ClientProfile created via GraphQL.
    """

    import_job = models.ForeignKey(ClientProfileDataImport, on_delete=models.CASCADE, related_name="records")
    source_id = models.CharField(max_length=255)
    source_name = models.CharField(max_length=255)
    client_profile = models.ForeignKey(
        "clients.ClientProfile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    raw_data = models.JSONField()
    success = models.BooleanField(default=False)
    error_message = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["import_job", "success", "source_name", "source_id"]),
        ]

    def __str__(self) -> str:
        status = "Success" if self.success else "Failed"
        return f"ClientProfile Import Record {self.source_id} ({status})"
