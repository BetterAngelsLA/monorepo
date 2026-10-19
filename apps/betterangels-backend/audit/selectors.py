"""Write-audit-log selector.

Normalizes pghistory write events for a single object into one event shape,
groups events into actions, and orders actions newest-first (ADR 0004 §10–§19).

The write source is a single ``AuditWriteEvent.objects.references(obj)`` query
(§10): it already aggregates the object's own events (via ``pgh_obj``) and every
event model with an FK to the object — including the §6 through-table proxies.
``_through_event_meta()`` is rendering metadata (derived from pghistory
introspection) only, never a second query source.

Pagination is applied in SQL (§10): the page's action keys are selected with a
grouped ``LIMIT``/``OFFSET`` query, then only those keys' rows are fetched, so
page size does not scale the work with the object's total history.
"""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Any

from django.apps import apps
from django.db.models import Max, Model, TextField
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

# The single deliberate exclusion from a Shelter's log (§10). ``references()``
# unions every event model with an FK to the target, so this is a blocklist
# (default-inclusive) rather than a hand-maintained allowlist.
_EXCLUDED_EVENT_MODELS = ("referrals.ReferralEvent",)

# Additional, target-scoped exclusions. A Room/Bed log is about that object's
# own configuration and occupancy, not every reservation that ever referenced
# it (``references()`` includes ``ReservationEvent`` via its ``room_id``/
# ``bed_id``, which is the main volume driver for a busy room/bed). Reservation
# history is still available via ``objectAuditLog(RESERVATION)``.
_SCOPED_EXCLUSIONS: dict[str, tuple[str, ...]] = {
    "ROOM": ("shelters.ReservationEvent",),
    "BED": ("shelters.ReservationEvent",),
}

# Labels that are recorded but rendered as a reason rather than an actor (§11).
_SYSTEM_REASON_LABELS = frozenset({"import", "clone"})


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
    timestamp: Any
    actor: str
    kind: str
    action: str
    target_type: str
    target_id: str
    field_changes: dict[str, Any]
    # Full object state as of the event (§13), rendered from ``pgh_data``. Only
    # populated when the caller opts in; ``None`` for M2M rows.
    snapshot: dict[str, Any] | None = None


@dataclass
class AuditActionData:
    timestamp: Any
    actor: str
    summary: str
    events: list[AuditEventData] = field(default_factory=list)
    field_changes: dict[str, Any] = field(default_factory=dict)
    # Total-order tie-break for the Python re-sort, mirroring the SQL page order
    # (``pgh_id`` then the action key; see ``_action_order``). It is a string so
    # both sorts share one comparison.
    order: str = ""


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


def _actor(row: Any) -> str:
    label = row.label
    if label in _SYSTEM_REASON_LABELS:
        return f"system ({label})"
    if row.actor_name:
        return str(row.actor_name)
    if row.actor_id and row.actor_email:
        return str(row.actor_email)
    return "system"


def _m2m_meta(pgh_model: str) -> _ThroughMeta | None:
    """The through-table rendering metadata for a through event, if any (§19)."""
    return _through_event_meta().get(pgh_model)


def _scalar_changes(row: Any, resolver: _LabelResolver) -> dict[str, list[Any]]:
    """Render a non-M2M row's own changes, keyed by **raw column name** (§13).

    Raw (attname) keys keep the dict lossless: two fields that share a
    ``verbose_name`` are distinct here even though they render to the same label.
    ``_display_keys`` maps them to display names at the edges (per-event
    ``field_changes``, the action rollup, the snapshot).
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
    hidden = _MECHANICAL_FIELDS | ({pk_attname} if pk_attname else set())

    if label.endswith(".add"):
        return {f: [None, render(f, v)] for f, v in data.items() if v is not None and f not in hidden}
    if label.endswith(".remove"):
        return {f: [render(f, v), None] for f, v in data.items() if v is not None and f not in hidden}

    diff = row.pgh_diff or {}
    return {f: [render(f, old), render(f, new)] for f, (old, new) in diff.items() if f not in _MECHANICAL_FIELDS}


def _render_keys(changes: dict[str, Any], model_label: str) -> dict[str, Any]:
    """Re-key a raw-``attname`` change map to display names (§13)."""
    keys = _display_keys(model_label)
    return {keys.get(f, f): value for f, value in changes.items()}


def _snapshot(row: Any, resolver: _LabelResolver) -> dict[str, Any]:
    """Render the full object state carried by ``pgh_data`` (§13).

    Exposes the snapshot pghistory already stores per event (one column per
    tracked field) — no extra storage. FK ids are resolved and choices rendered
    like any other change; mechanical/``pgh_*`` columns are dropped.
    """
    data = row.pgh_data or {}
    obj_model = row.pgh_obj_model
    fk_fields = _fk_fields(obj_model)
    fields = _field_meta(obj_model)
    keys = _display_keys(obj_model)

    snapshot: dict[str, Any] = {}
    for field_name, value in data.items():
        if field_name in _MECHANICAL_FIELDS or field_name.startswith("pgh_"):
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


def _action_order(rows: list[Any]) -> str:
    """The action's total-order key, shared by the SQL page query and the Python
    re-sort (§10).

    ``pgh_id`` is a per-table ``AutoField``, so it is only chronological *within*
    an event table; two actions in different tables can tie on it, and they always
    tie on ``pgh_created_at`` when they are written in one transaction (``NOW()``
    is constant). Appending the (unique) action key makes the order total, so no
    action can be skipped or duplicated across pages. Fixed-width zero padding
    keeps its lexicographic order equal to numeric order.
    """
    last_id = max((row.pgh_id for row in rows), default=0)
    return f"{last_id:012d}:{rows[0].action_key}"


def object_audit_log(
    *,
    obj: Any,
    target_type: str,
    limit: int = 50,
    offset: int = 0,
    include_snapshot: bool = False,
) -> list[AuditActionData]:
    """Return the write audit log for *obj*, newest action first.

    *target_type* is the ``AuditTargetType`` value (``SHELTER``/``ROOM``/``BED``/
    ``RESERVATION``) echoed onto each event. Pagination is done in SQL (§10):
    only the requested page's action keys are fetched from the aggregate CTE.

    Raises ``ValueError`` for a non-positive/oversized ``limit`` or a negative
    ``offset`` (§10 cap): callers surface this as a GraphQL error.
    """
    if limit < 1 or limit > MAX_LIMIT:
        raise ValueError(f"limit must be between 1 and {MAX_LIMIT}.")
    if offset < 0:
        raise ValueError("offset must be non-negative.")

    target_id = str(obj.pk)
    excluded = (*_EXCLUDED_EVENT_MODELS, *_SCOPED_EXCLUSIONS.get(target_type, ()))
    base = AuditWriteEvent.objects.references([obj]).exclude(pgh_model__in=excluded).exclude(label="seed")
    key_expr = _action_key_expr()

    # 1) Action keys for the requested page, grouped and limited in SQL.
    #    The keys are ``pgh_created_at`` (newest first), then ``pgh_id``, then the
    #    unique action key. ``pgh_id`` alone is not a total order -- it is a
    #    per-table AutoField, so two action keys in different event tables can tie
    #    on it, and they always tie on ``pgh_created_at`` when written in one
    #    transaction (``NOW()`` is constant). Without the final key an action could
    #    be skipped or repeated across pages; the Python re-sort uses the same
    #    tuple (see ``_action_order``).
    key_rows = (
        base.annotate(action_key=key_expr)
        .values("action_key")
        .annotate(last_event=Max("pgh_created_at"), last_id=Max("pgh_id"))
        .order_by("-last_event", "-last_id", "-action_key")[offset : offset + limit]
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
    target_model_label = obj._meta.label
    actions = [
        _build_action(
            action_rows,
            target_type=target_type,
            target_id=target_id,
            resolver=resolver,
            target_model_label=target_model_label,
            include_snapshot=include_snapshot,
        )
        for action_rows in grouped.values()
    ]

    resolver.fetch()
    for action in actions:
        action.field_changes = _finalize(action.field_changes, resolver)
        for event in action.events:
            event.field_changes = _finalize(event.field_changes, resolver)
            if event.snapshot is not None:
                event.snapshot = _finalize(event.snapshot, resolver)

    actions.sort(key=lambda a: (a.timestamp, a.order), reverse=True)
    return actions


def _build_action(
    rows: list[Any],
    *,
    target_type: str,
    target_id: str,
    resolver: _LabelResolver,
    target_model_label: str | None = None,
    include_snapshot: bool = False,
) -> AuditActionData:
    rows.sort(key=lambda r: (r.pgh_created_at, r.pgh_id))

    actor = _actor(rows[0])
    # Action-level changes are keyed by ``(owner model, row id, display name)``:
    # ``references()`` spans the target plus its related rows, and one action can
    # write several rows of the same model, so neither the model nor the field
    # name alone identifies a change. ``_action_change_key`` flattens the key
    # with a stable shape (the anchor bare, related rows qualified).
    scalar_changes: dict[tuple[str, Any, str], list[Any]] = {}
    m2m_changes: dict[tuple[str, Any, str], dict[str, list[_Ref]]] = defaultdict(lambda: {"removed": [], "added": []})
    events: list[AuditEventData] = []

    for row in rows:
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
        changes = _render_keys(_scalar_changes(row, resolver), owner)
        _merge_scalar(scalar_changes, owner, row.pgh_obj_id, changes)

        events.append(
            AuditEventData(
                timestamp=row.pgh_created_at,
                actor=_actor(row),
                kind=_kind(row.pgh_label),
                action=row.pgh_label,
                target_type=target_type,
                target_id=target_id,
                field_changes={f: list(pair) for f, pair in changes.items()},
                snapshot=_snapshot(row, resolver) if include_snapshot else None,
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

    kinds = {event.kind for event in events}
    if kinds == {"INSERT"}:
        verb = "created"
    elif kinds == {"DELETE"}:
        verb = "deleted"
    else:
        verb = "modified"

    timestamp = rows[-1].pgh_created_at if rows else timezone.now()
    return AuditActionData(
        timestamp=timestamp,
        actor=actor,
        summary=f"{actor} {verb} {target_type.lower()} {target_id}",
        events=events,
        field_changes=action_changes,
        order=_action_order(rows),
    )
