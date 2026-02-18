# Optimizations for `icontains` Search

When you need substring search (e.g. "contains" rather than "starts with"), `icontains` cannot use a normal B-tree index because of the leading `%` in `ILIKE '%term%'`. These optimizations keep `icontains` fast at scale.

## 1. **Trigram indexes (pg_trgm)** — primary lever

PostgreSQL’s **pg_trgm** extension supports GIN (or GiST) indexes that can speed up `ILIKE '%term%'` and `LIKE '%term%'`.

- The project already enables **pg_trgm** in `tasks/migrations/0001_initial.py` and uses **GIN trigram** indexes on `Task.summary` and `Task.description`.
- Add the same style of index on every column (or related model column) you filter with `icontains`.

**Where `icontains` is used and good index candidates:**

| Location | Field(s) | Model / Table |
|----------|----------|----------------|
| `tasks/types.py` | summary, description | `Task` — **already indexed** |
| `tasks/types.py` | first_name, middle_name, last_name, nickname | `ClientProfile` (via FK) |
| `notes/types.py` | first_name, last_name, public_details | `ClientProfile`, `Note` |
| `notes/types.py` | first_name, last_name, middle_name | `User` (InteractionAuthorFilter) |
| `hmis/types.py` | first_name, last_name, title, note | `HmisClientProfile`, `HmisNote` |
| `accounts/types.py` | name | `Organization` (from `organizations` app) |
| `accounts/schema.py` | permission_groups__name | `auth_group.name` |

**Example index definition (Django):**

```python
from django.contrib.postgres.indexes import GinIndex

class Meta:
    indexes = [
        GinIndex(name="clientprofile_first_name_trgm", fields=["first_name"], opclasses=["gin_trgm_ops"]),
        GinIndex(name="clientprofile_last_name_trgm",  fields=["last_name"],  opclasses=["gin_trgm_ops"]),
        # ... same for other searchable text fields
    ]
```

- Use one GIN trigram index per column (or one multi-column GIN if your queries always use the same combination). Single-column is usually enough and matches your existing Task pattern.
- **Note:** `pg_trgm` must be installed (already done in this project). For apps that don’t depend on `tasks`, add `migrations.RunSQL("CREATE EXTENSION IF NOT EXISTS pg_trgm;")` in a migration that runs before the one that adds the index, or depend on a migration that does it.

## 2. **Filter first, search second**

Apply filters that **can** use indexes (equality, range, FKs) **before** the `icontains` filter so the trigram index (or scan) runs on fewer rows.

- Example: filter by `organization_id`, `interacted_at` range, or `status` first, then apply `icontains` on the remaining queryset.
- Ensures index seeks on `organization_id` / dates / status, and only then substring matching.

## 3. **Minimum search term length**

Short terms (1–2 characters) match many rows and still touch a lot of index entries with pg_trgm. Where acceptable:

- Require a minimum length (e.g. 3 characters) before applying `icontains`.
- Reject or ignore single-character (and optionally two-character) terms in the resolver so the DB never runs `ILIKE '%x%'` on large tables.

## 4. **Limit and paginate**

- Always use a bounded `limit` / pagination (e.g. `OffsetPaginated` or `first`) so the planner can stop after N rows.
- Avoid `count()` on the full result set when you only need the first page; that forces evaluation of all matches.

## 5. **Avoid selecting heavy columns when not needed**

- When resolving a paginated list (e.g. IDs and a few fields), use `.only()` / `.defer()` so large text fields (e.g. `public_details`, `note`, `description`) aren’t loaded if the client doesn’t request them.
- Reduces I/O and memory after the index has already narrowed the set.

## 6. **Full-text search (alternative for “search” UX)**

If the goal is “search over documents” with ranking and phrases rather than exact substring:

- Use PostgreSQL **full-text search** (`SearchVector` / `SearchQuery` / `SearchRank`) on a dedicated `tsvector` column (or expression) with a GIN index.
- Better for ranking and phrase matching; more setup (migrations, possibly triggers to keep `tsvector` updated). Use this when you outgrow “filter by substring” UX.

## 7. **Caching (for repeated queries)**

- Cache results for identical (or normalized) search parameters with a short TTL (e.g. 30–60 seconds) to avoid repeating the same heavy query.
- Especially useful for autocomplete or popular searches.

## 8. **Organization / Group name (external tables)**

- `Organization` and `auth_group` come from installed apps. You can still add trigram indexes via a **data migration** using `RunSQL` (e.g. `CREATE INDEX ... ON organizations_organization USING gin (name gin_trgm_ops);` and similar for `auth_group.name`) if you control the DB and need to optimize those `icontains` filters.

---

**Summary:** The largest win is adding **GIN trigram indexes** on every column (and related model column) used in `icontains`, then **filtering by indexed columns first** and enforcing **minimum term length** and **pagination**.
