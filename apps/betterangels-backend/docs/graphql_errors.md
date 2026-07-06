# GraphQL Error Handling (Backend)

How the BetterAngels backend returns mutation errors. This document is the canonical reference for understanding the error response shapes the API produces.

---

## Overview

The backend is a **Django + Strawberry** GraphQL server. There are **two distinct error paths**:

| Path                   | Type                          | Where in response                                                      | Managed by                                  |
| ---------------------- | ----------------------------- | ---------------------------------------------------------------------- | ------------------------------------------- |
| **1. `OperationInfo`** | Inside `data.<operationName>` | `data.createShelter: { __typename: "OperationInfo", messages: [...] }` | `strawberry-django` (`_handle_exception`)   |
| **2. `GraphQLError`**  | Top-level `errors[]`          | `data: null, errors: [{ message, extensions }]`                        | `graphql-core` (bypasses strawberry-django) |

---

## 1. Error Path: `OperationInfo` (strawberry-django)

This path converts specific Django exceptions into structured `OperationInfo` payloads inside the `data` key. These types are defined in `strawberry_django/fields/types.py`.

```graphql
type OperationInfo {
  messages: [OperationMessage!]!
}

type OperationMessage {
  code: String # null when no error code is set
  field: String # null when not specific to a field
  kind: OperationMessageKind!
  message: String!
}

enum OperationMessageKind {
  INFO
  WARNING
  ERROR
  PERMISSION
  VALIDATION
}
```

---

### 1.1 How exceptions map to `OperationMessageKind`

#### Source: `strawberry_django/mutations/fields.py`

The core mapping function is `_get_validation_errors`:

```python
def _get_validation_errors(error: Exception):
    if isinstance(error, PermissionDenied):
        kind = OperationMessage.Kind.PERMISSION
    elif isinstance(error, ValidationError):
        kind = OperationMessage.Kind.VALIDATION
    elif isinstance(error, ObjectDoesNotExist):
        kind = OperationMessage.Kind.ERROR
    else:
        kind = OperationMessage.Kind.ERROR

    if isinstance(error, ValidationError) and hasattr(error, "error_dict"):
        # convert field errors
        for field, field_errors in (error.error_dict or {}).items():
            for e in field_errors:
                yield OperationMessage(
                    kind=kind,
                    field=to_camel_case(field) if field != NON_FIELD_ERRORS else None,
                    message=_get_validaton_error_message(e),
                    code=getattr(e, "code", None),
                )
    elif isinstance(error, ValidationError) and hasattr(error, "error_list"):
        # convert non-field errors
        for e in error.error_list or []:
            yield OperationMessage(
                kind=kind,
                message=_get_validaton_error_message(e),
                code=getattr(error, "code", None),
            )
    else:
        msg = getattr(error, "msg", None)
        if msg is None:
            msg = str(error)

        yield OperationMessage(
            kind=kind,
            message=msg,
            code=getattr(error, "code", None),
        )
```

This is called from `_handle_exception`, which only catches three Django exception types:

```python
def _handle_exception(error: Exception):
    if isinstance(error, (ValidationError, PermissionDenied, ObjectDoesNotExist)):
        return OperationInfo(
            messages=list(_get_validation_errors(error)),
        )
    raise error  # anything else re-raises as a raw GraphQL error
```

#### Summary of triggers

| `kind`       | Django Exception                                   | When it happens                                                                                                                                                                                                                                    |
| ------------ | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VALIDATION` | `django.core.exceptions.ValidationError`           | Model `full_clean()` fails (e.g., missing required field, invalid choice). **Field-level** errors have `field` set to the camelCase field name; non-field errors have `field: null`.                                                               |
| `ERROR`      | `django.core.exceptions.ObjectDoesNotExist`        | Entity lookup fails (e.g., `get_by_pk_or_not_found()` returns nothing). Message is typically `"<ModelName> matching ID <pk> could not be found."`                                                                                                  |
| `ERROR`      | Any other caught exception                         | Catch-all within the mutation handler. Any unexpected runtime error becomes `kind: ERROR`.                                                                                                                                                         |
| `PERMISSION` | `django.core.exceptions.PermissionDenied`          | Raised explicitly by service code, or raised when `fail_silently=False` on a permission extension.                                                                                                                                                 |
| `PERMISSION` | `strawberry_django.permissions.DjangoNoPermission` | Raised by permission extensions (`HasPerm`, `HasRetvalPerm`, `HasOrgPerm`, `IsAuthenticated`) when the user lacks required permissions. Converted to `PermissionDenied` by `handle_no_permission()`, which creates `PERMISSION` messages directly. |
| `INFO`       | —                                                  | **Never auto-generated.** Not used anywhere in BetterAngels. Would require a mutation to manually return `OperationInfo(messages=[OperationMessage(kind=INFO, ...)])`.                                                                             |
| `WARNING`    | —                                                  | **Never auto-generated.** Same as `INFO` — not used in BetterAngels.                                                                                                                                                                               |

---

### 1.2 When is the `field` property populated?

Understanding when `OperationMessage.field` is `null` vs. a string is critical for building correct error-handling UIs. The rules come directly from `_get_validation_errors` above:

| `kind`             | `field` populated? | Details                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `VALIDATION`       | ✅ Sometimes       | **Yes** when the `ValidationError` has an `error_dict` (per-field errors). Django's `full_clean()` produces this when individual model fields fail validation, e.g. `{"firstName": ["This field is required."]}` → `field: "firstName"`. Note: the special key `NON_FIELD_ERRORS` (`__all__`) is converted to `field: null`.                                             |
| `VALIDATION`       | ❌ Sometimes       | **No** when the `ValidationError` has an `error_list` (non-field / global errors). These are form-level errors like "The entire form is invalid" with no single field to blame.                                                                                                                                                                                          |
| `ERROR`            | ❌ Never           | `ObjectDoesNotExist` and catch-all exceptions go through the `else` branch — `field` is never passed, always defaults to `null`.                                                                                                                                                                                                                                         |
| `PERMISSION`       | ❌ Usually not     | When flowing through `_handle_exception` (the `PermissionDenied` → `_get_validation_errors` path), `field` is `null`.                                                                                                                                                                                                                                                    |
| `PERMISSION`       | ✅ Sometimes       | When flowing through the **separate** `handle_no_permission()` path in `strawberry_django/permissions.py`, `field` is set to `info.field_name` (the GraphQL field name). This happens when `fail_silently=True` and the return type union includes `OperationInfo`. This path is **not commonly hit** in BetterAngels since `HasOrgPerm` defaults `fail_silently=False`. |
| `INFO` / `WARNING` | ❌ Never           | These are never auto-generated. If manually created, `field` defaults to `null` unless explicitly set.                                                                                                                                                                                                                                                                   |

**In practice for BetterAngels:**

- `ERROR` messages never have `field` set
- `PERMISSION` messages from `HasOrgPerm` (which uses `fail_silently=False`) flow through `_handle_exception` and have `field: null`
- Non-field `VALIDATION` messages have `field: null`

---

### 1.3 How mutations get wrapped

The `@strawberry_django.mutation` decorator defaults `handle_django_errors=True` (controlled by Django setting `STRAWBERRY_DJANGO.MUTATIONS_DEFAULT_HANDLE_ERRORS`). This causes the framework to:

1. Auto-wrap every mutation return type in a union with `OperationInfo` (e.g., `ShelterType | OperationInfo`), visible in `schema.graphql` as `CreateShelterPayload = ShelterType | OperationInfo`.
2. Catch `ValidationError`, `PermissionDenied`, and `ObjectDoesNotExist` inside `get_result()` and convert them to `OperationInfo` responses.
3. Re-raise any other exception as a raw GraphQL error.

**Mutations that do not use `@strawberry_django.mutation`** (e.g., custom `@strawberry.mutation` decorators) will **not** get this wrapping and will surface exceptions as raw GraphQL errors instead.

---

### 1.4 Permission handling (separate path)

In addition to the mutation-level `_handle_exception`, Strawberry's permission extensions have their own error path:

1. The extension raises `DjangoNoPermission`.
2. `DjangoPermissionExtension.resolve()` catches it and calls `handle_no_permission()`.
3. `handle_no_permission()` checks if the return type union includes `OperationInfo`. If so, it returns an `OperationInfo` with a `PERMISSION` message directly (bypassing `_handle_exception`). The `field` is set to `info.field_name` — the name of the GraphQL mutation field.
4. If `fail_silently=False` (the **default** for `HasOrgPerm` in BetterAngels, set in `accounts/extensions.py`), it instead raises `PermissionDenied`, which flows into `_handle_exception` and produces `kind: PERMISSION` with `field: null`.

#### Permission extensions used in BetterAngels

| Extension         | Defined in                     | Used for                                                   | `fail_silently` default   |
| ----------------- | ------------------------------ | ---------------------------------------------------------- | ------------------------- |
| `HasOrgPerm`      | `accounts/extensions.py`       | Org-scoped mutations (shelters, beds, rooms, reservations) | `False`                   |
| `HasRetvalPerm`   | `strawberry_django` (built-in) | Object-level mutations (notes, tasks, referrals)           | `True` (built-in default) |
| `HasPerm`         | `strawberry_django` (built-in) | Create mutations (clients, documents)                      | `True` (built-in default) |
| `IsAuthenticated` | `strawberry_django` (built-in) | All mutations                                              | `True` (built-in default) |

---

## 2. Error Path: `GraphQLError` (custom validation)

`GraphQLError` is from the **`graphql-core`** library (`from graphql import GraphQLError`) — the underlying Python GraphQL implementation. It is **not** part of strawberry-django and produces a fundamentally different response shape. It **bypasses** `_handle_exception` entirely (which only catches `ValidationError`, `PermissionDenied`, `ObjectDoesNotExist`).

### 2.1 Response shape

When a mutation raises `GraphQLError`, the client receives a **raw GraphQL error at the top level** with `data: null`:

```json
{
  "data": null,
  "errors": [
    {
      "message": "Validation Errors",
      "extensions": {
        "errors": [
          { "field": "email", "location": null, "errorCode": "EMAIL_INVALID" },
          { "field": "californiaId", "location": null, "errorCode": "CA_ID_INVALID" },
          { "field": "phoneNumbers", "location": "0__number", "errorCode": "PHONE_NUMBER_INVALID" }
        ]
      }
    }
  ]
}
```

### 2.2 Contrast with `OperationInfo`

|                                | `GraphQLError`                | `OperationInfo`                                             |
| ------------------------------ | ----------------------------- | ----------------------------------------------------------- |
| Library                        | `graphql-core`                | `strawberry-django`                                         |
| Where in response              | Top-level `errors[]`          | Inside `data.<operationName>`                               |
| `data` value                   | `null`                        | Contains `{ __typename: "OperationInfo", messages: [...] }` |
| Caught by `_handle_exception`? | ❌ No — bypasses it entirely  | ✅ Yes                                                      |
| Structure                      | `message` + `extensions` dict | `messages[]` with `kind`, `field`, `message`, `code`        |

### 2.3 Where is `GraphQLError` used?

#### `clients/schema.py` — client profile validation

The `validate_client_profile_data` function (called in `create_client_profile` and `update_client_profile`) performs custom business-rule validation:

```python
# clients/schema.py
from graphql import GraphQLError

def validate_client_profile_data(data: dict) -> None:
    errors: list = []

    errors += validate_name(data)          # at least one name field required
    errors += validate_email(...)           # regex + uniqueness check
    errors += validate_california_id(...)   # regex + uniqueness check
    errors += validate_contacts(...)        # phone number format
    errors += validate_hmis_profiles(...)   # hmis_id presence + uniqueness
    errors += validate_phone_numbers(...)   # phone number format

    if errors:
        raise GraphQLError("Validation Errors", extensions={"errors": errors})
```

The flow:

```
Mutation resolver
  → validate_client_profile_data(data)
    → builds list of {field, location, errorCode} dicts
    → raises GraphQLError("Validation Errors", extensions={"errors": [...]})
  → strawberry-django's _handle_exception does NOT catch GraphQLError
  → error propagates to graphql-core
  → client gets data: null + errors: [{message, extensions: {errors: [...]}}]
```

#### `common/errors.py` — reusable error classes

```python
from graphql import GraphQLError

class UnauthenticatedGQLError(GraphQLError):
    def __init__(self, message=None):
        super().__init__(
            message or "You must be logged in to perform this action.",
            extensions={"code": "UNAUTHENTICATED", "http": {"status": 401}},
        )

class NotFoundGQLError(GraphQLError):
    def __init__(self, message=None):
        super().__init__(
            message or "Not Found.",
            extensions={"code": "NOT_FOUND", "http": {"status": 404}},
        )
```

Used in:

- `common/permissions/utils.py` — `IsAuthenticated.has_permission()` raises `UnauthenticatedGQLError` when the user is not logged in
- `hmis/api_bridge.py` — `_handle_error_response()` raises `UnauthenticatedGQLError` for HMIS 401 responses and `NotFoundGQLError` for HMIS 404 responses

#### `hmis/api_bridge.py` — HMIS proxy validation errors

When the upstream HMIS API returns a 422, the proxy maps their `messages` dict into the same `{field, location, errorCode, message}` shape:

```python
raise GraphQLError("Validation Errors", extensions={"errors": errors})
```

### 2.4 The `ErrorCodeEnum`

Custom validation errors use `ErrorCodeEnum` (defined in `clients/enums.py`) to provide **machine-readable error codes** that the frontend can switch on:

```python
class ErrorCodeEnum(models.TextChoices):
    CA_ID_INVALID = "ca_id_invalid", _("California ID invalid")
    CA_ID_IN_USE = "ca_id_in_use", _("California ID is already in use")
    EMAIL_INVALID = "email_invalid", _("Email invalid")
    EMAIL_IN_USE = "email_in_use", _("Email is already in use")
    HMIS_ID_IN_USE = "hmis_id_in_use", _("HMIS ID is already in use")
    HMIS_ID_NOT_PROVIDED = "hmis_id_not_provided", _("HMIS ID not provided")
    NAME_NOT_PROVIDED = "name_not_provided", _("Name not provided")
    PHONE_NUMBER_INVALID = "phone_number_invalid", _("Phone number invalid")
```

**Why use error codes instead of `ValidationError` + `OperationInfo`?**

| Approach                                     | Pros                                                                                                                                     | Cons                                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `ValidationError` → `OperationInfo` (path 1) | Automatic, framework-managed                                                                                                             | `field` only supports flat field names; no error-type discrimination |
| `GraphQLError` + `ErrorCodeEnum` (path 2)    | Machine-readable error codes; supports nested `location` (e.g. `phoneNumbers.0.number`); custom business logic (e.g., uniqueness checks) | Error shape is custom                                                |

The `location` field supports dot-path or dunder-path notation for nested errors:

```json
{ "field": "phoneNumbers", "location": "0__number", "errorCode": "PHONE_NUMBER_INVALID" }
```

This allows pinpointing a specific item within a list field, which flat `OperationMessage.field` cannot express.

### 2.5 Exception reference

Every exception type used in the BetterAngels backend, the error path each takes, and the response shape produced.

| Exception                 | Source                                      | Used in                                                                                                         | Caught by `_handle_exception`?                 | Response `data`                                 | Response `errors[0]` shape                                              |
| ------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------- |
| `ValidationError`         | `django.core.exceptions`                    | Model `full_clean()`, strawberry-django create/update resolvers                                                 | ✅ Yes (→ `OperationInfo`, `kind: VALIDATION`) | Contains `OperationInfo`                        | —                                                                       |
| `ObjectDoesNotExist`      | `django.core.exceptions`                    | `get_by_pk_or_not_found()`, `.get()` on scoped querysets                                                        | ✅ Yes (→ `OperationInfo`, `kind: ERROR`)      | Contains `OperationInfo`                        | —                                                                       |
| `PermissionDenied`        | `django.core.exceptions`                    | `accounts/schema.py`, `referrals/schema.py`, `tasks/schema.py`, `hmis/api_bridge.py`, `common/graphql/utils.py` | ✅ Yes (→ `OperationInfo`, `kind: PERMISSION`) | Contains `OperationInfo`                        | —                                                                       |
| `DjangoNoPermission`      | `strawberry_django.permissions`             | Permission extensions (`HasPerm`, `HasRetvalPerm`, `HasOrgPerm`, `IsAuthenticated`)                             | ❌ No — caught by `handle_no_permission()`     | Contains `OperationInfo` (if union supports it) | —                                                                       |
| `GraphQLError`            | `graphql-core`                              | `clients/schema.py`, `hmis/api_bridge.py`                                                                       | ❌ No                                          | `null`                                          | `{message, extensions: {errors: [...]}}`                                |
| `UnauthenticatedGQLError` | `common/errors.py` (extends `GraphQLError`) | `common/permissions/utils.py` (`IsAuthenticated`), `hmis/api_bridge.py` (401)                                   | ❌ No                                          | `null`                                          | `{message, extensions: {code: "UNAUTHENTICATED", http: {status: 401}}}` |
| `NotFoundGQLError`        | `common/errors.py` (extends `GraphQLError`) | `hmis/api_bridge.py` only (404)                                                                                 | ❌ No                                          | `null`                                          | `{message, extensions: {code: "NOT_FOUND", http: {status: 404}}}`       |
| `PermissionError`         | Python `builtins` (OS-level)                | `accounts/schema.py`, `accounts/selectors.py`, `clients/schema.py`, `hmis/schema.py`                            | ❌ No                                          | `null`                                          | `{message: "..."}` (plain, no extensions)                               |
| `ValueError`              | Python `builtins`                           | `clients/services/` (upload token validation, file not found)                                                   | ❌ No                                          | `null`                                          | `{message: "..."}` (plain, no extensions)                               |

**Note:** `PermissionError` is a Python OS-level exception (`OSError` subclass), not Django's `PermissionDenied`. Its use in `clients/schema.py` and `accounts/schema.py` for application-level authorization is likely a bug — it should be `PermissionDenied`, which would flow through `_handle_exception` → `OperationInfo` with `kind: PERMISSION`.

#### HMIS proxy error mapping (`hmis/api_bridge.py`)

The `_handle_error_response` method maps upstream HTTP status codes to exceptions:

| HMIS status | Exception raised                                                  |
| ----------- | ----------------------------------------------------------------- |
| 200         | (success)                                                         |
| 401         | `UnauthenticatedGQLError`                                         |
| 403         | `PermissionDenied` (Django)                                       |
| 404         | `NotFoundGQLError`                                                |
| 422         | `GraphQLError("Validation Errors", extensions={"errors": [...]})` |

---

## Related files

| File                                                     | Purpose                                                                                           |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `strawberry_django/fields/types.py`                      | Defines `OperationInfo`, `OperationMessage`, `OperationMessage.Kind`                              |
| `strawberry_django/mutations/fields.py`                  | `_get_validation_errors()`, `_handle_exception()`, `DjangoMutationBase.get_result()`              |
| `strawberry_django/permissions.py`                       | `DjangoPermissionExtension.handle_no_permission()`, `HasPerm`, `HasRetvalPerm`, `IsAuthenticated` |
| `apps/betterangels-backend/accounts/extensions.py`       | `HasOrgPerm` — BetterAngels' org-scoped permission extension                                      |
| `apps/betterangels-backend/common/graphql/extensions.py` | `PermissionedQuerySet` — injects permission-filtered querysets                                    |
| `apps/betterangels-backend/common/errors.py`             | `UnauthenticatedGQLError`, `NotFoundGQLError` — reusable `GraphQLError` subclasses                |
| `apps/betterangels-backend/clients/schema.py`            | `validate_client_profile_data()` — custom validation raising `GraphQLError`                       |
| `apps/betterangels-backend/clients/enums.py`             | `ErrorCodeEnum` — machine-readable error codes for custom validation                              |
| `apps/betterangels-backend/hmis/api_bridge.py`           | HMIS proxy — raises `GraphQLError` for upstream 422 responses                                     |
| `apps/betterangels-backend/schema.graphql`               | Generated schema showing all payload unions with `OperationInfo`                                  |
