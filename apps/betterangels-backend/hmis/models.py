import os
import uuid
from typing import Any, Optional, cast

import pghistory
from accounts.models import User
from clients.enums import PronounEnum
from clients.models import AbstractClientProfile
from common.models import BaseModel, Location
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models import Field, Model
from django.utils.encoding import force_str
from django_choices_field import IntegerChoicesField
from hmis.enums import (
    HmisDobQualityEnum,
    HmisGenderEnum,
    HmisNameQualityEnum,
    HmisRaceEnum,
    HmisSsnQualityEnum,
    HmisSuffixEnum,
    HmisVeteranStatusEnum,
)
from notes.models import ServiceRequest
from strawberry_django.descriptors import model_property


def get_hmis_client_profile_photo_file_path(instance: Model, filename: str) -> str:
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
    return os.path.join("hmis_client_profile_photos/", unique_filename)


def get_default_race_list() -> list[HmisRaceEnum]:
    return [HmisRaceEnum.NOT_COLLECTED]


def get_default_gender_list() -> list[HmisGenderEnum]:
    return [HmisGenderEnum.NOT_COLLECTED]


@pghistory.track(
    pghistory.InsertEvent("hmisclientprofile.add"),
    pghistory.UpdateEvent("hmisclientprofile.update"),
    pghistory.DeleteEvent("hmisclientprofile.remove"),
)
class HmisClientProfile(AbstractClientProfile):
    hmis_id = models.CharField(unique=True, max_length=50, db_index=True, null=True)
    personal_id = models.CharField(max_length=50, blank=True, null=True)
    unique_identifier = models.CharField(unique=True, max_length=50, db_index=True)
    age = models.PositiveIntegerField(blank=True, null=True)
    name_middle = models.CharField(max_length=50, blank=True, null=True)
    name_quality = IntegerChoicesField(choices_enum=HmisNameQualityEnum, default=HmisNameQualityEnum.PARTIAL)
    alias = models.CharField(max_length=100, blank=True, null=True)
    ssn1 = models.CharField(max_length=3, blank=True, null=True)
    ssn2 = models.CharField(max_length=2, blank=True, null=True)
    ssn3 = models.CharField(max_length=4, blank=True, null=True)
    ssn_quality = IntegerChoicesField(choices_enum=HmisSsnQualityEnum, default=HmisSsnQualityEnum.NOT_COLLECTED)
    birth_date = models.DateField(blank=True, null=True)
    dob_quality = IntegerChoicesField(choices_enum=HmisDobQualityEnum, default=HmisDobQualityEnum.NOT_COLLECTED)
    name_suffix = IntegerChoicesField(choices_enum=HmisSuffixEnum, blank=True, null=True)
    race_ethnicity = ArrayField(IntegerChoicesField(choices_enum=HmisRaceEnum), default=get_default_race_list)
    profile_photo = models.ImageField(upload_to=get_hmis_client_profile_photo_file_path, blank=True, null=True)
    additional_race_ethnicity_detail = models.CharField(max_length=100, blank=True, null=True)
    gender = ArrayField(IntegerChoicesField(choices_enum=HmisGenderEnum), default=get_default_gender_list)
    gender_identity_text = models.CharField(max_length=100, blank=True, null=True)
    veteran = IntegerChoicesField(choices_enum=HmisVeteranStatusEnum, default=HmisVeteranStatusEnum.NOT_COLLECTED)
    added_date = models.DateTimeField(blank=True, null=True)
    last_updated = models.DateTimeField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.DO_NOTHING, blank=True, null=True)

    objects = models.Manager()

    @model_property
    def display_pronouns(self) -> Optional[str]:
        if not self.pronouns:
            return None

        if self.pronouns == PronounEnum.OTHER:
            return self.pronouns_other

        return force_str(self.pronouns.label)

    @model_property
    def display_gender(self) -> list[str]:
        if not self.gender:
            return []

        return [force_str(g.label) for g in self.gender if g is not HmisGenderEnum.DIFFERENT] + [
            self.gender_identity_text
        ]

    def full_clean(self, exclude: Any = None, validate_unique: bool = True, validate_constraints: bool = True) -> None:
        """
        `strawberry_django.mutations.resolvers.update()` runs `full_clean()` *before* `save()`.
        Coerce any explicitly-assigned `None` values back to field defaults so validation
        doesn't fail for non-nullable fields.
        """
        for field_name in ("veteran", "gender", "race_ethnicity"):
            if getattr(self, field_name, None) is None:
                model_field = cast(Field[Any, Any], self._meta.get_field(field_name))
                setattr(self, field_name, model_field.get_default())

        super().full_clean(exclude=exclude, validate_unique=validate_unique, validate_constraints=validate_constraints)

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.california_id:
            self.california_id = self.california_id.upper()
        else:
            self.california_id = None

        if self.email:
            self.email = self.email.lower()
        else:
            self.email = None

        super().save(*args, **kwargs)


@pghistory.track(
    pghistory.InsertEvent("hmisnote.add"),
    pghistory.UpdateEvent("hmisnote.update"),
    pghistory.DeleteEvent("hmisnote.remove"),
)
class HmisNote(BaseModel):
    hmis_id = models.CharField(unique=True, max_length=50, db_index=True)
    added_date = models.DateTimeField(blank=True, null=True)
    last_updated = models.DateTimeField(blank=True, null=True)
    date = models.DateField(blank=True, null=True)
    ref_client_program = models.BigIntegerField(blank=True, null=True)
    hmis_client_profile = models.ForeignKey(HmisClientProfile, on_delete=models.CASCADE, related_name="notes")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name="hmis_notes")
    title = models.CharField(max_length=255, null=True, blank=True)
    note = models.TextField(blank=True)
    location = models.ForeignKey(Location, on_delete=models.CASCADE, null=True, blank=True, related_name="hmis_notes")
    provided_services = models.ManyToManyField(ServiceRequest, blank=True, related_name="provided_hmis_notes")
    requested_services = models.ManyToManyField(ServiceRequest, blank=True, related_name="requested_hmis_notes")

    objects = models.Manager()
