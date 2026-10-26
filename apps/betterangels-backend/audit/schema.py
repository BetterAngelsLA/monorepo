"""GraphQL surface for the object audit log (ADR 0004 §18, §21)."""

from typing import Optional, assert_never, cast

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

from .selectors import object_audit_log
from .types import AuditActionPage, AuditEventFilter, AuditTargetType, to_action_page


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


@strawberry.type
class Query:
    @strawberry.field(permission_classes=[IsAuthenticated])
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
        bound ``timestamp`` (inclusive) and ``actorId`` restricts to one actor.
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

        hidden_summary_models: frozenset[str] = frozenset()
        if target_type is AuditTargetType.SHELTER:
            shelter = cast(Shelter, obj)
            # ``can`` is row-independent on purpose: a shelter with no current
            # beds (or only deleted-bed events) must still hide the summaries.
            # ``visible(...).exists()`` would tie the answer to today's rows.
            hidden_summary_models = frozenset(
                model._meta.label
                for model in (Bed, Room)
                if not can(user, model.perms.VIEW, org=shelter.organization_id)
            )

        try:
            page = object_audit_log(
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
