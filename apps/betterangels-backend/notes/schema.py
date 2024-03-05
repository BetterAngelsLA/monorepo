from dataclasses import asdict
from typing import List, cast
from datetime import timedelta

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

from .types import CreateNoteInput, NoteType, UpdateNoteInput, RevertNoteVersionInput


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
        with transaction.atomic():
            user = get_current_user(info)
            # TODO: Handle creating Notes without existing Client.
            # if not data.client:
            #     User.create_client()

            # WARNING: Temporary workaround for organization selection
            # TODO: Update once organization selection is implemented. Currently selects
            # the first organization with a default Caseworker role for the user.
            permission_group = (
                PermissionGroup.objects.select_related("organization", "group")
                .filter(
                    organization__users=user,
                    name=GroupTemplateNames.CASEWORKER,
                )
                .first()
            )

            if not (permission_group and permission_group.group):
                raise PermissionError("User lacks proper organization or permissions")

            client = User(id=data.client.id) if data.client else None
            note_data = asdict(data)
            note = resolvers.create(
                info,
                Note,
                {
                    **note_data,
                    "created_by": user,
                    "client": client,
                    "organization": permission_group.organization,
                },
            )

            # Assign object-level permissions to the user who created the note.
            # Each perm assignment is 2 SQL queries. Maybe move to 1 perm?
            permissions = [
                NotePermissions.CHANGE,
                NotePermissions.DELETE,
                PrivateNotePermissions.VIEW,
            ]
            for perm in permissions:
                assign_perm(perm, permission_group.group, note)

            return cast(NoteType, note)

    @strawberry_django.mutation(extensions=[HasRetvalPerm(NotePermissions.CHANGE)])
    def revert_note_version(
        self, info: Info, data: RevertNoteVersionInput
    ) -> NoteType:
        historical_as_of = Note.history.model.objects.get(id=data.id, history_id=data.history_id).history_date
        # TODO: The way to handle this without having to add a 1 second delay would be to
        # modify the updateNote mutation to be a custom function within an atomic block, and pass the "update_at"
        # field directly to the Note instance and related model instances.
        historical_as_of +=  timedelta(seconds=1)
        revert_to_note = Note.objects.get(id=data.id).history.as_of(historical_as_of)
        # saving a historical note reverts the current note object to this moment in history
        revert_to_note.save()

        return cast(NoteType, revert_to_note)

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
