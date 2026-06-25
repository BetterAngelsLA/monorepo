# Python / Django Styleguide

**Primary reference:** The backend follows the [HackSoftware Django-Styleguide](https://github.com/HackSoftware/Django-Styleguide).
**When working on backend code, read the full styleguide first.** The summary below is a quick reference —
the canonical rules are in the HackSoftware guide.

## Architecture

- **Services** (`services.py`) — all business logic lives here (not in models or views)
- **Selectors** (`selectors.py`) — read-only queries
- **APIs / serializers** — thin views; delegate logic to services
- **Permission checks** — DRF permission classes + strawberry-django extensions
- **Model structure** — keep models lean; push logic to services, queries to selectors

## Testing

- Use `pytest` with Django test runner
- Test services and selectors independently
- Use factories (factory_boy) for test data

## Type Checking

- Use `mypy` with strict settings (`mypy.ini`)
- Annotate all function signatures and complex variables
