# Client Merge Feature — Final Design

**Issue:** [DEV-2451](https://betterangels.atlassian.net/browse/DEV-2451) (related)
**Date:** 2026-06-29
**Scope:** Django admin MVP with soft-delete undo. React admin later.

---

## 1. Overview

Allow admins to merge 2+ duplicate `ClientProfile` records into one. The merge:

- Re-points all related objects (notes, contacts, documents, etc.) from source profiles → target profile
- Merges scalar fields (target's non-null values win; target's nulls filled from sources)
- Soft-deletes sources via `merged_into` FK (reversible)
- Produces a preview diff before executing
- Stores a snapshot for undo

### What's NOT in scope

- HMIS deduplication (explicitly excluded)
- GraphQL merge mutations (admin-only MVP)
- React admin merge UI (admin-only MVP)
- File cleanup (profile_photo) — files are copied from the first source with a photo to a target without one; source photo files are NOT deleted
- Guardian removal — orthogonal project, handled correctly by re-pointing GFK

---

## 2. Data Model Changes

### New fields on `ClientProfile` (one migration)

```python
# clients/models.py

class ClientProfile(AbstractClientProfile):
    # ... existing fields unchanged ...

    merged_into = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="merged_from",
        help_text="If set, this profile has been merged into another."
    )
    merged_at = models.DateTimeField(null=True, blank=True)
    merged_data = models.JSONField(
        null=True,
        blank=True,
        help_text="Snapshot of moved object IDs for undo."
    )
```

- All nullable → no existing data affected
- `merged_data` stores per-source snapshot: `{ "moved_objects": { "notes": [5,7,12], ... } }`

---

## 3. Relationship Map — All Objects Re-pointed During Merge

| # | Model | Relationship | `on_delete` | Re-point method |
|---|---|---|---|---|
| 1 | `HmisProfile` | FK → ClientProfile | CASCADE | `update(client_profile_id=target_id)` |
| 2 | `SocialMediaProfile` | FK → ClientProfile | CASCADE | `update(client_profile_id=target_id)` |
| 3 | `ClientContact` | FK → ClientProfile | CASCADE | `update(client_profile_id=target_id)` |
| 4 | `ClientHouseholdMember` | FK → ClientProfile | CASCADE | `update(client_profile_id=target_id)` |
| 5 | `Note` (notes app) | FK → ClientProfile | CASCADE | `update(client_profile_id=target_id)` |
| 6 | `ServiceRequest` (notes app) | FK → ClientProfile | CASCADE | `update(client_profile_id=target_id)` |
| 7 | `Referral` (referrals app) | FK → ClientProfile | SET_NULL | `update(client_profile_id=target_id)` |
| 8 | `ReservationClient` (shelters) | FK → ClientProfile | CASCADE | `update` + dedup on unique constraint |
| 9 | `Attachment` (common) | GFK → ClientProfile | CASCADE | `update(object_id=target_id)` where content_type matches |
| 10 | `PhoneNumber` (common) | GFK → ClientProfile | CASCADE | `update(object_id=target_id)` where content_type matches |
| 11 | `ClientProfileImportRecord` | FK → ClientProfile | SET_NULL | `update(client_profile_id=target_id)` |
| 12 | `BigUserObjectPermission` (guardian) | GFK → ClientProfile | CASCADE | `update(object_pk=target_id)` where content_type matches |
| 13 | `BigGroupObjectPermission` (guardian) | GFK → ClientProfile | CASCADE | `update(object_pk=target_id)` where content_type matches |

**Discovery method:** `FK` relations auto-discovered via `ClientProfile._meta.related_objects`. `GFK` relations are hardcoded (only 3: `Attachment`, `PhoneNumber`, guardian permissions) — new GFKs require adding to the list.

---

## 4. Service Layer

**File:** `clients/services/merge.py`

### 4.1 Dataclasses

```python
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class FieldChange:
    field_name: str
    source_values: list  # [source_a_value, source_b_value, ...]
    target_value: Any
    resolution: str      # "target_wins" | "filled_from_source" | "conflict"

@dataclass
class RelatedChange:
    relation_name: str      # e.g. "notes", "contacts"
    model_label: str        # e.g. "notes.Note"
    will_move: int          # total count
    per_source: dict[int, list[int]]  # source_id → [object_ids]

@dataclass
class MergePreview:
    target_id: int
    source_ids: list[int]
    target_name: str
    source_names: list[str]
    field_changes: list[FieldChange]
    related_changes: list[RelatedChange]
    conflicts: list[str]
    generated_at: datetime = field(default_factory=timezone.now)
```

### 4.2 Core Functions

```python
def preview_merge(
    source_ids: list[int],
    target_id: int,
) -> MergePreview:
    """
    Dry-run. Returns MergePreview without mutating anything.
    Uses DeepDiff for field-level comparison.
    Introspects ClientProfile._meta.related_objects for FK discovery.
    """

def execute_merge(
    source_ids: list[int],
    target_id: int,
    *,
    performed_by: User,
) -> ClientProfile:
    """
    Atomic merge inside transaction.atomic():
    1. select_for_update on target + all sources
    2. Validate: no source already merged, target not in sources
    3. Merge scalar fields (target wins non-null, fill nulls from first source with value)
    4. For each FK relation: capture IDs, then .update(client_profile_id=target_id)
    5. For each GFK relation: capture IDs, then .update(object_id=target_id)
    6. Handle ReservationClient dedup (delete source row if target already in same reservation)
    7. Clear source unique fields (email, california_id → None)
    8. Set source.merged_into = target, source.merged_at = now
    9. Store snapshot in source.merged_data
    10. Save target
    Returns target profile.
    """

def undo_merge(
    target_id: int,
    *,
    performed_by: User,
) -> list[ClientProfile]:
    """
    Reverse a merge.
    1. For each source in target.merged_from.all():
       a. Read source.merged_data snapshot
       b. Re-point objects back using stored IDs
       c. Restore scalar fields from snapshot
       d. Clear source.merged_into, merged_at, merged_data
    Transaction is atomic — all-or-nothing.
    Gracefully skips objects deleted post-merge (logs warning).
    """
```

### 4.3 Scalar Field Merge Rules

```
For each field on ClientProfile:
  if target.field is not None → keep target's value (target_wins)
  elif any source has non-null → take first non-null (filled_from_source)
  else → leave as None

Special handling:
  email        — if both target and source have different values → CONFLICT (target kept, source's cleared)
  california_id — same as email
```

### 4.4 ReservationClient Dedup

```python
# If source and target are in the same reservation:
conflicting = ReservationClient.objects.filter(
    reservation__in=source_reservation_ids,
    client_profile_id=target_id,
)
# Delete source's ReservationClient rows that conflict
ReservationClient.objects.filter(
    client_profile_id__in=source_ids,
    reservation__in=conflicting.values("reservation_id"),
).delete()
```

---

## 5. Django Admin UI

**File:** `clients/admin.py` (add to `ClientProfileAdmin`)
**Templates:** `templates/admin/clients/clientprofile/merge_preview.html`, `merge_confirm.html`

### 5.1 Actions

```python
class ClientProfileAdmin(...):
    actions = [..., "merge_clients"]

    @admin.action(description="Merge selected clients")
    def merge_clients(self, request, queryset):
        if queryset.count() < 2:
            self.message_user(request, "Select at least 2 clients.", messages.ERROR)
            return
        # Redirect to intermediate page
        ids = ",".join(str(pk) for pk in queryset.values_list("pk", flat=True))
        return redirect(f"merge/?ids={ids}")
```

### 5.2 Views (via `get_urls`)

| URL | Method | Action |
|---|---|---|
| `merge/` | GET | Show client cards, radio select target |
| `merge/` | POST (preview) | Generate & render MergePreview |
| `merge/` | POST (confirm) | Execute merge, redirect to target detail |
| `<id>/merge/undo/` | GET | Undo confirmation page |
| `<id>/merge/undo/` | POST | Execute undo |

### 5.3 List View Changes

```python
def get_queryset(self, request):
    qs = super().get_queryset(request)
    if not request.GET.get("show_merged"):
        qs = qs.filter(merged_into__isnull=True)
    return qs

# Add list_filter for merged status
list_filter = [..., "merged_into"]
```

### 5.4 UX Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1 — List View                                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ☑ Tod Johnson     ☑ Tod Jonson     ☑ Todd Johnson        │   │
│  │ ☐ Jane Smith      ☐ Bob Wilson                          │   │
│  │                                                          │   │
│  │ [Action: Merge selected clients ▼] [Go]                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                      │
│  STEP 2 — Select Target                                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Select which profile to keep:                             │   │
│  │                                                          │   │
│  │ ○ Tod Johnson     ID: 42   email: tod@test.com           │   │
│  │ ○ Tod Jonson      ID: 57   email: —                      │   │
│  │ ● Todd Johnson    ID: 89   email: todd@test.com          │   │
│  │                                                          │   │
│  │ [Preview Merge]                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                      │
│  STEP 3 — Preview Diff                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ⚠️ Conflicts                                             │   │
│  │   email: target has "todd@test.com", source has          │   │
│  │          "tod@test.com" → target's kept                  │   │
│  │                                                          │   │
│  │ 📋 Field Changes                                         │   │
│  │   first_name: "Todd" ← target wins                       │   │
│  │   nickname: "T" ← filled from source                     │   │
│  │                                                          │   │
│  │ 🔗 Related Objects (will move to target)                 │   │
│  │   Notes:      5  (from ID 42: 3, from ID 57: 2)         │   │
│  │   Contacts:   2  (from ID 42: 2)                         │   │
│  │   Documents:  8  (from ID 42: 4, from ID 57: 4)         │   │
│  │   HMIS:       3  (from ID 42: 1, from ID 57: 2)         │   │
│  │   ...                                                    │   │
│  │                                                          │   │
│  │ 🗑️ Will be marked merged: ID 42, ID 57                  │   │
│  │                                                          │   │
│  │ [← Back]  [Confirm Merge]                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                      │
│  STEP 4 — Done                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ✅ Successfully merged 2 clients into Todd Johnson (#89).│   │
│  │ [View merged profile]  [Undo merge]                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Undo

### Trigger
- From target's detail page: "Undo Last Merge" button (visible only when `merged_from` is non-empty)
- From list view: merged profiles show "Merged → #89" badge with undo link

### Mechanism
1. Read `merged_from.all()` on the target
2. For each source, read `source.merged_data["moved_objects"]`
3. Re-point objects back using the stored IDs
4. Restore scalar field values from snapshot
5. Clear `merged_into`, `merged_at`, `merged_data`

### Constraints
- Only undoes the LAST merge (sources with `merged_into == target`)
- If target itself was merged into another profile → error
- If objects were deleted post-merge → skip, log warning, continue

---

## 7. Data Integrity & Constraints

| Concern | Handling |
|---|---|
| **Unique fields** (`email`, `california_id`) | Target's value wins. Source's cleared to `None`. Undo restores from snapshot. |
| **ReservationClient duplicate** | Delete source's row if target already in same reservation. |
| **Concurrent merges** | `select_for_update` on all involved profiles in transaction. |
| **Source already merged** | Validation error — `merged_into__isnull` required. |
| **Target in source list** | Validation error. |
| **Nested merges** (A→B, then B→C) | Prevented: target must have `merged_into__isnull`. |
| **Transaction atomicity** | `@transaction.atomic` on both merge and undo. |
| **pghistory** | Bulk `.update()` won't fire pghistory signals. `merged_data` snapshot serves as audit trail. |
| **S3 files (Attachments)** | Not affected — only `object_id` DB column changes. |

---

## 8. Testing Strategy

### 8.1 Files

```
clients/tests/
├── test_merge_service.py      # ~25 unit tests
└── test_merge_admin.py        # ~10 integration tests
```

### 8.2 Unit Tests (`test_merge_service.py`)

| Category | Tests |
|---|---|
| **Preview** | two clean sources, no changes when all null, source can't be target, already-merged rejection, counts per relation type |
| **Execute** | basic merge (all relation types), scalar merge rules, GFK re-pointing, ReservationClient dedup, guardian permission re-pointing, snapshot storage, transaction atomicity, unique field clearing |
| **Undo** | restore relations, restore scalars, clear merged_into, target-already-merged error, handles deleted objects gracefully |
| **Edge cases** | single source, empty list, email conflict, california_id conflict, nested merge prevention |

### 8.3 Integration Tests (`test_merge_admin.py`)

| Category | Tests |
|---|---|
| **Action** | appears in dropdown, <2 selected error, redirect to intermediate |
| **Intermediate page** | client cards rendered, radio default/change, preview button |
| **Preview page** | field changes rendered, conflict highlighting, relation counts |
| **Confirm** | executes merge, success message, redirect |
| **Undo** | link visibility, confirmation page, execute, success |
| **List view** | merged hidden by default, show-merged filter toggle |

### 8.4 Test Helper

```python
# clients/tests/utils.py
def create_client_with_related(*, first_name: str, **kwargs) -> ClientProfile:
    """Create a client with 2 notes, 1 contact, 2 documents, 1 phone, 1 HMIS profile."""
```

---

## 9. File Plan

| File | Action | Lines (est.) |
|---|---|---|
| `clients/models.py` | Add `merged_into`, `merged_at`, `merged_data` fields | +8 |
| `clients/migrations/XXXX_merge_fields.py` | Auto-generated migration | ~30 |
| `clients/services/merge.py` | New: dataclasses + preview + execute + undo | ~250 |
| `clients/admin.py` | Add merge action, views, queryset filter, list_filter | ~150 |
| `templates/admin/clients/clientprofile/merge_intermediate.html` | New template | ~60 |
| `templates/admin/clients/clientprofile/merge_preview.html` | New template | ~80 |
| `templates/admin/clients/clientprofile/merge_undo.html` | New template | ~50 |
| `clients/tests/test_merge_service.py` | New: ~25 tests | ~400 |
| `clients/tests/test_merge_admin.py` | New: ~10 tests | ~200 |
| `clients/tests/utils.py` | Add `create_client_with_related` helper | ~40 |
| **Total** | | **~1,270** |

---

## 10. Dependencies Used

| Tool | Usage |
|---|---|
| `deepdiff` (already installed) | Field-level diff in `preview_merge()` |
| `dataclasses` (stdlib) | Typed `MergePreview`, `FieldChange`, `RelatedChange` |
| `django.db.models.fields.reverse_related.ManyToOneRel` | Dynamic FK discovery |
| `django.contrib.contenttypes.models.ContentType` | GFK lookups |
| `django.template.response.TemplateResponse` | Admin intermediate pages |
| `transaction.atomic()` | Merge/undo atomicity |
| `select_for_update` | Concurrency safety |
