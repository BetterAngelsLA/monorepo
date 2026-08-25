# Python / Django Styleguide

**Primary reference:** [HackSoftware Django-Styleguide](https://github.com/HackSoftware/Django-Styleguide).
This summary covers the patterns used in this project. For deeper rules or rationale
not covered here, consult the full guide.

## Architecture

The project follows HackSoft's service/selector pattern with GraphQL (Strawberry)
as the API layer instead of Django REST Framework.

- **Services** (`services.py`) — all business logic lives here. Functions (or classes
  for multi-step flows) that take keyword-only arguments, are fully type-annotated,
  and call `full_clean()` before `save()`. Never put business logic in models,
  signals, or GraphQL resolvers.
- **Selectors** (`selectors.py`) — read-only queries returning querysets or lists.
  Handle filtering, pagination, and permission-aware data fetching.
- **API layer (GraphQL schema + types)** — thin Strawberry resolvers that parse
  inputs and delegate to services/selectors. `schema.py` defines queries and
  mutations; `types.py` defines Strawberry types for input/output.
- **Permissions** — `ModelPermissionSet` inner classes on models (via
  `common/permissions/utils.py`) replace the old per-file `permissions.py` pattern.
  See the `@monorepo/ba-platform/permissions` package for the matching frontend permission enums.
- **Models** — inherit `BaseModel` (from `common/models.py`) which provides
  `created_at`/`updated_at` and a `PermissionSet` hook. Keep models lean — push
  logic to services, queries to selectors, and see Validation below for what
  belongs on the model.

### Validation

Push each rule to the lowest layer that can express it.

- **Single-field content or format** — a field validator (`validators=[...]`), defined in
  `<app>/validators.py`. It runs from ModelForm field cleaning too, so the admin is
  covered by one definition. Note it is not a database guarantee.
- **Consistency of what is already on the instance** — `clean()`. Comparing two fields, or
  two FKs the caller has already chosen, belongs here.
- **Anything that needs a query, or decides using data the caller did not supply** — the
  service. Existence and uniqueness checks are the common cases; HackSoft moves these out
  of `clean()` because they span relations and fetch additional data.
- **Must hold for every writer, including concurrent ones** — `Meta.constraints`, with
  `violation_error_message` set; the default message only names the constraint. An
  expression-based `UniqueConstraint` (e.g. on `Lower("name")`) cannot name the field, so
  pair it with a service check when the message matters.
- Duplicate the **call**, never the **rule**. A shared function in `validators.py` may be
  called from both a service and `clean()` when a non-service writer can violate it. Say in
  the docstring which call is the redundant one, so the right one is deleted later.
- **Services call `full_clean()` before `save()`.** Without it, none of the model-side rules
  above are reachable from the API — only from the admin's ModelForm. `clean()` does not run
  on `objects.create()`, `bulk_create()`, `queryset.update()`, `loaddata`, or in the shell.

## Testing

- Use `pytest` with Django (`pytest-django`)
- Test services and selectors as the primary test surface
- Use `factory_boy` for test data; define baker recipes in `tests/baker_recipes.py`
- Use VCR cassettes (`test_utils/vcr_config.py`) for external HTTP calls
- Test files mirror source structure: `tests/test_services.py`, `tests/test_queries.py`

### Give each checkout its own test database

Django derives the test database name from `POSTGRES_NAME`, which is `postgres` in
every `.env` — so every worktree, container shell and coding-agent session shares
one `test_postgres`. `addopts = "--reuse-db"` hides that most of the time, but
`pytest --create-db` drops and recreates it underneath anyone else mid-run.

The symptom is failures that escalate and move between runs of _unchanged_ code —
5, then 14, then every test in the suite erroring, in apps you never touched.
That is not a defect in your branch. Set `POSTGRES_TEST_NAME` before concluding
anything about a failure you cannot reproduce:

```bash
POSTGRES_TEST_NAME=test_myworktree uv run pytest -q --create-db
```

Pass it on the command that needs it rather than writing it into `.env`. The
shared database is the default on purpose: it is what a developer gets running
the same command by hand, and a checkout permanently pointed elsewhere both
hides that and leaves stale databases behind. Reach for the override when a
clash is actually possible — a second checkout, a concurrent session — and
always before `--create-db`, which is the flag that destroys another run.

## Type Checking

- Strict `mypy` via `mypy.ini` (disallow untyped defs, no implicit optional, etc.)
- Annotate all function signatures, complex variables, and class attributes
- Generated Strawberry types should pass mypy without suppressions
