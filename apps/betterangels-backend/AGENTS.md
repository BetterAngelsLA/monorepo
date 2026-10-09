# AGENTS — betterangels-backend

Django + Strawberry GraphQL + Celery. Canonical rules: `docs/ai-instructions.md` and
[`docs/styleguides/python.md`](../../docs/styleguides/python.md) (the HackSoft
service/selector pattern there is authoritative). GraphQL error shapes:
[`docs/graphql_errors.md`](docs/graphql_errors.md).

## Commands (run from the workspace root)

| Task | Command |
| --- | --- |
| All tests | `yarn nx test betterangels-backend` |
| Single test file | `ynx-test-be <path>` (app-relative, root-relative, or absolute) |
| Lint | `ynx-lint-be` — ruff check + `ruff format --check` over **every** file in the project |
| Typecheck | `yarn nx run betterangels-backend:typecheck` (strict mypy) |
| Migrations | `ynx-makemigrations` · `ynx-migrate` · `ynx-check-migrations` (CI gate) |
| Django shell | `ynx-splus` |
| Raw | `uv run python manage.py ...` from `apps/betterangels-backend` |

## Test database isolation

One Postgres test DB is shared by every checkout and session. Pass
`POSTGRES_TEST_NAME=<unique>` (with `--create-db` when you need a fresh DB) whenever
another session or worktree could be running — never set it in `.env`.

## Architecture rules

- Business logic in `<app>/services.py` (keyword-only args, typed, `full_clean()` before
  `save()`); reads in `<app>/selectors.py`; thin Strawberry resolvers in
  `schema.py`/`types.py`. No business logic in models, signals, or resolvers.
- Permissions: `PermissionSet` inner classes via `common/permissions/registry.py`;
  refusals via `common/permissions/gates.py` (`require_can`, `org_or_deny`, `get_writable_or_deny`).
- Org scoping: cut-over mutations take the acting org from the payload / row
  (`org_or_deny` / the scoped load) — the `X-Organization-ID` header is retired
  (DEV-2566); never `resolve_permission_group` by first match except the notes import/legacy-compat surfaces.
  `Team` is org-scoped; resolve via `teams.services.resolve_team_id_for_org`.
- Caseworkers hold object-level CHANGE/DELETE only on Note/Task — update/delete through
  the scoped selectors (`writable`/`get_writable_or_deny`), not `HasOrgPerm(CHANGE/DELETE)` (retired).
- Cross-org READS are deliberate product behavior (platform-shared client profiles);
  writes stay org-owned.
- Validation layering: field validator → `clean()` → service (needs a query) →
  `Meta.constraints` (must hold for concurrent writers). Duplicate the call, never the
  rule.
- Strawberry inputs: `Maybe[ID]` without a default omits to `None`; use
  `strawberry.UNSET` to distinguish omitted vs provided; explicit `null` is rejected.
  Unwrap via `maybe_value`/`maybe_int_value` in `common/graphql/utils.py`.

## Testing

- pytest + factory_boy baker recipes (`<app>/tests/baker_recipes.py`); VCR cassettes for
  external HTTP (`test_utils/vcr_config.py`); test files mirror source layout.
- Some tests assert exact query counts — adding a nested `transaction.atomic` adds
  +2 queries (SAVEPOINT/RELEASE) and breaks them. Keep services plain units of work;
  wrap transactions at call sites.
- `User.save()` lowercases email. Deactivation is a BA-platform-admin action; removing an
  org member never deactivates the `User`.

## Gotchas

- In a git worktree, mypy resolves its Django bootstrap to MAIN. Override:
  `PYTHONPATH=/workspace/.worktrees/<wt>/apps/betterangels-backend mypy --config-file <wt>/mypy.ini ...`
