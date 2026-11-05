from typing import Optional, cast

import strawberry
import strawberry_django
from django.core.exceptions import PermissionDenied
from strawberry import UNSET, asdict
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.pagination import OffsetPaginated
from strawberry_django.permissions import HasPerm

from accounts.models import User
from accounts.selectors import resolve_permission_group
from clients.models import ClientProfile
from common.constants import HMIS_SESSION_KEY_NAME
from common.graphql.permission_checkers import can_anywhere_checker
from common.graphql.types import DeleteDjangoObjectInput, DeletedObjectType
from common.graphql.utils import org_or_deny
from common.permissions.selectors import can_obj
from common.permissions.utils import PERMISSION_DENIED_MESSAGE, IsAuthenticated, require_can
from common.utils import get_or_none
from hmis.models import HmisClientProfile, HmisNote
from notes.groups import CASEWORKER
from notes.models import Note
from tasks.models import Task
from tasks.services import task_create, task_create_legacy, task_delete, task_update

from .types import CreateTaskInput, TaskAssigneeType, TaskOrder, TaskType, UpdateTaskInput


@strawberry.type
class Query:
    task: TaskType = strawberry_django.field(
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(Task.perms.VIEW, perm_checker=can_anywhere_checker, fail_silently=False)],
    )

    task_assignees: OffsetPaginated[TaskAssigneeType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
        # Add *or* change: the picker is used both when creating a task and when
        # editing one, and editing only requires `tasks.change`. Gating on add
        # alone left a change-only role staring at an empty sheet.
        extensions=[HasPerm([Task.perms.ADD, Task.perms.CHANGE])],
        description=(
            "Members the caller can assign a task to. Gated on tasks.add or "
            "tasks.change rather than organizations.view_org_members so a "
            "caseworker can pick an assignee without holding the org-admin "
            "roster permission."
        ),
    )

    @strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
        # SHARED read (RFC 0003): a holder sees every task, a non-holder gets an
        # empty page — the legacy guardian-prefilter shape, kept for parity.
        # Same declarative pattern as the client family (RFC 0002).
        extensions=[HasPerm(perms=[Task.perms.VIEW], perm_checker=can_anywhere_checker, fail_silently=True)],
    )
    def tasks(self, info: Info, ordering: Optional[list[TaskOrder]] = None) -> OffsetPaginated[TaskType]:
        request = info.context["request"]
        session = request.session
        is_hmis_user = bool(session.get(HMIS_SESSION_KEY_NAME, False))

        return Task.objects.tasks_for_user(is_hmis_user)  # type: ignore


@strawberry.type
class Mutation:
    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def create_task(self, info: Info, data: CreateTaskInput) -> TaskType:
        current_user = cast(User, get_current_user(info))

        task_data = asdict(data)
        organization_id = task_data.pop("organization_id", None)

        # Resolve FK references
        note = None
        if note_id := task_data.pop("note", None):
            note = Note.objects.get(pk=str(note_id))

        hmis_note = None
        if hmis_note_id := task_data.pop("hmis_note", None):
            hmis_note = HmisNote.objects.get(pk=str(hmis_note_id))

        client_profile = None
        if client_profile_id := task_data.pop("client_profile", None):
            client_profile = ClientProfile.objects.get(pk=str(client_profile_id))

        hmis_client_profile = None
        if hmis_client_profile_id := task_data.pop("hmis_client_profile", None):
            hmis_client_profile = HmisClientProfile.objects.get(pk=str(hmis_client_profile_id))

        if organization_id is not None and organization_id is not UNSET:
            # Payload-scoped grant authority (ADR 0001 §5, RFC 0003 slice 1).
            organization = org_or_deny(organization_id)
            require_can(current_user, Task.perms.ADD, org=organization)

            tasks = task_create(
                user=current_user,
                organization=organization,
                data=[task_data],
                note=note,
                hmis_note=hmis_note,
                client_profile=client_profile,
                hmis_client_profile=hmis_client_profile,
            )
        else:
            # Compat window: a build that predates the payload org creates
            # through its legacy ``CASEWORKER`` group — the org comes from the
            # group, as before the cutover.  Dropped by the strict flip once
            # the build sending ``organizationId`` is deployed.
            try:
                permission_group = resolve_permission_group(current_user, template=CASEWORKER)
            except PermissionError as exc:
                # ``resolve_permission_group`` raises the builtin ``PermissionError``,
                # which the mutation wrapper does not translate — a pre-wiring build
                # would get ``data: null`` plus an internal message instead of the
                # ``OperationInfo`` it knows how to read.
                raise PermissionDenied(PERMISSION_DENIED_MESSAGE) from exc

            tasks = task_create_legacy(
                user=current_user,
                permission_group=permission_group,
                data=[task_data],
                note=note,
                hmis_note=hmis_note,
                client_profile=client_profile,
                hmis_client_profile=hmis_client_profile,
            )

        return cast(TaskType, tasks[0])

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def update_task(self, info: Info, data: UpdateTaskInput) -> TaskType:
        user = cast(User, get_current_user(info))

        task = get_or_none(Task.objects.all(), data.id)
        # One refusal for missing and forbidden rows — no existence oracle.
        if task is None or not can_obj(user, Task.perms.CHANGE, task):
            raise PermissionDenied(PERMISSION_DENIED_MESSAGE)

        clean = asdict(data)

        task = task_update(task=task, data=clean)

        return cast(TaskType, task)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def delete_task(self, info: Info, data: DeleteDjangoObjectInput) -> DeletedObjectType:
        user = cast(User, get_current_user(info))

        task = get_or_none(Task.objects.all(), data.id)
        # One refusal for missing and forbidden rows — no existence oracle.
        if task is None or not can_obj(user, Task.perms.DELETE, task):
            raise PermissionDenied(PERMISSION_DENIED_MESSAGE)

        deleted_id = task_delete(task=task)

        return DeletedObjectType(id=deleted_id)
