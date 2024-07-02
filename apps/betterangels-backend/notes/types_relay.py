from typing import Optional

import strawberry_django
from accounts.types import UserType
from common.graphql.types import LocationType
from django.db.models import Case, Exists, F, Value, When
from notes.permissions import PrivateDetailsPermissions
from strawberry import auto, relay
from strawberry_django.utils.query import filter_for_user

from . import models
from .types import (
    MoodType,
    NoteAttachmentType,
    NoteFilter,
    NoteOrder,
    ServiceRequestType,
    TaskType,
)


@strawberry_django.type(models.Note, pagination=True, filters=NoteFilter, order=NoteOrder)  # type: ignore[literal-required]
class InteractionType(relay.Node):
    title: auto
    location: Optional[LocationType]
    attachments: list[NoteAttachmentType]
    moods: list[MoodType]
    purposes: list[TaskType]
    next_steps: list[TaskType]
    provided_services: list[ServiceRequestType]
    requested_services: list[ServiceRequestType]
    public_details: auto
    is_submitted: auto
    client: Optional[UserType]
    created_at: auto
    created_by: UserType
    interacted_at: auto

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
