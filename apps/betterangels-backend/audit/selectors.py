"""Write-audit-log selector.

Normalizes pghistory write events for a single object into one event shape,
groups events into actions, and orders actions newest-first (ADR 0004 §10–§19).

The write source is a single ``AuditEvent.objects.references(obj)`` query
(§10): it already aggregates the object's own events (via ``pgh_obj``) and every
event model with an FK to the object — including the §6 through-table proxies.
``THROUGH_EVENT_MAP`` is rendering metadata only, never a second query source.
"""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from django.apps import apps
from django.db.models import Max, TextField, Value
from django.db.models.functions import Cast, Coalesce, Concat
from django.utils import timezone
from shelters.models import Bed, Room, Shelter

from audit.models import AuditEvent

# Mechanical columns dropped from rendered changes (ADR 0004 Phase 1 note / §13).
_MECHANICAL_FIELDS = frozenset({"created_at", "updated_at"})

# Upper bound on a single page of actions. Each action carries N events, so an
# uncapped ``limit`` is an easy way to request an unbounded response (§10).
MAX_LIMIT = 200

# The single deliberate exclusion from a Shelter's log (§10). ``references()``
# unions every event model with an FK to the target, so this is a blocklist
# (default-inclusive) rather than a hand-maintained allowlist.
_EXCLUDED_EVENT_MODELS = ("referrals.ReferralEvent",)

# Labels that are recorded but rendered as a reason rather than an actor (§11).
_SYSTEM_REASON_LABELS = frozenset({"import", "clone"})

# Through-table rendering metadata (§19): event ``_meta.label`` ->
# (parent column, related FK field on the through model). The related FK field is
# Django's auto-generated name (the related model, lowercased, underscores
# stripped). Verified against the migration and by introspection.
THROUGH_EVENT_MAP: dict[str, tuple[str, str]] = {
    "shelters.TrackedDemographicEvent": ("shelter_id", "demographic"),
    "shelters.TrackedSpecialSituationRestrictionEvent": ("shelter_id", "specialsituationrestriction"),
    "shelters.TrackedShelterTypeEvent": ("shelter_id", "sheltertype"),
    "shelters.TrackedRoomStyleEvent": ("shelter_id", "roomstyle"),
    "shelters.TrackedAccessibilityEvent": ("shelter_id", "accessibility"),
    "shelters.TrackedStorageEvent": ("shelter_id", "storage"),
    "shelters.TrackedPetEvent": ("shelter_id", "pet"),
    "shelters.TrackedParkingEvent": ("shelter_id", "parking"),
    "shelters.TrackedEntryRequirementEvent": ("shelter_id", "entryrequirement"),
    "shelters.TrackedVaccinationRequirementEvent": ("shelter_id", "vaccinationrequirement"),
    "shelters.TrackedCityEvent": ("shelter_id", "city"),
    "shelters.TrackedSPAEvent": ("shelter_id", "spa"),
    "shelters.TrackedShelterProgramEvent": ("shelter_id", "shelterprogram"),
    "shelters.TrackedFunderEvent": ("shelter_id", "funder"),
    "shelters.TrackedExitPolicyEvent": ("shelter_id", "exitpolicy"),
    "shelters.TrackedReferralRequirementEvent": ("shelter_id", "referralrequirement"),
    "shelters.TrackedServiceEvent": ("shelter_id", "service"),
    "shelters.TrackedBedAccessibilityEvent": ("bed_id", "accessibility"),
    "shelters.TrackedBedDemographicEvent": ("bed_id", "demographic"),
    "shelters.TrackedBedFunderEvent": ("bed_id", "funder"),
    "shelters.TrackedBedMedicalNeedEvent": ("bed_id", "medicalneed"),
    "shelters.TrackedBedPetEvent": ("bed_id", "pet"),
    "shelters.TrackedRoomAccessibilityEvent": ("room_id", "accessibility"),
    "shelters.TrackedRoomDemographicEvent": ("room_id", "demographic"),
    "shelters.TrackedRoomFunderEvent": ("room_id", "funder"),
    "shelters.TrackedRoomPetEvent": ("room_id", "pet"),
}

# Related-model display attribute (§14). Falls back to the raw id when absent.
LABEL_FIELD: dict[str, str] = {
    "shelters.Demographic": "name",
    "shelters.SpecialSituationRestriction": "name",
    "shelters.ShelterType": "name",
    "shelters.RoomStyle": "name",
    "shelters.Accessibility": "name",
    "shelters.Storage": "name",
    "shelters.Pet": "name",
    "shelters.Parking": "name",
    "shelters.EntryRequirement": "name",
    "shelters.VaccinationRequirement": "name",
    "shelters.ShelterProgram": "name",
    "shelters.Funder": "name",
    "shelters.ExitPolicy": "name",
    "shelters.ReferralRequirement": "name",
    "shelters.MedicalNeed": "name",
    "shelters.City": "name",
    "shelters.SPA": "short_name",
    "shelters.Service": "display_name",
    "shelters.ServiceCategory": "display_name",
    "organizations.Organization": "name",
    "clients.ClientProfile": "full_name",
    "shelters.Shelter": "name",
    "shelters.Room": "name",
    "shelters.Bed": "name",
    "accounts.User": "email",
}

_PARENT_MODELS = {"shelter_id": Shelter, "bed_id": Bed, "room_id": Room}


@dataclass
class AuditEventData:
    timestamp: Any
    actor: str
    kind: str
    action: str
    target_type: str
    target_id: str
    field_changes: dict[str, Any]


@dataclass
class AuditActionData:
    timestamp: Any
    actor: str
    summary: str
    events: list[AuditEventData] = field(default_factory=list)
    field_changes: dict[str, Any] = field(default_factory=dict)
    order: int = 0


@dataclass(frozen=True)
class _Ref:
    """A deferred foreign-key reference to resolve to a display label."""

    model_label: str
    pk: Any


class _LabelResolver:
    """Resolves FK ids to display labels, batched one query per model (§14)."""

    def __init__(self) -> None:
        self._ids: dict[str, set[Any]] = defaultdict(set)
        self._cache: dict[tuple[str, Any], str] = {}

    def ref(self, model_label: str, pk: Any) -> _Ref:
        if pk is not None:
            self._ids[model_label].add(pk)
        return _Ref(model_label, pk)

    def fetch(self) -> None:
        for model_label, ids in self._ids.items():
            attr = LABEL_FIELD.get(model_label)
            try:
                model = apps.get_model(model_label)
            except LookupError:
                for pk in ids:
                    self._cache[(model_label, pk)] = str(pk)
                continue

            rows = model._default_manager.filter(pk__in=ids)
            for obj in rows:
                value = getattr(obj, attr, None) if attr else None
                self._cache[(model_label, obj.pk)] = str(value) if value not in (None, "") else str(obj.pk)
            for pk in ids:
                self._cache.setdefault((model_label, pk), str(pk))

    def resolve(self, ref: _Ref) -> Any:
        if ref.pk is None:
            return None
        return self._cache.get((ref.model_label, ref.pk), str(ref.pk))


def _fk_fields(model_label: str) -> dict[str, str]:
    """Map ``<field>_id`` -> related model label for a tracked model (cached)."""
    if model_label in _FK_FIELD_CACHE:
        return _FK_FIELD_CACHE[model_label]

    result: dict[str, str] = {}
    try:
        model = apps.get_model(model_label)
    except LookupError:
        _FK_FIELD_CACHE[model_label] = result
        return result

    for f in model._meta.fields:
        if f.is_relation and f.many_to_one:
            result[f.attname] = f.related_model._meta.label
    _FK_FIELD_CACHE[model_label] = result
    return result


_FK_FIELD_CACHE: dict[str, dict[str, str]] = {}


def _kind(label: str) -> str:
    if label.endswith(".add"):
        return "INSERT"
    if label.endswith(".remove"):
        return "DELETE"
    return "UPDATE"


def _actor(row: Any) -> str:
    label = row.label
    if label in _SYSTEM_REASON_LABELS:
        return f"system ({label})"
    if row.actor_name:
        return str(row.actor_name)
    if row.actor_id and row.actor_email:
        return str(row.actor_email)
    return "system"


def _m2m_meta(pgh_model: str) -> tuple[str, str] | None:
    """Return ``(field_name, related_model_label)`` for a through event model."""
    entry = THROUGH_EVENT_MAP.get(pgh_model)
    if entry is None:
        return None
    parent_col, related_fk_field = entry
    parent_model = _PARENT_MODELS[parent_col]
    for m2m in parent_model._meta.many_to_many:
        through = m2m.remote_field.through
        if through is None:
            continue
        for f in through._meta.fields:
            if f.name == related_fk_field and f.is_relation:
                return m2m.name, m2m.related_model._meta.label
    return None


def _scalar_changes(row: Any, resolver: _LabelResolver) -> dict[str, list[Any]]:
    """Render a non-M2M row's own changes (§13)."""
    label = row.pgh_label
    data = row.pgh_data or {}
    obj_model = row.pgh_obj_model
    fk_fields = _fk_fields(obj_model)

    def ref(field_name: str, value: Any) -> Any:
        related = fk_fields.get(field_name)
        if related is not None:
            return resolver.ref(related, value)
        return value

    if label.endswith(".add"):
        return {f: [None, ref(f, v)] for f, v in data.items() if v is not None and f not in _MECHANICAL_FIELDS}
    if label.endswith(".remove"):
        return {f: [ref(f, v), None] for f, v in data.items() if v is not None and f not in _MECHANICAL_FIELDS}

    diff = row.pgh_diff or {}
    return {f: [ref(f, old), ref(f, new)] for f, (old, new) in diff.items() if f not in _MECHANICAL_FIELDS}


def _merge_scalar(target: dict[str, list[Any]], changes: dict[str, list[Any]]) -> None:
    """Merge row diffs keeping the earliest old and the latest new (§13)."""
    for field_name, (old, new) in changes.items():
        if field_name in target:
            target[field_name][1] = new
        else:
            target[field_name] = [old, new]


def _finalize(value: Any, resolver: _LabelResolver) -> Any:
    if isinstance(value, _Ref):
        return resolver.resolve(value)
    if isinstance(value, dict):
        return {k: _finalize(v, resolver) for k, v in value.items()}
    if isinstance(value, list):
        return [_finalize(v, resolver) for v in value]
    return value


def _action_key_expr() -> Any:
    """SQL action-grouping key (§12): context id, else a per-event singleton.

    ``GROUP BY`` treats all NULL ``pgh_context_id`` rows as one group, so
    context-less events get ``system-<pgh_id>`` to keep them distinct.
    """
    return Coalesce(
        Cast("pgh_context_id", TextField()),
        Concat(Value("system-"), Cast("pgh_id", TextField())),
        output_field=TextField(),
    )


def object_audit_log(
    *,
    obj: Any,
    target_type: str,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    actor_id: Any = None,
    limit: int = 50,
    offset: int = 0,
) -> list[AuditActionData]:
    """Return the write audit log for *obj*, newest action first.

    *target_type* is the ``AuditTargetType`` value (``SHELTER``/``ROOM``/``BED``/
    ``RESERVATION``) echoed onto each event. Pagination is done in SQL (§10):
    only the requested page's action keys are fetched from the aggregate CTE.

    ``date_from``/``date_to`` bound ``pgh_created_at`` (inclusive) and
    ``actor_id`` restricts to a single acting user (ADR 0004 §21). All three are
    applied as predicates on the aggregate CTE's outer SELECT — in SQL, before
    the Python grouping below (§10) — so a filtered-out event never contributes
    to an action.

    Raises ``ValueError`` for a non-positive/oversized ``limit`` or a negative
    ``offset`` (§10 cap): callers surface this as a GraphQL error.
    """
    if limit < 1 or limit > MAX_LIMIT:
        raise ValueError(f"limit must be between 1 and {MAX_LIMIT}.")
    if offset < 0:
        raise ValueError("offset must be non-negative.")

    target_id = str(obj.pk)
    # Filters go on ``base`` *before* the key query: a filter applied after key
    # selection could pick a key and then drop its rows, yielding a short page.
    base = AuditEvent.objects.references([obj]).exclude(pgh_model__in=_EXCLUDED_EVENT_MODELS).exclude(label="seed")
    if date_from is not None:
        base = base.filter(pgh_created_at__gte=date_from)
    if date_to is not None:
        base = base.filter(pgh_created_at__lte=date_to)
    if actor_id is not None:
        base = base.filter(actor_id=actor_id)

    key_expr = _action_key_expr()

    # 1) Action keys for the requested page, grouped and limited in SQL.
    key_rows = (
        base.annotate(action_key=key_expr)
        .values("action_key")
        .annotate(last_event=Max("pgh_created_at"), last_id=Max("pgh_id"))
        .order_by("-last_event", "-last_id")[offset : offset + limit]
    )
    page_keys = [row["action_key"] for row in key_rows]
    if not page_keys:
        return []

    # 2) Fetch only the page's rows and build actions. This is a plain iteration,
    # not ``.iterator()``: Django's server-side cursor issues ``DECLARE``, which
    # RDS Proxy pins (ADR 0004 §10). The row set is already bounded by
    # ``page_keys``, so a server-side cursor buys nothing here.
    rows = base.annotate(action_key=key_expr).filter(action_key__in=page_keys).order_by("pgh_created_at", "pgh_id")

    grouped: dict[str, list[Any]] = defaultdict(list)
    for row in rows:
        grouped[row.action_key].append(row)

    resolver = _LabelResolver()
    actions = [
        _build_action(rows, target_type=target_type, target_id=target_id, resolver=resolver)
        for rows in grouped.values()
    ]

    resolver.fetch()
    for action in actions:
        action.field_changes = _finalize(action.field_changes, resolver)
        for event in action.events:
            event.field_changes = _finalize(event.field_changes, resolver)

    actions.sort(key=lambda a: (a.timestamp, a.order), reverse=True)
    return actions


def _build_action(
    rows: list[Any],
    *,
    target_type: str,
    target_id: str,
    resolver: _LabelResolver,
) -> AuditActionData:
    rows.sort(key=lambda r: (r.pgh_created_at, r.pgh_id))

    actor = _actor(rows[0])
    action_changes: dict[str, Any] = {}
    m2m_changes: dict[str, dict[str, list[_Ref]]] = defaultdict(lambda: {"removed": [], "added": []})
    events: list[AuditEventData] = []

    for row in rows:
        meta = _m2m_meta(row.pgh_model)
        if meta is not None:
            field_name, related_model_label = meta
            related_fk_field = THROUGH_EVENT_MAP[row.pgh_model][1]
            related_pk = (row.pgh_data or {}).get(f"{related_fk_field}_id")
            ref = resolver.ref(related_model_label, related_pk)
            bucket = m2m_changes[field_name]
            if row.pgh_label.endswith(".remove"):
                bucket["removed"].append(ref)
            else:
                bucket["added"].append(ref)

            single = [[ref], []] if row.pgh_label.endswith(".remove") else [[], [ref]]
            events.append(
                AuditEventData(
                    timestamp=row.pgh_created_at,
                    actor=_actor(row),
                    kind=_kind(row.pgh_label),
                    action=row.pgh_label,
                    target_type=target_type,
                    target_id=target_id,
                    field_changes={field_name: single},
                )
            )
            continue

        changes = _scalar_changes(row, resolver)
        _merge_scalar(action_changes, changes)

        events.append(
            AuditEventData(
                timestamp=row.pgh_created_at,
                actor=_actor(row),
                kind=_kind(row.pgh_label),
                action=row.pgh_label,
                target_type=target_type,
                target_id=target_id,
                field_changes={f: list(pair) for f, pair in changes.items()},
            )
        )

    # M2M changes: cancel an add/remove of the same related row, then merge the
    # action-level multi-value entry (§13, §15).
    for field_name, bucket in m2m_changes.items():
        added_keys = set(bucket["added"])
        removed_keys = set(bucket["removed"])
        both = added_keys & removed_keys
        added = [r for r in bucket["added"] if r not in both]
        removed = [r for r in bucket["removed"] if r not in both]
        action_changes[field_name] = [removed, added]

    timestamp = rows[-1].pgh_created_at if rows else timezone.now()
    return AuditActionData(
        timestamp=timestamp,
        actor=actor,
        summary=f"{actor} modified {target_type.lower()} {target_id}",
        events=events,
        field_changes=action_changes,
        order=max((row.pgh_id for row in rows), default=0),
    )
