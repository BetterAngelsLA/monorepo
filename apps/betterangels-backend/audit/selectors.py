"""Write-audit-log selector.

Normalizes pghistory write events for a single object into one event shape,
groups events into actions, and orders actions newest-first (ADR 0004 §10–§19).

The write source is a single ``AuditWriteEvent.objects.references(obj)`` query
(§10): it already aggregates the object's own events (via ``pgh_obj``) and every
event model with an FK to the object — including the §6 through-table proxies.
``_through_event_meta()`` is rendering metadata (derived from pghistory
introspection) only, never a second query source.

Pagination is applied in SQL (§10): the page's action keys are selected with a
grouped ``LIMIT`` over a cursor on the total order, then only those keys' rows
are fetched, so the page *query* is bounded by the page rather than the object's
total history. The grouped key query that chooses the keys still aggregates the
object's full history; a denormalized feed would be needed to change that.
Excluded event models are dropped from the compiled union with ``across()``
rather than filtered row-by-row, so their tables are never read.
"""

from __future__ import annotations

import base64
import json
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from functools import lru_cache
from typing import Any, Collection, Mapping, Sequence
from uuid import UUID

from django.apps import apps
from django.db.models import Max, Model, Q, TextField
from django.db.models.functions import Cast, Coalesce
from django.utils import timezone
from pghistory.core import event_models

from audit.models import AuditWriteEvent
from shelters.models import Bed, Room, Shelter

# Mechanical columns dropped from rendered changes (ADR 0004 Phase 1 note / §13).
_MECHANICAL_FIELDS = frozenset({"created_at", "updated_at"})

# Upper bound on a single page of actions. Each action carries N events, and
# with ``include_snapshot=True`` each event carries the object's full state, so
# an uncapped ``limit`` is an easy way to request an unbounded response (§10).
MAX_LIMIT = 200

# Upper bound on the events rendered for a single action. One ``pghistory``
# context can wrap an arbitrarily large write (a CSV import wraps its whole
# dataset), so an action's event list is capped independently of the cursor
# limit; ``AuditActionData.truncated`` reports that rows were omitted.
MAX_EVENTS_PER_ACTION = 500

# Upper bound on the events rendered across one page. ``MAX_LIMIT`` bounds the
# number of *actions*, but each may carry up to ``MAX_EVENTS_PER_ACTION`` events,
# so without this a ``limit=200`` request could render 100k events -- each with a
# full ``snapshot`` under ``include_snapshot=True``. Actions are started in
# order until the budget runs out; an action is never cut in half by this
# budget, so the response is bounded by
# ``MAX_EVENTS_PER_PAGE + MAX_EVENTS_PER_ACTION - 1`` and ``truncated`` keeps its
# single per-action meaning.
MAX_EVENTS_PER_PAGE = 2000

# Excluded from every target's log (blocklist, default-inclusive; §10).
# ``referrals.ReferralEvent`` is a separate concern from a shelter log.
# ``ContactInfoEvent`` is internal Better Angels data with no end-user surface:
# contact names, emails, and phone numbers must never reach the operator log,
# regardless of the caller's permissions. The rows are still written, so this is
# a read-side exclusion only (ADR 0004 §7b.6).
_EXCLUDED_EVENT_MODELS = ("referrals.ReferralEvent", "shelters.ContactInfoEvent")

# Additional, target-scoped exclusions (§32). Each log owns its model: a
# reservation's detail is tracked but has no public surface yet, and a Room is
# configuration-only here because its beds have their own log.
#
# There is deliberately no ``SHELTER`` entry. ``Reservation`` reaches a shelter
# only through its ``bed``/``room``, so ``references(Shelter)`` never matches
# ``ReservationEvent`` or ``ReservationClientEvent`` -- a Shelter log omits
# reservation rows structurally, not by filtering. Only the Room/Bed logs, which
# *do* reach reservations through their own FKs, need a scoped exclusion.
_SCOPED_EXCLUSIONS: dict[str, tuple[str, ...]] = {
    # A room log is the room's own configuration; beds are summarized on the
    # shelter log and detailed on their own.
    "ROOM": ("shelters.ReservationEvent", "shelters.BedEvent"),
    "BED": ("shelters.ReservationEvent",),
}

# Labels that are recorded but rendered as a reason rather than an actor (§11).
_SYSTEM_REASON_LABELS = frozenset({"import", "clone"})

# Objects the Shelter log only acknowledges (§32). Their own log carries the
# detail, so a shelter-level action renders one line per object: name and id.
_SUMMARY_ONLY_MODELS = frozenset({"shelters.Bed", "shelters.Room"})
_SUMMARY_VERBS = {"INSERT": "Created", "UPDATE": "Updated", "DELETE": "Deleted"}


# Through-table rendering metadata (§19). Derived at runtime from pghistory's
# ``pgh_tracked_model`` introspection — never a hand-maintained list and never a
# query source (``references()`` is the only query source; §10). For each
# auto-created M2M through table we recover the parent FK column
# (``shelter_id``/``bed_id``/``room_id``), the related FK field, the M2M's
# ``verbose_name`` (the display field), and both model labels.
@dataclass(frozen=True)
class _ThroughMeta:
    parent_col: str
    related_fk_field: str
    display_name: str
    related_model_label: str
    parent_model_label: str


@lru_cache(maxsize=1)
def _through_event_meta() -> dict[str, _ThroughMeta]:
    """``event _meta.label`` -> rendering metadata, for every parent M2M join."""
    result: dict[str, _ThroughMeta] = {}
    for event_model in event_models():
        tracked = getattr(event_model, "pgh_tracked_model", None)
        if tracked is None:
            continue
        through = tracked._meta.concrete_model
        if not through._meta.auto_created:
            continue
        fks = [f for f in through._meta.fields if f.is_relation and f.many_to_one]
        for parent_fk in fks:
            parent = parent_fk.related_model
            if parent not in (Shelter, Bed, Room):
                continue
            for m2m in parent._meta.many_to_many:
                if m2m.remote_field.through._meta.concrete_model is through:
                    related_fk = next(f for f in fks if f is not parent_fk)
                    result[event_model._meta.label] = _ThroughMeta(
                        parent_col=parent_fk.attname,
                        related_fk_field=related_fk.name,
                        display_name=str(m2m.verbose_name),
                        related_model_label=m2m.related_model._meta.label,
                        parent_model_label=parent._meta.label,
                    )
    return result


# Related-model display attribute (§14). Presentation-only: the resolver falls
# back to the raw id when the attribute is absent, so the default is a
# ``display_name`` -> ``name`` chain, with a few product-specific overrides.
# ``str(obj)`` is deliberately not used: ``Room.__str__`` dereferences
# ``self.shelter`` (an N+1 in the batched resolver) and ``Bed.__str__`` returns
# ``"Bed object (pk)"``.
_LABEL_FIELD_OVERRIDES: dict[str, str] = {
    "shelters.SPA": "short_name",  # ``name`` is an int-choices field
    "clients.ClientProfile": "full_name",  # ``__str__`` appends "(pk)"
    "accounts.User": "email",  # ``__str__`` is name-or-pk
}
_LABEL_FIELD_DEFAULT_CHAIN = ("display_name", "name")


_LABEL_FIELD_CACHE: dict[str, str | None] = {}


def _label_field(model: type[Model]) -> str | None:
    """The display attribute for a related model, or ``None`` for the raw id."""
    label = model._meta.label
    if label in _LABEL_FIELD_CACHE:
        return _LABEL_FIELD_CACHE[label]
    if label in _LABEL_FIELD_OVERRIDES:
        result: str | None = _LABEL_FIELD_OVERRIDES[label]
    else:
        names = {f.name for f in model._meta.fields}
        result = next((c for c in _LABEL_FIELD_DEFAULT_CHAIN if c in names), None)
    _LABEL_FIELD_CACHE[label] = result
    return result


@dataclass
class AuditEventData:
    timestamp: datetime
    actor: str
    kind: str
    action: str
    target_type: str
    target_id: str
    # ``None`` when the event has no diff base -- its predecessor row was purged,
    # so pghistory's read-time ``pgh_diff`` is NULL. ``{}`` still means "the write
    # changed nothing renderable" (e.g. a summarized bed/room acknowledgment).
    field_changes: dict[str, Any] | None
    # Full object state as of the event (§13), rendered from ``pgh_data``. Only
    # populated when the caller opts in; ``None`` for M2M rows.
    snapshot: dict[str, Any] | None = None
    # One-line description for events that are acknowledged rather than detailed
    # (§32, e.g. "Created Bed A (7)"). When set, the UI shows this and no field
    # changes; ``field_changes`` is empty.
    summary: str | None = None


@dataclass
class AuditActionData:
    timestamp: datetime
    actor: str
    summary: str
    events: list[AuditEventData] = field(default_factory=list)
    field_changes: dict[str, Any] = field(default_factory=dict)
    # Total-order tie-break for the Python re-sort, mirroring the SQL page order
    # (``pgh_id`` then the action key; see ``_action_order``). It is a string so
    # both sorts share one comparison.
    order: str = ""
    # The two aggregate values the cursor is built from; mirrors the SQL
    # ``Max("pgh_created_at")`` / ``Max("pgh_id")`` above, which need not come
    # from the same row when a transaction ties timestamps.
    last_id: int = 0
    order_key: str = ""
    # True when the action carried more rows than ``MAX_EVENTS_PER_ACTION``.
    # Rendering stops at the cap, so ``events`` **and** the action-level
    # ``field_changes`` both cover only the rendered rows: a bulk action's
    # before/after can stop mid-sequence, and this flag is the only signal.
    truncated: bool = False


@dataclass
class AuditActionPageData:
    """One cursor page of actions plus the cursor to continue from (§10)."""

    results: list[AuditActionData] = field(default_factory=list)
    end_cursor: str | None = None
    has_next_page: bool = False


@dataclass(frozen=True)
class _Cursor:
    event: datetime
    event_id: int
    action_key: str


_CURSOR_VERSION = 1


def _encode_cursor(action: AuditActionData) -> str:
    payload = {
        "v": _CURSOR_VERSION,
        "t": action.timestamp.isoformat(),
        "i": action.last_id,
        "k": action.order_key,
    }
    raw = json.dumps(payload, separators=(",", ":"))
    return base64.urlsafe_b64encode(raw.encode()).decode()


def _decode_cursor(raw: str) -> _Cursor:
    """Parse an opaque ``after`` cursor, raising ``ValueError`` when malformed.

    The cursor is caller input, so a bad value must surface as a GraphQL error
    (via the schema's ``ValueError`` handling) rather than a 500.
    """
    try:
        payload = json.loads(base64.urlsafe_b64decode(raw.encode()).decode())
        if payload.get("v") != _CURSOR_VERSION:
            raise ValueError(payload.get("v"))
        event = datetime.fromisoformat(payload["t"])
        if event.tzinfo is None:
            # Cursors we mint always carry an offset. A naive value would be
            # coerced with the server's active timezone, making the page boundary
            # depend on process configuration.
            raise ValueError(payload["t"])
        return _Cursor(
            event=event,
            event_id=int(payload["i"]),
            action_key=str(payload["k"]),
        )
    except (ValueError, TypeError, KeyError) as err:
        raise ValueError("Invalid cursor.") from err


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
            try:
                model = apps.get_model(model_label)
            except LookupError:
                for pk in ids:
                    self._cache[(model_label, pk)] = str(pk)
                continue

            attr = _label_field(model)
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


def _field_meta(model_label: str) -> dict[str, Any]:
    """Map ``<field>_id``/``<field>`` (attname) -> model field for a tracked model."""
    if model_label in _FIELD_CACHE:
        return _FIELD_CACHE[model_label]

    result: dict[str, Any] = {}
    try:
        model = apps.get_model(model_label)
    except LookupError:
        _FIELD_CACHE[model_label] = result
        return result

    for f in model._meta.fields:
        result[f.attname] = f
    _FIELD_CACHE[model_label] = result
    return result


_FIELD_CACHE: dict[str, dict[str, Any]] = {}


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


def _display_field_name(field_name: str, model_field: Any) -> str:
    """Render a raw column name as its ``verbose_name`` (§13).

    Falls back to the raw name when the field is unknown or has no verbose name.
    """
    if model_field is None:
        return field_name
    verbose_name = getattr(model_field, "verbose_name", None)
    return str(verbose_name) if verbose_name else field_name


def _display_keys(model_label: str) -> dict[str, str]:
    """Map every tracked field's attname -> its rendered key for a model (§13).

    Normally the ``verbose_name``. But a model may give several fields the *same*
    ``verbose_name`` (``Shelter`` has three "Additional Notes"), and keying a
    dict by that would silently drop all but the last — reporting an edit as if
    it had not happened. When a display name is shared, fall back to the raw
    field name (``add_notes_sleeping_details``) so every field keeps its own key.

    Computed from the model's whole field set, not the row's present keys, so a
    field's key never changes between events of the same model.
    """
    if model_label in _DISPLAY_KEYS_CACHE:
        return _DISPLAY_KEYS_CACHE[model_label]

    try:
        model = apps.get_model(model_label)
    except LookupError:
        _DISPLAY_KEYS_CACHE[model_label] = {}
        return {}

    fields = model._meta.fields
    counts: dict[str, int] = defaultdict(int)
    for f in fields:
        counts[_display_field_name(f.attname, f)] += 1

    result: dict[str, str] = {}
    for f in fields:
        display_name = _display_field_name(f.attname, f)
        # A unique display name reads better; only collisions need the raw name.
        result[f.attname] = f.name if counts[display_name] > 1 else display_name
    _DISPLAY_KEYS_CACHE[model_label] = result
    return result


_DISPLAY_KEYS_CACHE: dict[str, dict[str, str]] = {}


def _pk_attname(model_label: str) -> str | None:
    """The tracked model's primary-key attname, or ``None`` if unresolvable."""
    if model_label in _PK_ATTNAME_CACHE:
        return _PK_ATTNAME_CACHE[model_label]
    try:
        attname: str | None = apps.get_model(model_label)._meta.pk.attname
    except LookupError:
        attname = None
    _PK_ATTNAME_CACHE[model_label] = attname
    return attname


_PK_ATTNAME_CACHE: dict[str, str | None] = {}


def _model_verbose_name(model_label: str) -> str:
    """Human name for a tracked model, used only to disambiguate colliding keys."""
    if model_label in _VERBOSE_NAME_CACHE:
        return _VERBOSE_NAME_CACHE[model_label]
    try:
        name = str(apps.get_model(model_label)._meta.verbose_name).capitalize()
    except LookupError:
        name = model_label.rsplit(".", 1)[-1]
    _VERBOSE_NAME_CACHE[model_label] = name
    return name


_VERBOSE_NAME_CACHE: dict[str, str] = {}


def _display_value(model_field: Any, value: Any) -> Any:
    """Render a stored scalar as its choice/enum label (§13).

    Non-choice fields, unknown fields, and null values pass through unchanged. A
    list/tuple value (e.g. a multiselect field) is mapped element-wise.
    """
    if model_field is None or value is None:
        return value

    choices = getattr(model_field, "choices", None)
    if callable(choices):  # Django 5.0+ allows a callable choices
        choices = choices()
    if not choices:
        return value

    if isinstance(choices, dict):
        choices = list(choices.items())
    mapping = {str(raw): str(label) for raw, label in choices}

    if isinstance(value, (list, tuple)):
        return [mapping.get(str(v), v) for v in value]
    return mapping.get(str(value), value)


def _render_value(
    field_name: str,
    value: Any,
    fk_fields: dict[str, str],
    fields: dict[str, Any],
    resolver: _LabelResolver,
) -> Any:
    """Render one stored value: FK -> display label, choice -> label, else raw."""
    related = fk_fields.get(field_name)
    if related is not None:
        return resolver.ref(related, value)
    return _display_value(fields.get(field_name), value)


def _kind(label: str) -> str:
    if label.endswith(".add"):
        return "INSERT"
    if label.endswith(".remove"):
        return "DELETE"
    return "UPDATE"


def _summary_line(row: Any, kind: str) -> str:
    """One-line acknowledgment for a summarized object (§32).

    ``pgh_data`` carries the row's state for INSERT/DELETE and the new state for
    UPDATE, so it is the source for the name in every case. ``Bed.name`` is
    nullable, so fall back to a model-and-id label instead of rendering "None".
    """
    name = (row.pgh_data or {}).get("name")
    if not name:
        name = f"{_model_verbose_name(row.pgh_obj_model)} #{row.pgh_obj_id}"
    return f"{_SUMMARY_VERBS[kind]} {name} ({row.pgh_obj_id})"


def _actor(row: Any) -> str:
    label = row.label
    if label in _SYSTEM_REASON_LABELS:
        return f"system ({label})"
    if row.actor_name:
        return str(row.actor_name)
    # The frozen email stands alone: ``user`` and ``user_email`` are written into
    # the same metadata snapshot, so requiring the id would only drop attributed
    # events that carry the email without the id key.
    if row.actor_email:
        return str(row.actor_email)
    return "system"


def _m2m_meta(pgh_model: str) -> _ThroughMeta | None:
    """The through-table rendering metadata for a through event, if any (§19)."""
    return _through_event_meta().get(pgh_model)


def _scalar_changes(
    row: Any,
    resolver: _LabelResolver,
    hidden_fields: Collection[str] = (),
) -> dict[str, list[Any]]:
    """Render a non-M2M row's own changes, keyed by **raw column name** (§13).

    Raw (attname) keys keep the dict lossless: two fields that share a
    ``verbose_name`` are distinct here even though they render to the same label.
    ``_display_keys`` maps them to display names at the edges (per-event
    ``field_changes``, the action rollup, the snapshot).

    *hidden_fields* are raw attnames withheld for this row's model -- always the
    case for BA-review fields when the caller lacks the global grant (§18). They
    are dropped before rendering, so neither the display key nor its value can
    reach any output shape.
    """
    label = row.pgh_label
    data = row.pgh_data or {}
    obj_model = row.pgh_obj_model
    fk_fields = _fk_fields(obj_model)
    fields = _field_meta(obj_model)

    def render(field_name: str, value: Any) -> Any:
        return _render_value(field_name, value, fk_fields, fields, resolver)

    # The pk is present in ``pgh_data`` for insert/remove but can never change
    # (the UPDATE branch renders ``pgh_diff``, which never contains it), so it is
    # not a "change". Drop it so a create does not render ``ID: [None, 7]``.
    pk_attname = _pk_attname(obj_model)
    hidden = _MECHANICAL_FIELDS | set(hidden_fields) | ({pk_attname} if pk_attname else set())

    if label.endswith(".add"):
        # Only non-null new values: a field that is NULL after creation [None, None]
        # is not a meaningful change. The full post-create state is available via
        # ``include_snapshot=True``.
        return {f: [None, render(f, v)] for f, v in data.items() if v is not None and f not in hidden}
    if label.endswith(".remove"):
        # Only non-null old values: a field that was NULL at deletion [None, None]
        # is not a meaningful change. The full pre-delete state is available via
        # ``include_snapshot=True``.
        return {f: [render(f, v), None] for f, v in data.items() if v is not None and f not in hidden}

    diff = row.pgh_diff or {}
    return {f: [render(f, old), render(f, new)] for f, (old, new) in diff.items() if f not in hidden}


def _render_keys(changes: dict[str, Any], model_label: str) -> dict[str, Any]:
    """Re-key a raw-``attname`` change map to display names (§13)."""
    keys = _display_keys(model_label)
    return {keys.get(f, f): value for f, value in changes.items()}


def _snapshot(row: Any, resolver: _LabelResolver, hidden_fields: Collection[str] = ()) -> dict[str, Any]:
    """Render the full object state carried by ``pgh_data`` (§13).

    Exposes the snapshot pghistory already stores per event (one column per
    tracked field) — no extra storage. FK ids are resolved and choices rendered
    like any other change; mechanical/``pgh_*`` columns are dropped. *hidden_fields*
    are omitted for the same reason as in ``_scalar_changes``: a withheld field
    must not reappear through the snapshot.
    """
    data = row.pgh_data or {}
    obj_model = row.pgh_obj_model
    fk_fields = _fk_fields(obj_model)
    fields = _field_meta(obj_model)
    keys = _display_keys(obj_model)
    hidden = set(hidden_fields)

    snapshot: dict[str, Any] = {}
    for field_name, value in data.items():
        if field_name in _MECHANICAL_FIELDS or field_name.startswith("pgh_") or field_name in hidden:
            continue
        snapshot[keys.get(field_name, field_name)] = _render_value(field_name, value, fk_fields, fields, resolver)
    return snapshot


def _action_change_key(owner: str, obj_id: Any, display_name: str, target_model_label: str | None) -> str:
    """The action-level key for one row's change (§13).

    The anchored object's own changes stay bare: the action is about that one
    row, so ``name`` is unambiguous. A *related* row — reachable because
    ``references()`` spans the target's neighbors — is qualified with its model
    and id, because a single action can touch several such rows (a bulk import,
    or several objects saved in one request). The qualifier is applied
    unconditionally rather than only on a name clash, so a key's shape does not
    depend on what else the request happened to touch.
    """
    if target_model_label is not None and owner == target_model_label:
        return display_name
    return f"{_model_verbose_name(owner)} {obj_id} {display_name}"


def _merge_scalar(
    target: dict[tuple[str, Any, str], list[Any]],
    owner: str,
    obj_id: Any,
    changes: dict[str, list[Any]],
) -> None:
    """Merge one row's changes into the action, keeping the earliest old and the
    latest new per ``(owner model, row id, display name)`` (§13).

    The row id is part of the key, so an action that writes several rows of the
    same model keeps a separate before/after per row instead of collapsing them
    into one pair.
    """
    for field_name, (old, new) in changes.items():
        key = (owner, obj_id, field_name)
        if key in target:
            target[key][1] = new
        else:
            target[key] = [old, new]


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
    context-less events fall back to ``pgh_slug``. That is pghistory's own
    ``"<event_model>:<pgh_id>"`` primary key on the aggregate ``Events`` model, so
    it is unique across *every* event table. ``pgh_id`` alone is not: it is a
    per-table ``AutoField``, so two context-less writes in different tables with
    the same id (each table's sequence starts at 1) would merge into one spurious
    action.
    """
    return Coalesce(
        Cast("pgh_context_id", TextField()),
        "pgh_slug",
        output_field=TextField(),
    )


def _action_order(rows: list[Any]) -> tuple[int, str]:
    """The action's total-order key pieces, shared by the SQL page query and the
    Python re-sort (§10).

    ``pgh_id`` is a per-table ``AutoField``, so it is only chronological *within*
    an event table; two actions in different tables can tie on it, and they always
    tie on ``pgh_created_at`` when they are written in one transaction (``NOW()``
    is constant). Appending the (unique) action key makes the order total, so no
    action can be skipped or duplicated across pages.

    Returns ``(last_id, action_key)``; ``last_id`` is zero-padded into ``order``
    so the lexicographic comparison matches the numeric one.
    """
    last_id = max((row.pgh_id for row in rows), default=0)
    return last_id, rows[0].action_key


def _allowed_event_models(obj: Model, excluded: Sequence[str]) -> list[type[Model]]:
    """The event models ``references()`` would union for *obj*, minus exclusions.

    Passed to ``across()`` so an excluded model's table is not read at all: a
    row-level ``.exclude(pgh_model__in=...)`` still compiles its UNION branch,
    paying the scan and the statement-size cost for rows that are then thrown
    away. The list is derived from pghistory, so a newly tracked model is
    included automatically (no hand-maintained allowlist).
    """
    labels = set(excluded)
    return [
        model for model in event_models(references_model=obj._meta.concrete_model) if model._meta.label not in labels
    ]


def _event_model_labels(tracked_model_labels: Collection[str]) -> tuple[str, ...]:
    """Map tracked model labels to their pghistory event-model labels.

    Used when a caller may not see a related model at all: the event model is
    added to the ``across()`` exclusions, so its table is never read and an
    action containing only its rows disappears instead of rendering as an empty
    action with a misleading summary.
    """
    labels: list[str] = []
    for model_label in tracked_model_labels:
        try:
            tracked_model = apps.get_model(model_label)
        except LookupError:
            continue
        event_model = getattr(tracked_model, "pgh_event_model", None)
        if event_model is not None:
            labels.append(event_model._meta.label)
    return tuple(labels)


def _page_filter(page_keys: Sequence[str]) -> Q:
    """A SQL predicate selecting the page's rows by the raw columns, not the key.

    ``action_key`` is ``COALESCE(CAST(pgh_context_id AS text), pgh_slug)``, an
    expression no index can serve, so filtering on it would defeat the page
    query's indexes.

    Only the ``pgh_context_id`` arm is indexable. ``pgh_slug`` is not a stored
    column either -- pghistory synthesizes it in the CTE as
    ``CONCAT('<event model label>', ':', pgh_id)`` -- so that arm is still an
    expression filter over the CTE output. It is kept because context-less
    actions (writes outside the request middleware) must still be pageable, and
    they are rare enough that the arm is not worth decomposing into
    ``(pgh_model, pgh_id)`` pairs.
    """
    context_ids: list[UUID] = []
    slugs: list[str] = []
    for key in page_keys:
        try:
            context_ids.append(UUID(key))
        except ValueError:
            slugs.append(key)

    filters: list[Q] = []
    if context_ids:
        filters.append(Q(pgh_context_id__in=context_ids))
    if slugs:
        filters.append(Q(pgh_slug__in=slugs))
    if not filters:
        return Q(pk__in=[])
    page_filter = filters[0]
    for extra in filters[1:]:
        page_filter |= extra
    return page_filter


def object_audit_log(
    *,
    obj: Any,
    target_type: str,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    actor_id: Any = None,
    after: str | None = None,
    limit: int = 50,
    include_snapshot: bool = False,
    hidden_fields: Mapping[str, Collection[str]] | None = None,
    hidden_summary_models: Collection[str] = (),
) -> AuditActionPageData:
    """Return one cursor page of *obj*'s write audit log, newest action first.

    *target_type* is the ``AuditTargetType`` value (``SHELTER``/``ROOM``/``BED``/
    ``RESERVATION``) echoed onto each event. *after* is the opaque ``end_cursor``
    from a previous page; the cursor sits on the same ``(pgh_created_at,
    pgh_id, action_key)`` total order the SQL page query uses, so an event
    inserted between requests cannot shift a later page (offset pagination can
    repeat an action).

    ``date_from``/``date_to`` bound ``pgh_created_at`` (inclusive) and
    ``actor_id`` restricts to a single acting user (ADR 0004 §21). All three are
    applied as predicates on the aggregate CTE's outer SELECT — in SQL, before
    the key grouping and the Python grouping below (§10) — so a filtered-out
    event never contributes to an action.

    *hidden_fields* maps a model label to the raw attnames that must not be
    rendered for that model, and *hidden_summary_models* lists models whose
    one-line summaries must be omitted. The latter is enforced twice: its event
    model is passed to ``across()`` so the branch is pruned from the aggregate
    (an action containing only those rows then disappears instead of becoming an
    empty action), and the per-row check in ``_build_action`` is a second
    defence. Both are authorization decisions made by the caller
    (``audit/schema.py``), because this layer has no request context; they are
    applied before rendering so a withheld value cannot leak through either
    ``field_changes`` or ``snapshot``.

    Pagination is done in SQL (§10): only the page's action keys are fetched
    from the aggregate CTE. Raises ``ValueError`` for a non-positive/oversized
    ``limit`` or a malformed cursor (§10 cap): callers surface this as a
    GraphQL error.
    """
    if limit < 1 or limit > MAX_LIMIT:
        raise ValueError(f"limit must be between 1 and {MAX_LIMIT}.")
    cursor = _decode_cursor(after) if after is not None else None

    target_id = str(obj.pk)
    excluded = (
        *_EXCLUDED_EVENT_MODELS,
        *_SCOPED_EXCLUSIONS.get(target_type, ()),
        *_event_model_labels(hidden_summary_models),
    )
    base = AuditWriteEvent.objects.across(*_allowed_event_models(obj, excluded)).references([obj]).exclude(label="seed")

    # Filters are predicates on the aggregate CTE's outer SELECT (§21), applied
    # before the key grouping so a filtered-out event cannot keep an otherwise
    # empty action on the page and cannot widen an action's time span.
    if date_from is not None:
        base = base.filter(pgh_created_at__gte=date_from)
    if date_to is not None:
        base = base.filter(pgh_created_at__lte=date_to)
    if actor_id is not None:
        base = base.filter(actor_id=actor_id)

    key_expr = _action_key_expr()

    # 1) Action keys for the requested page, grouped and limited in SQL.
    #    The keys are ``pgh_created_at`` (newest first), then ``pgh_id``, then the
    #    unique action key. ``pgh_id`` alone is not a total order -- it is a
    #    per-table AutoField, so two action keys in different event tables can tie
    #    on it, and they always tie on ``pgh_created_at`` when written in one
    #    transaction (``NOW()`` is constant). Without the final key an action could
    #    be skipped or repeated across pages; the Python re-sort uses the same
    #    tuple (see ``_action_order``).
    key_query = (
        base.annotate(action_key=key_expr)
        .values("action_key")
        .annotate(last_event=Max("pgh_created_at"), last_id=Max("pgh_id"))
        .order_by("-last_event", "-last_id", "-action_key")
    )
    if cursor is not None:
        key_query = key_query.filter(
            Q(last_event__lt=cursor.event)
            | Q(last_event=cursor.event, last_id__lt=cursor.event_id)
            | Q(last_event=cursor.event, last_id=cursor.event_id, action_key__lt=cursor.action_key)
        )

    # Fetch one extra key so ``has_next_page`` is known without a count query.
    key_rows = list(key_query[: limit + 1])
    has_next_page = len(key_rows) > limit
    key_rows = key_rows[:limit]
    page_keys = [row["action_key"] for row in key_rows]
    if not page_keys:
        return AuditActionPageData(results=[], end_cursor=None, has_next_page=False)

    # 2) Fetch only the page's rows and build actions. This is a plain iteration,
    # not ``.iterator()``: the row set is already bounded by ``page_keys``, so a
    # server-side cursor buys nothing and adds a ``DECLARE``/``FETCH`` round trip.
    rows = base.annotate(action_key=key_expr).filter(_page_filter(page_keys)).order_by("pgh_created_at", "pgh_id")

    grouped: dict[str, list[Any]] = defaultdict(list)
    for row in rows:
        grouped[row.action_key].append(row)

    resolver = _LabelResolver()
    target_model_label = obj._meta.label

    # Iterate in SQL page order (newest first) rather than ``grouped`` insertion
    # order, and gate *starting* an action on the remaining page budget. An action
    # is never cut in half here, so ``truncated`` keeps its single per-action
    # meaning and no event is dropped at a page boundary; whatever does not fit is
    # served from the cursor by the next request.
    remaining = MAX_EVENTS_PER_PAGE
    actions: list[AuditActionData] = []
    for key in page_keys:
        action_rows = grouped.get(key)
        if not action_rows:
            continue
        if remaining <= 0:
            has_next_page = True
            break
        action = _build_action(
            action_rows,
            target_type=target_type,
            target_id=target_id,
            resolver=resolver,
            target_model_label=target_model_label,
            include_snapshot=include_snapshot,
            hidden_fields=hidden_fields,
            hidden_summary_models=hidden_summary_models,
        )
        actions.append(action)
        remaining -= len(action.events)

    resolver.fetch()
    for action in actions:
        action.field_changes = _finalize(action.field_changes, resolver)
        for event in action.events:
            event.field_changes = _finalize(event.field_changes, resolver)
            if event.snapshot is not None:
                event.snapshot = _finalize(event.snapshot, resolver)

    actions.sort(key=lambda a: (a.timestamp, a.order), reverse=True)
    return AuditActionPageData(
        results=actions,
        end_cursor=_encode_cursor(actions[-1]) if actions else None,
        has_next_page=has_next_page,
    )


def _build_action(
    rows: list[Any],
    *,
    target_type: str,
    target_id: str,
    resolver: _LabelResolver,
    target_model_label: str | None = None,
    include_snapshot: bool = False,
    hidden_fields: Mapping[str, Collection[str]] | None = None,
    hidden_summary_models: Collection[str] = (),
) -> AuditActionData:
    # A copy: ``rows`` is the list stored in the caller's ``grouped`` dict, so
    # sorting in place would mutate it as a hidden side effect. The ascending
    # order is load-bearing below -- ``rows[0]`` picks the actor and ``rows[-1]``
    # the action timestamp.
    rows = sorted(rows, key=lambda r: (r.pgh_created_at, r.pgh_id))
    hidden_by_model = hidden_fields or {}

    actor = _actor(rows[0])
    # Action-level changes are keyed by ``(owner model, row id, display name)``:
    # ``references()`` spans the target plus its related rows, and one action can
    # write several rows of the same model, so neither the model nor the field
    # name alone identifies a change. ``_action_change_key`` flattens the key
    # with a stable shape (the anchor bare, related rows qualified).
    scalar_changes: dict[tuple[str, Any, str], list[Any]] = {}
    m2m_changes: dict[tuple[str, Any, str], dict[str, list[_Ref]]] = defaultdict(lambda: {"removed": [], "added": []})
    events: list[AuditEventData] = []
    summarized: set[tuple[str, Any, str]] = set()
    truncated = False

    for row in rows:
        # Stop before doing any per-row work (including the action-level rollup)
        # once the cap is reached, so ``field_changes`` is bounded by the same
        # counter as ``events``.
        if len(events) >= MAX_EVENTS_PER_ACTION:
            truncated = True
            break
        # Bed/Room writes are acknowledged, not detailed (§32): the shelter log
        # renders one line per object, and the object's own log carries the rest.
        # The anchored object is never summarized -- a Bed log must detail the
        # bed's own fields. One action must not print the same object twice for
        # the same kind, so repeated saves of one bed collapse into one line.
        if row.pgh_obj_model in _SUMMARY_ONLY_MODELS and row.pgh_obj_model != target_model_label:
            # A caller without the related model's VIEW permission must not learn
            # its name or id from the shelter's summary line (§18, §32).
            if row.pgh_obj_model in hidden_summary_models:
                continue
            kind = _kind(row.pgh_label)
            summary_key = (row.pgh_obj_model, row.pgh_obj_id, kind)
            if summary_key in summarized:
                continue
            summarized.add(summary_key)
            events.append(
                AuditEventData(
                    timestamp=row.pgh_created_at,
                    actor=_actor(row),
                    kind=kind,
                    action=row.pgh_label,
                    target_type=target_type,
                    target_id=target_id,
                    field_changes={},
                    summary=_summary_line(row, kind),
                )
            )
            continue

        meta = _m2m_meta(row.pgh_model)
        if meta is not None:
            parent_pk = (row.pgh_data or {}).get(meta.parent_col)
            related_pk = (row.pgh_data or {}).get(f"{meta.related_fk_field}_id")
            ref = resolver.ref(meta.related_model_label, related_pk)
            bucket = m2m_changes[(meta.parent_model_label, parent_pk, meta.display_name)]
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
                    field_changes={meta.display_name: single},
                )
            )
            continue

        owner = row.pgh_obj_model
        # Render the raw attname keys to display names here. Two fields sharing a
        # ``verbose_name`` stay distinct because ``_display_keys`` falls back to
        # the raw field name for them (§13).
        hidden = hidden_by_model.get(owner, ())
        changes = _render_keys(_scalar_changes(row, resolver, hidden), owner)
        _merge_scalar(scalar_changes, owner, row.pgh_obj_id, changes)

        # An UPDATE whose predecessor row was purged has no diff base:
        # pghistory's read-time ``pgh_diff`` is NULL, which is not the same as
        # "the write changed nothing" (``{}``). Only UPDATE is affected --
        # INSERT/DELETE render from ``pgh_data`` and the through-table path has
        # no ``pgh_obj`` to diff against at all.
        no_base = _kind(row.pgh_label) == "UPDATE" and row.pgh_diff is None
        events.append(
            AuditEventData(
                timestamp=row.pgh_created_at,
                actor=_actor(row),
                kind=_kind(row.pgh_label),
                action=row.pgh_label,
                target_type=target_type,
                target_id=target_id,
                field_changes=None if no_base else {f: list(pair) for f, pair in changes.items()},
                snapshot=_snapshot(row, resolver, hidden) if include_snapshot else None,
            )
        )

    action_changes: dict[str, Any] = {}
    for (owner, obj_id, name), scalar_pair in scalar_changes.items():
        action_changes[_action_change_key(owner, obj_id, name, target_model_label)] = scalar_pair

    # M2M changes: cancel an add/remove of the same related row, then merge the
    # action-level multi-value entry (§13, §15).
    for (owner, obj_id, field_name), bucket in m2m_changes.items():
        added_keys = set(bucket["added"])
        removed_keys = set(bucket["removed"])
        both = added_keys & removed_keys
        added = [r for r in bucket["added"] if r not in both]
        removed = [r for r in bucket["removed"] if r not in both]
        if removed or added:
            action_changes[_action_change_key(owner, obj_id, field_name, target_model_label)] = [removed, added]

    # Derive the verb from the anchored object's rows, not every related row.
    # ``references()`` spans the target's neighbors, so deriving from all rows
    # let a Bed/media INSERT alone read as "created shelter" even though the
    # shelter itself was untouched. A related-only action is a modification of
    # the anchor. The row list is used rather than the rendered events so a
    # capped action still contributes its operation kind.
    anchor_rows = [row for row in rows if row.pgh_obj_model == target_model_label]
    kinds = {_kind(row.pgh_label) for row in anchor_rows}
    if kinds == {"INSERT"}:
        verb = "created"
    elif kinds == {"DELETE"}:
        verb = "deleted"
    else:
        verb = "modified"

    last_id, order_key = _action_order(rows)
    timestamp = rows[-1].pgh_created_at if rows else timezone.now()
    return AuditActionData(
        timestamp=timestamp,
        actor=actor,
        summary=f"{actor} {verb} {target_type.lower()} {target_id}",
        events=events,
        field_changes=action_changes,
        order=f"{last_id:012d}:{order_key}",
        last_id=last_id,
        order_key=order_key,
        truncated=truncated,
    )
