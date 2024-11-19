from datetime import timedelta
from functools import reduce
from operator import and_, or_
from typing import List, Optional, Tuple

import strawberry
import strawberry_django
from accounts.types import CreateUserInput, UpdateUserInput, UserType
from clients.enums import (
    AdaAccommodationEnum,
    ClientDocumentNamespaceEnum,
    LanguageEnum,
    LivingSituationEnum,
    PreferredCommunicationEnum,
)
from common.graphql.types import (
    AttachmentInterface,
    PhoneNumberInput,
    PhoneNumberScalar,
    PhoneNumberType,
)
from common.models import Attachment
from django.db.models import Max, Q, QuerySet
from django.utils import timezone
from strawberry import ID, Info, auto
from strawberry.file_uploads import Upload
from strawberry_django.filters import filter

from .models import (
    ClientContact,
    ClientHouseholdMember,
    ClientProfile,
    HmisProfile,
    SocialMediaProfile,
)

MIN_INTERACTED_AGO_FOR_ACTIVE_STATUS = dict(days=90)


@strawberry_django.type(Attachment, pagination=True)
class ClientDocumentType(AttachmentInterface):
    namespace: ClientDocumentNamespaceEnum


@strawberry_django.input(Attachment)
class CreateClientDocumentInput:
    client_profile: ID
    file: Upload
    namespace: ClientDocumentNamespaceEnum


@strawberry_django.ordering.order(ClientProfile)
class ClientProfileOrder:
    user__first_name: auto
    user__last_name: auto
    id: auto


@strawberry.input
class ClientSearchInput:
    excluded_client_profile_id: Optional[str] = None
    california_id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None


@filter(ClientProfile)
class ClientProfileFilter:
    @strawberry_django.filter_field
    def is_active(
        self, queryset: QuerySet, info: Info, value: Optional[bool], prefix: str
    ) -> Tuple[QuerySet[ClientProfile], Q]:
        if value is None:
            return queryset, Q()

        earliest_interaction_threshold = timezone.now().date() - timedelta(**MIN_INTERACTED_AGO_FOR_ACTIVE_STATUS)
        # Filter profiles based on the maximum interacted_at date being within the threshold
        comparison = "gte" if value else "lt"

        return (
            queryset.alias(last_interacted_at=Max("user__client_notes__interacted_at")),
            Q(**{f"last_interacted_at__{comparison}": earliest_interaction_threshold}),
        )

    @strawberry_django.filter_field
    def search(
        self,
        queryset: QuerySet,
        info: Info,
        value: Optional[str],
        prefix: str,
    ) -> Tuple[QuerySet[ClientProfile], Q]:
        if value is None:
            return queryset, Q()

        search_terms = value.split(" ")

        q_objects = []
        combined_q_search = []
        searchable_fields = [
            "california_id",
            "hmis_id",
            "nickname",
            "user__first_name",
            "user__last_name",
            "user__middle_name",
        ]

        for term in search_terms:
            q_search = [Q(**{f"{field}__icontains": term}) for field in searchable_fields]
            combined_q_search.append(reduce(or_, q_search))
            q_objects.append(Q(*combined_q_search))

        queryset = queryset.filter(reduce(and_, q_objects))

        return (queryset, Q())

    @strawberry_django.filter_field
    def search_client(
        self,
        queryset: QuerySet,
        info: Info,
        value: ClientSearchInput,
        prefix: str,
    ) -> Tuple[QuerySet[ClientProfile], Q]:
        """
        Returns client profiles with exact match on all provided search fields (case insensitive).
        All search fields are optional.

        Accepts an excluded_client_profile_id param to exclude from result set.
        In the context of client deduplication, this prevents the client profile being edited
        from being flagged as a duplicate entry.
        """
        filters = {}

        client_profile_fields = ["california_id"]
        user_fields = ["first_name", "middle_name", "last_name"]

        for field in client_profile_fields:
            if field_value := (getattr(value, field) or "").strip():
                filters[f"{field}__iexact"] = field_value

        for field in user_fields:
            if field_value := (getattr(value, field) or "").strip():
                filters[f"user__{field}__iexact"] = field_value

        if not filters:
            return (queryset.none(), Q())

        queryset = queryset.filter(**filters)

        if excluded_id := value.excluded_client_profile_id:
            queryset = queryset.exclude(id=excluded_id)

        return (queryset, Q())


@strawberry_django.type(HmisProfile)
class HmisProfileType:
    id: auto
    hmis_id: auto
    agency: auto


@strawberry_django.input(HmisProfile)
class HmisProfileInput(HmisProfileType):
    "See parent"


@strawberry_django.type(SocialMediaProfile)
class SocialMediaProfileBaseType:
    id: Optional[ID]
    client_profile: auto
    platform: auto
    platform_user_id: auto


@strawberry_django.type(SocialMediaProfile)
class SocialMediaProfileType(SocialMediaProfileBaseType):
    "See parent"


@strawberry_django.input(SocialMediaProfile, partial=True)
class SocialMediaProfileInput(SocialMediaProfileBaseType):
    "See parent"


@strawberry_django.type(ClientProfile)
class ClientProfileBaseType:
    ada_accommodation: Optional[List[AdaAccommodationEnum]]
    address: auto
    age: auto
    california_id: auto
    date_of_birth: auto
    eye_color: auto
    gender: auto
    gender_other: auto
    hair_color: auto
    height_in_inches: auto
    hmis_id: auto
    important_notes: auto
    living_situation: Optional[LivingSituationEnum]
    marital_status: auto
    mailing_address: auto
    nickname: auto
    phone_number: Optional[PhoneNumberScalar]  # type: ignore
    physical_description: auto
    place_of_birth: auto
    preferred_communication: Optional[List[PreferredCommunicationEnum]]
    preferred_language: auto
    profile_photo: auto
    pronouns: auto
    pronouns_other: auto
    race: auto
    residence_address: auto
    spoken_languages: Optional[List[LanguageEnum]]
    veteran_status: auto


@strawberry.input
class ClientProfilePhotoInput:
    client_profile: ID
    photo: Upload


@strawberry_django.type(ClientContact)
class ClientContactBaseType:
    name: auto
    email: auto
    phone_number: Optional[PhoneNumberScalar]  # type: ignore
    mailing_address: auto
    relationship_to_client: auto
    relationship_to_client_other: auto


@strawberry_django.type(ClientContact)
class ClientContactType(ClientContactBaseType):
    id: ID
    client_profile: auto


@strawberry_django.input(ClientContact, partial=True)
class ClientContactInput(ClientContactBaseType):
    id: auto


@strawberry_django.type(ClientHouseholdMember)
class ClientHouseholdMemberBaseType:
    name: auto
    date_of_birth: auto
    gender: auto
    gender_other: auto
    relationship_to_client: auto
    relationship_to_client_other: auto


@strawberry_django.type(ClientHouseholdMember)
class ClientHouseholdMemberType(ClientHouseholdMemberBaseType):
    id: ID
    client_profile: auto
    display_gender: auto


@strawberry_django.input(ClientHouseholdMember, partial=True)
class ClientHouseholdMemberInput(ClientHouseholdMemberBaseType):
    id: auto


@strawberry_django.type(ClientProfile, filters=ClientProfileFilter, order=ClientProfileOrder, pagination=True)  # type: ignore[literal-required]
class ClientProfileType(ClientProfileBaseType):
    id: ID
    contacts: Optional[List[ClientContactType]]
    hmis_profiles: Optional[List[HmisProfileType]]
    household_members: Optional[List[ClientHouseholdMemberType]]
    phone_numbers: Optional[List[PhoneNumberType]]
    social_media_profiles: Optional[List[SocialMediaProfileType]]

    display_gender: auto
    display_pronouns: auto

    doc_ready_documents: Optional[List[ClientDocumentType]]
    consent_form_documents: Optional[List[ClientDocumentType]]
    other_documents: Optional[List[ClientDocumentType]]

    user: UserType

    @strawberry.field
    def display_case_manager(self, info: Info) -> str:
        if case_managers := getattr(self, "case_managers", None):
            return str(case_managers[-1].name)

        return "Not Assigned"


@strawberry_django.input(ClientProfile, partial=True)
class CreateClientProfileInput(ClientProfileBaseType):
    contacts: Optional[List[ClientContactInput]]
    hmis_profiles: Optional[List[HmisProfileInput]]
    household_members: Optional[List[ClientHouseholdMemberInput]]
    phone_numbers: Optional[List[PhoneNumberInput]]
    social_media_profiles: Optional[List[SocialMediaProfileInput]]
    user: CreateUserInput


@strawberry_django.input(ClientProfile, partial=True)
class UpdateClientProfileInput(ClientProfileBaseType):
    id: ID
    contacts: Optional[List[ClientContactInput]]
    hmis_profiles: Optional[List[HmisProfileInput]]
    household_members: Optional[List[ClientHouseholdMemberInput]]
    phone_numbers: Optional[List[PhoneNumberInput]]
    social_media_profiles: Optional[List[SocialMediaProfileInput]]
    user: Optional[UpdateUserInput]


# TODO: refactor frontend to use ClientProfileInput instead of CreateClientProfileInput and UpdateClientProfileInput.
# Then, remove CreateClientProfileInput and UpdateClientProfileInput
@strawberry_django.input(ClientProfile, partial=True)
class ClientProfileInput(ClientProfileBaseType):
    id: Optional[ID]
    contacts: Optional[List[ClientContactInput]]
    hmis_profiles: Optional[List[HmisProfileInput]]
    household_members: Optional[List[ClientHouseholdMemberInput]]
    social_media_profiles: Optional[List[SocialMediaProfileInput]]
    user: Optional[UpdateUserInput]
