"""GraphQL surface for the object audit log (ADR 0004 §18, §21)."""

from typing import Annotated, Optional, assert_never, cast

import strawberry
from graphql import GraphQLError
from strawberry import ID, Info
from strawberry_django.auth.utils import get_current_user

from accounts.models import User as AccountUser
from common.permissions.selectors import can
from common.permissions.utils import IsAuthenticated
from shelters.models import Bed, Room, Shelter
from shelters.permissions import BA_REVIEW_FIELDS, can_view_ba_review
from shelters.selectors.operator import bed_get, room_get, shelter_get

from .selectors import object_audit_actors as select_object_audit_actors
from .selectors import object_audit_log as select_object_audit_log
from .types import (
    AuditActionPage,
    AuditActorType,
    AuditEventFilter,
    AuditTargetType,
    to_action_page,
)


def _resolve_target(user: AccountUser, target_type: AuditTargetType, object_id: ID) -> object:
    """Resolve the requested object with ``VIEW``, failing closed (§18).

    Every helper is reach-scoped by the caller's grants, so a cross-org or
    missing id raises ``ObjectDoesNotExist`` — indistinguishable, never leaked.
    """
    if target_type is AuditTargetType.SHELTER:
        return shelter_get(user=user, shelter_id=object_id, permission=Shelter.perms.VIEW)
    if target_type is AuditTargetType.ROOM:
        return room_get(user=user, room_id=object_id, permission=Room.perms.VIEW)
    if target_type is AuditTargetType.BED:
        return bed_get(user=user, bed_id=object_id, permission=Bed.perms.VIEW)
    # No RESERVATION branch while ``AuditTargetType`` omits it (§32). Adding the
    # enum member fails this check at type-check time, which is the reminder to
    # restore ``reservation_get`` (the selector path is already retained).
    assert_never(target_type)


def _hidden_summary_models(user: AccountUser, target_type: AuditTargetType, obj: object) -> frozenset[str]:
    """Bed/Room summary models the caller may not see in *obj*'s log.

    Shared by ``objectAuditLog`` and ``objectAuditActors`` so an actor whose only
    events are withheld summaries disappears from the actor list too.
    """
    if target_type is not AuditTargetType.SHELTER:
        return frozenset()
    shelter = cast(Shelter, obj)
    # ``can`` is row-independent on purpose: a shelter with no current beds (or
    # only deleted-bed events) must still hide the summaries. ``visible(...)``
    # would tie the answer to today's rows.
    return frozenset(
        model._meta.label for model in (Bed, Room) if not can(user, model.perms.VIEW, org=shelter.organization_id)
    )


@strawberry.type
class Query:
    @strawberry.field(
        permission_classes=[IsAuthenticated],
        description="One cursor page of one object's write audit log, newest action first.",
    )
    def object_audit_log(
        self,
        info: Info,
        target_type: AuditTargetType,
        object_id: ID,
        filters: Optional[AuditEventFilter] = None,
        after: Optional[str] = None,
        limit: int = 50,
        include_snapshot: bool = False,
    ) -> AuditActionPage:
        """The write audit log for one object, newest action first.

        ``after`` is the opaque ``endCursor`` from a previous page. The cursor
        sits on a total order, so an event inserted between requests cannot
        repeat or skip an action the way ``offset`` can. ``includeSnapshot``
        opts each event into a full-object-state snapshot rendered from the
        event's ``pgh_data`` (ADR 0004 §13).
        ``filters`` windows the log (ADR 0004 §21): ``dateFrom``/``dateTo``
        bound ``timestamp`` (inclusive), ``actorId`` restricts to one actor, and
        ``systemOnly`` keeps events rendered as system. The predicates AND.
        It is one input object so later filters (the §30 ``kinds``) can be
        added without growing this field's argument list.

        Field-level authorization is enforced here, not in the selector: the
        BA-review fields follow ``operatorShelter``'s global-tier gate (#2559),
        and a shelter log's Bed/Room summary lines require the corresponding
        ``VIEW`` permission in that shelter's organization.
        """
        user = cast(AccountUser, get_current_user(info))
        obj = _resolve_target(user, target_type, object_id)

        hidden_fields: dict[str, tuple[str, ...]] = {}
        if not can_view_ba_review(info):
            hidden_fields[Shelter._meta.label] = BA_REVIEW_FIELDS

        hidden_summary_models = _hidden_summary_models(user, target_type, obj)

        try:
            page = select_object_audit_log(
                obj=obj,
                target_type=target_type.value,
                filters=filters,
                after=after,
                limit=limit,
                include_snapshot=include_snapshot,
                hidden_fields=hidden_fields,
                hidden_summary_models=hidden_summary_models,
            )
        except ValueError as error:
            # A bad ``limit``/cursor is caller input, not a server fault;
            # surface it as a GraphQL error rather than a 500 (§10 cap).
            raise GraphQLError(str(error)) from error
        return to_action_page(page)

    @strawberry.field(
        permission_classes=[IsAuthenticated],
        description=(
            "Distinct actors in one object's audit log, most active first. "
            "The synthetic System entry has a null id and is selected with systemOnly."
        ),
    )
    def object_audit_actors(
        self,
        info: Info,
        target_type: AuditTargetType,
        object_id: ID,
        search: Annotated[
            str,
            strawberry.argument(
                description="Case-insensitive label substring; shorter than two characters returns []."
            ),
        ] = "",
        limit: Annotated[
            int,
            strawberry.argument(description="Maximum actors to return (1-50); out of range is an error, not a clamp."),
        ] = 20,
    ) -> list[AuditActorType]:
        """Distinct actors in one object's audit log, most active first.

        Scoped to the object's own history (authorized like ``objectAuditLog``),
        so global/BA users who acted on it appear even when they are not
        organization members. ``System`` is a single synthetic entry (``id`` is
        null) for events rendered as system; filter it with
        ``AuditEventFilter.systemOnly``.

        ``search`` filters labels (minimum two characters, matching the UI);
        ``limit`` is capped at ``MAX_ACTOR_LIMIT``. Bed/Room summary actors the
        caller cannot see are excluded, matching ``objectAuditLog``.

        The aggregate scans the object's whole history; the full list is cached
        for ``ACTOR_CACHE_SECONDS``, so per-keystroke searches do not rerun it.
        ``limit`` caps the response, not the scan.
        """
        user = cast(AccountUser, get_current_user(info))
        obj = _resolve_target(user, target_type, object_id)
        try:
            actors = select_object_audit_actors(
                obj=obj,
                target_type=target_type.value,
                search=search,
                limit=limit,
                hidden_summary_models=_hidden_summary_models(user, target_type, obj),
            )
        except ValueError as error:
            raise GraphQLError(str(error)) from error

        return [
            AuditActorType(
                id=ID(actor.id) if actor.id is not None else None,
                label=actor.label,
                is_system=actor.is_system,
            )
            for actor in actors
        ]
