from dataclasses import asdict
from typing import List, cast

import strawberry
import strawberry_django
from common.graphql.types import DeleteDjangoObjectInput
from guardian.shortcuts import assign_perm
from notes.permissions import NotePermissions
from strawberry.types import Info
from strawberry_django import mutations
from strawberry_django.auth.utils import get_current_user
from strawberry_django.mutations import resolvers
from strawberry_django.permissions import HasPerm, HasRetvalPerm

from .models import Note
from .types import CreateNoteInput, NoteType, UpdateNoteInput


@strawberry.type
class Query:
    note: NoteType = strawberry_django.field(
        extensions=[
            HasRetvalPerm(perms=[NotePermissions.VIEW]),
        ],
    )

    notes: List[NoteType] = strawberry_django.field(
        extensions=[
            # As of 1-24-2024 we are unable to apply HasRetvalPerm to a paginated list.
            # Instead we enforce permissions within get_queryset on NoteType.
        ],
        pagination=True,
    )


@strawberry.type
class Mutation:
    @strawberry_django.mutation(extensions=[HasPerm(NotePermissions.ADD)])
    def create_note(self, info: Info, data: CreateNoteInput) -> NoteType:
        user = get_current_user(info)

        # WARNING: Temporary workaround for organization selection
        # TODO: Update once organization selection is implemented. Currently selects the
        # first organization a user is apart of.
        organization = user.organizations_organization.order_by("id").first()

        note = resolvers.create(
            info,
            Note,
            {**asdict(data), "created_by": user, "organization": organization},
        )
        # Assign object-level permissions to the user who created the note.
        # Each perm assignment is 2 SQL queries. Maybe move to 1 perm?
        for perm in [
            NotePermissions.VIEW,
            NotePermissions.CHANGE,
            NotePermissions.DELETE,
        ]:
            assign_perm(perm, user, note)
        return cast(NoteType, note)

    update_note: NoteType = mutations.update(
        UpdateNoteInput,
        extensions=[
            HasRetvalPerm(perms=[NotePermissions.CHANGE]),
        ],
    )

    delete_note: NoteType = mutations.delete(
        DeleteDjangoObjectInput,
        extensions=[
            HasRetvalPerm(perms=[NotePermissions.DELETE]),
        ],
    )
