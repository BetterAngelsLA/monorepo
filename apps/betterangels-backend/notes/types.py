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
from notes.enums import ServiceRequestTypeEnum
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
    status: auto
    due_by: auto
    completed_on: auto
    client_profile: ClientProfileType | None
    created_by: UserType
    created_at: auto


@strawberry_django.input(models.ServiceRequest)
class CreateServiceRequestInput:
    service_id: Optional[ID]
    status: auto
    service_other: Optional[str]
    client_profile: ID | None


@strawberry_django.input(models.ServiceRequest)
class CreateNoteServiceRequestInput:
    service_id: Optional[ID]
    service_other: Optional[str]
    note_id: ID
    service_request_type: ServiceRequestTypeEnum


@strawberry_django.input(models.ServiceRequest, partial=True)
class UpdateServiceRequestInput:
    id: ID
    service_other: Optional[str]
    status: auto
    due_by: auto


@strawberry.input
class RemoveNoteServiceRequestInput:
    service_request_id: ID
    note_id: ID
    service_request_type: ServiceRequestTypeEnum


@strawberry_django.order_type(models.Note, one_of=False)
class NoteOrder:
    id: auto
    interacted_at: auto


@strawberry_django.filter_type(models.Note)
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


# --- Nested inputs for note creation/update ---


@strawberry.input
class CreateNoteServiceInput:
    """A service to attach to a note (either by existing service ID or custom 'other' label)."""

    service_id: Optional[ID] = None
    service_other: Optional[str] = None


@strawberry.input
class CreateNoteTaskInput:
    """A task to create and attach to the note."""

    summary: str
    description: Optional[str] = None
    status: Optional[int] = None  # Task.Status int choices (0=TO_DO, 1=IN_PROGRESS, 2=COMPLETED)
    team: Optional[SelahTeamEnum] = None


@strawberry.input
class UpdateNoteInput:
    """
    Input for updating a note with all nested relations.
    Fields set to UNSET are left unchanged. Nested relation fields
    use replace-all semantics (existing items are removed, new ones created).

    For location updates:
    - `location` (ID): Reference an existing Location by ID (backward compatible)
    - `location_data` (LocationInput): Create/update location inline with nested data
    If both are provided, `location_data` takes precedence.
    """

    id: ID
    purpose: Optional[NonBlankString] = strawberry.UNSET  # type: ignore[assignment]
    team: Optional[SelahTeamEnum] = strawberry.UNSET  # type: ignore[assignment]
    public_details: Optional[str] = strawberry.UNSET  # type: ignore[assignment]
    private_details: Optional[str] = strawberry.UNSET  # type: ignore[assignment]
    is_submitted: Optional[bool] = strawberry.UNSET  # type: ignore[assignment]
    interacted_at: Optional[datetime] = strawberry.UNSET  # type: ignore[assignment]

    # Location: ID for FK reference (backward compat), location_data for inline creation
    location: Optional[ID] = strawberry.UNSET  # type: ignore[assignment]
    location_data: Optional[LocationInput] = strawberry.UNSET  # type: ignore[assignment]

    # Nested relations (replace-all when provided)
    provided_services: Optional[List[CreateNoteServiceInput]] = strawberry.UNSET  # type: ignore[assignment]
    requested_services: Optional[List[CreateNoteServiceInput]] = strawberry.UNSET  # type: ignore[assignment]
    tasks: Optional[List[CreateNoteTaskInput]] = strawberry.UNSET  # type: ignore[assignment]


@strawberry_django.input(models.Note)
class UpdateNoteLocationInput:
    id: ID
    location: LocationInput


@strawberry_django.input(models.Note)
class RevertNoteInput:
    id: ID
    revert_before_timestamp: datetime


@strawberry.input
class CreateNoteInput:
    """
    Input for creating a note with all nested relations atomically.
    All nested fields are optional, making this backward-compatible
    with callers that only send core note fields.
    """

    # Core note fields
    purpose: Optional[str] = None
    team: Optional[SelahTeamEnum] = None
    public_details: Optional[str] = ""
    private_details: Optional[str] = ""
    client_profile: Optional[ID] = None
    is_submitted: Optional[bool] = False
    interacted_at: Optional[datetime] = None

    # Nested relations
    location: Optional[LocationInput] = None
    provided_services: Optional[List[CreateNoteServiceInput]] = None
    requested_services: Optional[List[CreateNoteServiceInput]] = None
    tasks: Optional[List[CreateNoteTaskInput]] = None


@strawberry_django.filter_type(User)
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
    ordering=InteractionAuthorOrder,
)
class InteractionAuthorType:
    id: ID
    first_name: auto
    last_name: auto
    middle_name: auto

    @classmethod
    def get_queryset(cls, queryset: QuerySet[User], info: Info) -> QuerySet[User]:
        # TODO: Make unit test for this function
        authorized_permission_groups = [template.value for template in GroupTemplateNames]

        # Subquery to check if the user has any related permission group in an authorized group
        permission_group_exists = PermissionGroup.objects.filter(
            organization__users=OuterRef("pk"),  # Matches `User` to `Organization`
            template__name__in=authorized_permission_groups,
        )

        # Use Exists to avoid duplicate users without `distinct()`
        return queryset.filter(Exists(permission_group_exists))


# Data Import


@strawberry_django.input(models.Note)
class ImportNoteDataInput:
    """Core note fields used by the import pipeline."""

    purpose: auto
    team: Optional[SelahTeamEnum]
    public_details: auto
    private_details: auto
    client_profile: ID | None
    is_submitted: auto
    interacted_at: auto


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
    note: ImportNoteDataInput


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
