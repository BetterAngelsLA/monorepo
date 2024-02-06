from dataclasses import asdict
from typing import List, cast

import strawberry
import strawberry_django
from accounts.groups import GroupTemplateNames
from accounts.models import PermissionGroup
from common.graphql.types import DeleteDjangoObjectInput
from django.db.models import Subquery
from guardian.shortcuts import assign_perm
from notes.permissions import NotePermissions, PrivateNotePermissions
from organizations.models import Organization
from strawberry.types import Info
from strawberry_django import mutations
from strawberry_django.auth.utils import get_current_user
from strawberry_django.permissions import HasPerm, HasRetvalPerm

from .models import Note
from .types import CreateNoteInput, NoteType, UpdateNoteInput


@strawberry.type
class Query:
    note: NoteType = strawberry_django.field(
        extensions=[HasPerm(perms=[NotePermissions.VIEW])]
    )

    notes: List[NoteType] = strawberry_django.field(
        extensions=[HasPerm(perms=[NotePermissions.VIEW])]
    )


@strawberry.type
class Mutation:
    @strawberry.mutation(extensions=[HasPerm(perms=[NotePermissions.ADD])])
    def create_note(self, info: Info, data: CreateNoteInput) -> NoteType:
        user = get_current_user(info)

        # WARNING: Temporary workaround for organization selection
        # TODO: Update once organization selection is implemented. Currently selects the
        # first organization with a default Caseworker role for the user.
        first_org_id = (
            Organization.objects.filter(users=user).order_by("id").values("id")[:1]
        )
        permission_group = (
            PermissionGroup.objects.filter(
                organization_id__in=Subquery(first_org_id),
                name=GroupTemplateNames.CASEWORKER,
            )
            .select_related("group")
            .first()
        )

        if not (permission_group and permission_group.group):
            raise UserWarning("User lacks proper organization or permissions")

        note = mutations.resolvers.create(
            info,
            Note,
            {
                **asdict(data),
                "created_by": user,
                "organization": permission_group.organization,
            },
        )

        permissions = [
            NotePermissions.CHANGE,
            NotePermissions.DELETE,
            PrivateNotePermissions.VIEW,
        ]
        for perm in permissions:
            assign_perm(perm, permission_group.group, note)

        return cast(NoteType, note)

    update_note: NoteType = mutations.update(
        UpdateNoteInput, extensions=[HasRetvalPerm(perms=[NotePermissions.CHANGE])]
    )

    delete_note: NoteType = mutations.delete(
        DeleteDjangoObjectInput,
        extensions=[HasRetvalPerm(perms=[NotePermissions.DELETE])],
    )
