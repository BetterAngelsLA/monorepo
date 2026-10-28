"""GraphQL types for the object audit log (ADR 0004 §17)."""

import enum
from datetime import datetime
from typing import Any, List, Optional

import strawberry
from strawberry.scalars import JSON


@strawberry.enum
class AuditEventKind(enum.Enum):
    """The write operation a single event row represents (§13)."""

    INSERT = "INSERT"
    UPDATE = "UPDATE"
    DELETE = "DELETE"


@strawberry.enum
class AuditTargetType(enum.Enum):
    """The object kind an ``objectAuditLog`` query is anchored on (§18, §32).

    ``RESERVATION`` is deliberately absent: reservation history is still tracked
    (reports depend on it) but has no public log surface yet.
    """

    SHELTER = "SHELTER"
    ROOM = "ROOM"
    BED = "BED"


@strawberry.input(description="Filters for one object's write audit log (ADR 0004 §21).")
class AuditEventFilter:
    """Filters for one object's write audit log (ADR 0004 §21).

    ``date_from``/``date_to`` are inclusive bounds on the event timestamp;
    ``actor_id`` is the acting ``User.id`` frozen into the context metadata;
    ``system_only`` keeps events rendered as system (a system reason label, or
    no frozen name/email). The predicates AND, so ``actor_id`` +
    ``system_only`` selects that actor's import/clone events; unattributed
    system events have no actor id and cannot match a non-null ``actor_id``. A
    single input object keeps ``objectAuditLog``'s argument list stable as
    filters are added: the §30 ``kinds`` filter slots in here rather than
    growing the field's signature.
    """

    date_from: Optional[datetime] = strawberry.field(
        default=None,
        description="Inclusive lower bound on the event timestamp.",
    )
    date_to: Optional[datetime] = strawberry.field(
        default=None,
        description="Inclusive upper bound on the event timestamp.",
    )
    actor_id: Optional[strawberry.ID] = strawberry.field(
        default=None,
        description="The frozen acting User.id; omit to include every actor.",
    )
    # ``actor_id`` cannot express "no actor": it is also the "no filter" value.
    # ``system_only`` selects the events the UI labels as system (no frozen
    # name/email, or a system reason label such as import/clone).
    system_only: bool = strawberry.field(
        default=False,
        description=(
            "Keep events rendered as system (a system reason label, or no frozen name/email). "
            "ANDs with actorId: with both set, only that actor's import/clone events match."
        ),
    )


@strawberry.type(description="One selectable actor for an object's audit log (ADR 0004 §21).")
class AuditActorType:
    """One selectable actor for an object's audit log (§21).

    ``id`` is the frozen acting user id; it is null for the single synthetic
    ``System`` entry, which is selected via ``AuditEventFilter.system_only``.
    """

    id: Optional[strawberry.ID] = strawberry.field(
        description=(
            "The frozen acting User.id; null for the synthetic System entry, "
            "which is selected with AuditEventFilter.systemOnly."
        )
    )
    label: str = strawberry.field(
        description=("Display label: the actor's most frequent frozen name/email, or System for the synthetic entry.")
    )
    is_system: bool = strawberry.field(
        default=False,
        description=(
            "True for the synthetic System entry. Key the picker on this, not on label, "
            "because a real user's frozen name can also be System."
        ),
    )


@strawberry.type(description="A single pghistory write event, normalized across tracked models.")
class AuditEventType:
    """A single pghistory write event, normalized across tracked models."""

    timestamp: datetime
    actor: str
    kind: AuditEventKind
    action: str
    target_type: AuditTargetType
    target_id: strawberry.ID
    # ``null`` when the event has no diff base: its predecessor row was purged, so
    # pghistory's read-time ``pgh_diff`` is NULL. ``{}`` still means the write
    # changed nothing renderable (e.g. a summarized bed/room acknowledgment).
    field_changes: Optional[JSON]
    snapshot: Optional[JSON] = None
    # One-line acknowledgment for summarized events (§32); the UI shows this
    # instead of ``field_changes`` when present.
    summary: Optional[str] = None
    # Unchanged identity fields that keep a synthesized event identifiable (a
    # netted schedule slot's ``day``/``schedule type``). Never a change:
    # ``field_changes`` holds only real before/after pairs.
    context: Optional[JSON] = None


@strawberry.type(description="A group of events written under one context (one action, ADR 0004 §12).")
class AuditActionType:
    """A group of events written under one context (one "action", §12)."""

    timestamp: datetime
    actor: str
    summary: str
    events: List[AuditEventType]
    field_changes: JSON
    # True when the action carried more rows than ``MAX_EVENTS_PER_ACTION``.
    # Rendering stops at the cap, so ``events`` and this action-level
    # ``field_changes`` both cover only the rendered rows: a bulk action's
    # before/after can stop mid-sequence, and this flag is the only signal.
    truncated: bool = False


@strawberry.type(description="One cursor page of audit actions (ADR 0004 §10).")
class AuditActionPage:
    """One cursor page of audit actions (§10).

    ``end_cursor`` is opaque and is passed back as ``after`` to continue; it is
    null when the page is empty. ``has_next_page`` is known without a count
    query because the selector fetches one extra action key.
    """

    results: List[AuditActionType]
    end_cursor: Optional[str] = None
    has_next_page: bool = False


def to_event_type(event: Any) -> AuditEventType:
    return AuditEventType(
        timestamp=event.timestamp,
        actor=event.actor,
        kind=AuditEventKind(event.kind),
        action=event.action,
        target_type=AuditTargetType(event.target_type),
        target_id=strawberry.ID(event.target_id),
        field_changes=event.field_changes,
        snapshot=event.snapshot,
        summary=event.summary,
        context=event.context,
    )


def to_action_type(action: Any) -> AuditActionType:
    return AuditActionType(
        timestamp=action.timestamp,
        actor=action.actor,
        summary=action.summary,
        events=[to_event_type(event) for event in action.events],
        field_changes=action.field_changes,
        truncated=action.truncated,
    )


def to_action_page(page: Any) -> AuditActionPage:
    return AuditActionPage(
        results=[to_action_type(action) for action in page.results],
        end_cursor=page.end_cursor,
        has_next_page=page.has_next_page,
    )
