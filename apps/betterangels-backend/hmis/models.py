from typing import Any, Optional

import pghistory
from clients.enums import PronounEnum
from clients.models import AbstractClientProfile
from dateutil.relativedelta import relativedelta
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.utils import timezone
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
from strawberry_django.descriptors import model_property


@pghistory.track(
    pghistory.InsertEvent("hmisclientprofile.add"),
    pghistory.UpdateEvent("hmisclientprofile.update"),
    pghistory.DeleteEvent("hmisclientprofile.remove"),
)
class HmisClientProfile(AbstractClientProfile):
    personal_id = models.CharField(unique=True, max_length=50, db_index=True)
    unique_identifier = models.CharField(unique=True, max_length=50, db_index=True)
    name_data_quality = IntegerChoicesField(
        choices_enum=HmisNameQualityEnum,
        default=HmisNameQualityEnum.NOT_COLLECTED,
    )
    ssn1 = models.CharField(max_length=3, blank=True, null=True)
    ssn2 = models.CharField(max_length=2, blank=True, null=True)
    ssn3 = models.CharField(max_length=4, blank=True, null=True)
    ssn_data_quality = IntegerChoicesField(
        choices_enum=HmisSsnQualityEnum,
        default=HmisSsnQualityEnum.NOT_COLLECTED,
    )
    dob = models.DateField(blank=True, null=True)
    dob_data_quality = IntegerChoicesField(
        choices_enum=HmisDobQualityEnum,
        default=HmisDobQualityEnum.NOT_COLLECTED,
    )
    name_suffix = IntegerChoicesField(
        choices_enum=HmisSuffixEnum,
        default=HmisSuffixEnum.NO_ANSWER,
    )
    race_ethnicity = ArrayField(
        IntegerChoicesField(
            choices_enum=HmisRaceEnum,
            default=HmisRaceEnum.NOT_COLLECTED,
        )
    )
    additional_race_ethnicity = models.CharField(max_length=100, blank=True, null=True)
    gender = ArrayField(
        IntegerChoicesField(
            choices_enum=HmisGenderEnum,
            default=HmisGenderEnum.NOT_COLLECTED,
        )
    )  # type: ignore
    different_identity_text = models.CharField(max_length=100, blank=True, null=True)
    veteran_status = IntegerChoicesField(
        choices_enum=HmisVeteranStatusEnum,
        default=HmisVeteranStatusEnum.NOT_COLLECTED,
    )  # type: ignore

    objects = models.Manager()

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

        return force_str(self.pronouns.label)

    @model_property
    def display_gender(self) -> Optional[str]:
        if not self.gender:
            return None

        if self.gender == HmisGenderEnum.DIFFERENT:
            return self.different_identity_text

        return force_str(self.gender.label)

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
