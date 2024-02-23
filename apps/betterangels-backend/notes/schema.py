from dataclasses import asdict
from typing import List, cast

import strawberry
import strawberry_django
from accounts.groups import GroupTemplateNames
from accounts.models import PermissionGroup, User
from common.graphql.types import DeleteDjangoObjectInput
from django.db import transaction
from guardian.shortcuts import assign_perm
from notes.models import Note
from notes.permissions import NotePermissions, PrivateNotePermissions
from strawberry.types import Info
from strawberry_django import mutations
from strawberry_django.auth.utils import get_current_user
from strawberry_django.mutations import resolvers
from strawberry_django.permissions import HasPerm, HasRetvalPerm

from .types import CreateNoteInput, NoteType, UpdateNoteInput


@strawberry.type
class Query:
    note: NoteType = strawberry_django.field(
        extensions=[HasPerm(NotePermissions.VIEW)],
    )

    notes: List[NoteType] = strawberry_django.field(
        extensions=[HasRetvalPerm(NotePermissions.VIEW)],
    )


@strawberry.type
class Mutation:
    # Notes
    @strawberry_django.mutation(extensions=[HasPerm(NotePermissions.ADD)])
    def create_note(self, info: Info, data: CreateNoteInput) -> NoteType:
        user = get_current_user(info)
        # TODO: Handle creating Notes without existing Client.
        # if not data.client:
        #     User.create_client()

        # WARNING: Temporary workaround for organization selection
        # TODO: Update once organization selection is implemented. Currently selects the
        # first organization a user is apart of.
        organization = user.organizations_organization.order_by("id").first()
        client_id = data.client.id if data.client else None

        note = Note.objects.create(
            title=data.title,
            public_details=data.public_details,
            created_by=user,
            client_id=client_id,
            organization=organization,
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
            HasRetvalPerm(perms=NotePermissions.DELETE),
        ],
    )
