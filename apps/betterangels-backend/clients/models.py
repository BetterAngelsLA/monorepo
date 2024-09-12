from typing import List, Optional

from accounts.models import User
from clients.enums import (
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
from common.models import Attachment, BaseModel
from dateutil.relativedelta import relativedelta
from django.contrib.contenttypes.fields import GenericRelation
from django.contrib.postgres.fields import ArrayField
from django.db import models
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
    phone_number = PhoneNumberField(region="US", blank=True, null=True)
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
    phone_number = PhoneNumberField(region="US", blank=True, null=True)
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
