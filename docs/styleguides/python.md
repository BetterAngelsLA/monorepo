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
  `created_at`/`updated_at` and a `PermissionSet` hook. Use `clean()` for
  multi-field validation and Django `Meta.constraints` for database-level checks.
  Keep models lean — push logic to services, queries to selectors.

## Testing

- Use `pytest` with Django (`pytest-django`)
- Test services and selectors as the primary test surface
- Use `factory_boy` for test data; define baker recipes in `tests/baker_recipes.py`
- Use VCR cassettes (`test_utils/vcr_config.py`) for external HTTP calls
- Test files mirror source structure: `tests/test_services.py`, `tests/test_queries.py`

## Type Checking

- Strict `mypy` via `mypy.ini` (disallow untyped defs, no implicit optional, etc.)
- Annotate all function signatures, complex variables, and class attributes
- Generated Strawberry types should pass mypy without suppressions
