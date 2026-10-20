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


@strawberry.type
class AuditEventType:
    """A single pghistory write event, normalized across tracked models."""

    timestamp: datetime
    actor: str
    kind: AuditEventKind
    action: str
    target_type: AuditTargetType
    target_id: strawberry.ID
    field_changes: JSON
    snapshot: Optional[JSON] = None
    # One-line acknowledgment for summarized events (§32); the UI shows this
    # instead of ``field_changes`` when present.
    summary: Optional[str] = None


@strawberry.type
class AuditActionType:
    """A group of events written under one context (one "action", §12)."""

    timestamp: datetime
    actor: str
    summary: str
    events: List[AuditEventType]
    field_changes: JSON
    # True when the action carried more events than the server renders in one
    # response. ``field_changes`` still reflects every row, so the action's
    # before/after stays correct; only the per-event list is shortened.
    truncated: bool = False


@strawberry.type
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
