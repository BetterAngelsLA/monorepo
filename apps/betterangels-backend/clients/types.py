from datetime import timedelta
from functools import reduce
from operator import and_, or_
from typing import List, Optional, Tuple

import strawberry
import strawberry_django
from clients.enums import (
    AdaAccommodationEnum,
    ClientDocumentGroupEnum,
    ClientDocumentNamespaceEnum,
    LanguageEnum,
    LivingSituationEnum,
    PreferredCommunicationEnum,
)
from common.graphql.types import (
    AttachmentInterface,
    NonBlankString,
    PhoneNumberInput,
    PhoneNumberScalar,
    PhoneNumberType,
)
from common.models import Attachment
from django.db.models import Exists, Max, OuterRef, Q, QuerySet
from django.utils import timezone
from strawberry import ID, Info, auto
from strawberry.file_uploads import Upload
from strawberry_django.filters import filter

from .models import (
    ClientContact,
    ClientHouseholdMember,
    ClientProfile,
    ClientProfileDataImport,
    ClientProfileImportRecord,
    HmisProfile,
    SocialMediaProfile,
)

MIN_INTERACTED_AGO_FOR_ACTIVE_STATUS = dict(days=90)
CLIENT_DOCUMENT_NAMESPACE_GROUPS = {
    ClientDocumentGroupEnum.DOC_READY: [
        ClientDocumentNamespaceEnum.DRIVERS_LICENSE_FRONT,
        ClientDocumentNamespaceEnum.DRIVERS_LICENSE_BACK,
        ClientDocumentNamespaceEnum.PHOTO_ID,
        ClientDocumentNamespaceEnum.BIRTH_CERTIFICATE,
        ClientDocumentNamespaceEnum.SOCIAL_SECURITY_CARD,
        ClientDocumentNamespaceEnum.OTHER_DOC_READY,
    ],
    ClientDocumentGroupEnum.FORMS: [
        ClientDocumentNamespaceEnum.CONSENT_FORM,
        ClientDocumentNamespaceEnum.HMIS_FORM,
        ClientDocumentNamespaceEnum.INCOME_FORM,
        ClientDocumentNamespaceEnum.OTHER_FORM,
    ],
    ClientDocumentGroupEnum.OTHER: [
        ClientDocumentNamespaceEnum.OTHER_CLIENT_DOCUMENT,
    ],
}


@filter(Attachment)
class ClientDocumentFilter:
    @strawberry_django.filter_field
    def document_groups(
        self,
        queryset: QuerySet[Attachment],
        info: Info,
        value: Optional[List[ClientDocumentGroupEnum]],
        prefix: str,
    ) -> Tuple[QuerySet[Attachment], Q]:
        if not value:
            return queryset, Q()

        namespaces = [ns.value for group in value for ns in CLIENT_DOCUMENT_NAMESPACE_GROUPS[group]]

        return queryset.filter(namespace__in=namespaces), Q()


@strawberry_django.type(Attachment, pagination=True, filters=ClientDocumentFilter)
class ClientDocumentType(AttachmentInterface):
    namespace: ClientDocumentNamespaceEnum


@strawberry_django.input(Attachment)
class CreateClientDocumentInput:
    client_profile: ID
    file: Upload
    namespace: ClientDocumentNamespaceEnum


@strawberry_django.ordering.order(ClientProfile)
class ClientProfileOrder:
    first_name: auto
    last_name: auto
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
            queryset.alias(last_interacted_at=Max("client_profile_notes__interacted_at")),
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

        search_terms = value.split()

        searchable_fields = [
            "california_id",
            "first_name",
            "last_name",
            "middle_name",
            "nickname",
        ]

        # Build queries for direct fields
        direct_queries = [
            reduce(or_, [Q(**{f"{field}__istartswith": term}) for field in searchable_fields]) for term in search_terms
        ]
        direct_query = reduce(and_, direct_queries) if direct_queries else Q()

        # Build related queries
        related_query = reduce(
            and_,
            [
                Exists(HmisProfile.objects.filter(client_profile_id=OuterRef("pk"), hmis_id__istartswith=term))
                for term in search_terms
            ],
            Q(),
        )

        combined_query = direct_query | related_query

        return queryset.filter(combined_query), Q()

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

        search_fields = ["california_id", "first_name", "middle_name", "last_name"]

        for field in search_fields:
            if field_value := (getattr(value, field) or "").strip():
                filters[f"{field}__iexact"] = field_value

        if not filters:
            return (queryset.none(), Q())

        queryset = queryset.filter(**filters)

        if excluded_id := value.excluded_client_profile_id:
            queryset = queryset.exclude(id=excluded_id)

        return (queryset, Q())


@strawberry_django.type(HmisProfile)
class HmisProfileBaseType:
    hmis_id: NonBlankString | None
    agency: auto


@strawberry_django.type(HmisProfile)
class HmisProfileType(HmisProfileBaseType):
    id: auto


@strawberry_django.input(HmisProfile)
class HmisProfileInput(HmisProfileBaseType):
    id: ID | None
    client_profile: ID | None


@strawberry_django.type(SocialMediaProfile)
class SocialMediaProfileBaseType:
    id: Optional[ID]
    client_profile: auto
    platform: auto


@strawberry_django.type(SocialMediaProfile)
class SocialMediaProfileType(SocialMediaProfileBaseType):
    platform_user_id: NonBlankString


@strawberry_django.input(SocialMediaProfile, partial=True)
class SocialMediaProfileInput(SocialMediaProfileBaseType):
    client_profile: ID | None
    platform_user_id: NonBlankString | None


@strawberry.input
class ClientProfilePhotoInput:
    client_profile: ID
    photo: Upload


@strawberry_django.type(ClientContact)
class ClientContactBaseType:
    name: auto
    email: auto
    mailing_address: auto
    phone_number: PhoneNumberScalar | None  # type: ignore
    relationship_to_client: auto
    relationship_to_client_other: auto


@strawberry_django.type(ClientContact)
class ClientContactType(ClientContactBaseType):
    id: ID
    client_profile: auto
    updated_at: auto


@strawberry_django.input(ClientContact, partial=True)
class ClientContactInput(ClientContactBaseType):
    id: ID | None
    client_profile: ID | None


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
    client_profile: ID | None


@strawberry_django.type(ClientProfile)
class ClientProfileBaseType:
    ada_accommodation: Optional[List[AdaAccommodationEnum]]
    address: auto
    age: auto
    california_id: auto
    date_of_birth: auto
    email: Optional[NonBlankString]
    eye_color: auto
    first_name: Optional[NonBlankString]
    gender: auto
    gender_other: auto
    hair_color: auto
    height_in_inches: auto
    important_notes: auto
    last_name: Optional[NonBlankString]
    living_situation: Optional[LivingSituationEnum]
    mailing_address: auto
    marital_status: auto
    middle_name: Optional[NonBlankString]
    nickname: Optional[NonBlankString]
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
    residence_geolocation: auto
    spoken_languages: Optional[List[LanguageEnum]]
    veteran_status: auto


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


@strawberry_django.input(ClientProfile, partial=True)
class UpdateClientProfileInput(ClientProfileBaseType):
    id: ID
    contacts: Optional[List[ClientContactInput]]
    hmis_profiles: Optional[List[HmisProfileInput]]
    household_members: Optional[List[ClientHouseholdMemberInput]]
    phone_numbers: Optional[List[PhoneNumberInput]]
    social_media_profiles: Optional[List[SocialMediaProfileInput]]


# Data Import
@strawberry.input
class ClientProfileImportRecordsBulkInput:
    source: str
    sourceIds: List[str]


@strawberry_django.type(ClientProfileDataImport)
class ClientProfileDataImportType:
    id: auto
    imported_at: auto
    source_file: auto
    notes: auto
    imported_by: auto


@strawberry_django.type(ClientProfileImportRecord)
class ClientProfileImportRecordType:
    id: auto
    source_id: auto
    source_name: auto
    success: auto
    error_message: auto
    created_at: auto
    client_profile: Optional[ClientProfileType]
    raw_data: auto


@strawberry_django.input(ClientProfileDataImport)
class CreateProfileDataImportInput:
    source_file: auto
    notes: auto


@strawberry_django.input(ClientProfileImportRecord)
class ImportClientProfileInput:
    import_job_id: auto
    source_id: auto
    source_name: auto
    raw_data: auto
    client_profile: CreateClientProfileInput


# Input for updating a client document
@strawberry_django.input(Attachment)
class UpdateClientDocumentInput:
    id: ID
    original_filename: auto
