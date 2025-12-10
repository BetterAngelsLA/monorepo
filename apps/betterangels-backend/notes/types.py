from datetime import datetime
from typing import List, Optional

import strawberry
import strawberry_django
from accounts.groups import GroupTemplateNames
from accounts.models import PermissionGroup, User
from accounts.types import OrganizationType, UserType
from clients.types import ClientProfileType
from common.enums import SelahTeamEnum
from common.graphql.types import (
    LocationInput,
    LocationType,
    NonBlankString,
    make_in_filter,
)
from django.db.models import (
    BooleanField,
    Case,
    Exists,
    F,
    OuterRef,
    Q,
    QuerySet,
    Value,
    When,
)
from notes.enums import ServiceEnum, ServiceRequestTypeEnum
from notes.permissions import NotePermissions, PrivateDetailsPermissions
from strawberry import ID, Info, auto
from strawberry_django.utils.query import filter_for_user
from tasks.types import TaskType

from . import models


@strawberry_django.order_type(models.OrganizationService, one_of=False)
class OrganizationServiceOrdering:
    id: auto
    priority: auto


@strawberry_django.order_type(models.OrganizationServiceCategory, one_of=False)
class OrganizationServiceCategoryOrdering:
    id: auto
    priority: auto


@strawberry_django.type(
    models.OrganizationService,
    pagination=True,
    ordering=OrganizationServiceOrdering,
)
class OrganizationServiceType:
    id: auto
    category: Optional["OrganizationServiceCategoryType"]
    priority: auto
    label: auto


@strawberry_django.type(
    models.OrganizationServiceCategory,
    pagination=True,
    ordering=OrganizationServiceCategoryOrdering,
)
class OrganizationServiceCategoryType:
    id: auto
    name: auto
    priority: auto
    services: list[OrganizationServiceType]


@strawberry_django.type(models.ServiceRequest, pagination=True)
class ServiceRequestType:
    id: ID
    service: Optional[OrganizationServiceType]
    service_enum: auto
    service_other: auto
    status: auto
    due_by: auto
    completed_on: auto
    client_profile: ClientProfileType | None
    created_by: UserType
    created_at: auto


@strawberry_django.input(models.ServiceRequest)
class CreateServiceRequestInput:
    service_id: Optional[ID]
    service_enum: Optional[ServiceEnum]
    status: auto
    service_other: auto
    client_profile: ID | None


@strawberry_django.input(models.ServiceRequest)
class CreateNoteServiceRequestInput:
    service_id: Optional[ID]
    service_enum: Optional[ServiceEnum]
    service_other: Optional[str]
    note_id: ID
    service_request_type: ServiceRequestTypeEnum


@strawberry_django.input(models.ServiceRequest, partial=True)
class UpdateServiceRequestInput:
    id: ID
    service_other: auto
    status: auto
    due_by: auto


@strawberry_django.type(models.Mood)
class MoodType:
    id: ID
    descriptor: auto


@strawberry.input
class RemoveNoteServiceRequestInput:
    service_request_id: ID
    note_id: ID
    service_request_type: ServiceRequestTypeEnum


@strawberry_django.input(models.Mood)
class CreateNoteMoodInput:
    descriptor: auto
    note_id: ID


@strawberry_django.order_type(models.Note, one_of=False)
class NoteOrder:
    id: auto
    interacted_at: auto


@strawberry_django.filter(models.Note)
class NoteFilter:
    client_profile: ID | None
    created_by: ID | None
    is_submitted: auto

    authors = make_in_filter("created_by", ID)
    organizations = make_in_filter("organization", ID)
    teams = make_in_filter("team", SelahTeamEnum)

    @strawberry_django.filter_field
    def search(self, queryset: QuerySet, info: Info, value: Optional[str], prefix: str) -> Q:
        if value is None:
            return Q()

        search_terms = value.split()
        query = Q()

        for term in search_terms:
            q_search = Q(
                Q(client_profile__first_name__icontains=term)
                | Q(client_profile__last_name__icontains=term)
                | Q(public_details__icontains=term)
            )

            query &= q_search

        return Q(query)


@strawberry_django.type(
    models.Note,
    pagination=True,
    filters=NoteFilter,
    order=NoteOrder,  # type: ignore[literal-required]
    ordering=NoteOrder,
)
class NoteType:
    id: ID
    client_profile: Optional[ClientProfileType]
    created_at: auto
    created_by: Optional[UserType]
    interacted_at: auto
    is_submitted: auto
    location: Optional[LocationType]
    moods: List[MoodType]
    organization: OrganizationType
    provided_services: List[ServiceRequestType]
    public_details: auto
    purpose: auto
    requested_services: List[ServiceRequestType]
    tasks: list[TaskType]
    team: Optional[SelahTeamEnum]

    @strawberry_django.field(
        annotate={
            "_can_edit": lambda info: Case(
                When(
                    Exists(
                        filter_for_user(
                            models.Note.objects.all(),
                            info.context.request.user,
                            [NotePermissions.CHANGE],
                        ).filter(pk=OuterRef("pk"))
                    ),
                    then=Value(True),
                ),
                default=Value(False),
                output_field=BooleanField(),
            ),
        }
    )
    def user_can_edit(self, root: models.Note) -> bool:
        return bool(getattr(root, "_can_edit", False))

    @strawberry_django.field(
        annotate={
            "_private_details": lambda info: Case(
                When(
                    Exists(
                        filter_for_user(
                            models.Note.objects.all(),
                            info.context.request.user,
                            [PrivateDetailsPermissions.VIEW],
                        )
                    ),
                    then=F("private_details"),
                ),
                default=Value(None),
            ),
        }
    )
    def private_details(self, root: models.Note) -> Optional[str]:
        return root._private_details


@strawberry_django.input(models.Note)
class CreateNoteInput:
    purpose: auto
    team: Optional[SelahTeamEnum]
    public_details: auto
    private_details: auto
    client_profile: ID | None
    is_submitted: auto
    interacted_at: auto


@strawberry_django.input(models.Note, partial=True)
class UpdateNoteInput:
    id: ID
    purpose: Optional[NonBlankString]
    team: Optional[SelahTeamEnum]
    location: Optional[ID]
    public_details: auto
    private_details: auto
    is_submitted: auto
    interacted_at: auto


@strawberry_django.input(models.Note)
class UpdateNoteLocationInput:
    id: ID
    location: LocationInput


@strawberry_django.input(models.Note)
class RevertNoteInput:
    id: ID
    revert_before_timestamp: datetime


@strawberry_django.filter(User)
class InteractionAuthorFilter:
    @strawberry_django.filter_field
    def search(self, queryset: QuerySet, info: Info, value: Optional[str], prefix: str) -> Q:
        if value is None:
            return Q()

        search_terms = value.split()
        query = Q()

        for term in search_terms:
            q_search = Q(Q(first_name__icontains=term) | Q(last_name__icontains=term) | Q(middle_name__icontains=term))

            query &= q_search

        return Q(query)


@strawberry_django.order_type(User, one_of=False)
class InteractionAuthorOrder:
    first_name: auto
    last_name: auto
    id: auto


@strawberry_django.type(
    User,
    filters=InteractionAuthorFilter,
    order=InteractionAuthorOrder,  # type: ignore[literal-required]
    ordering=InteractionAuthorOrder,
)
class InteractionAuthorType:
    id: ID
    first_name: auto
    last_name: auto
    middle_name: auto

    def get_queryset(self, info: Info) -> QuerySet[User]:
        # TODO: Make unit test for this function
        authorized_permission_groups = [template.value for template in GroupTemplateNames]

        # Subquery to check if the user has any related permission group in an authorized group
        permission_group_exists = PermissionGroup.objects.filter(
            organization__users=OuterRef("pk"),  # Matches `User` to `Organization`
            template__name__in=authorized_permission_groups,
        )

        # Use Exists to avoid duplicate users without `distinct()`
        return User.objects.filter(Exists(permission_group_exists))


# Data Import
@strawberry_django.input(models.NoteDataImport)
class CreateNoteDataImportInput:
    source_file: str
    notes: str


@strawberry_django.input(models.NoteImportRecord)
class ImportNoteInput:
    import_job_id: auto
    source_id: auto
    source_name: auto
    raw_data: auto
    note: CreateNoteInput


# Output types for note import
@strawberry_django.type(models.NoteDataImport)
class NoteDataImportType:
    id: auto
    imported_at: auto
    source_file: auto
    notes: auto
    imported_by: auto


@strawberry_django.type(models.NoteImportRecord)
class NoteImportRecordType:
    id: auto
    source_id: auto
    source_name: auto
    success: auto
    error_message: auto
    created_at: auto
    note: Optional[NoteType]
    raw_data: auto
