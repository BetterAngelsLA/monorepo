# Presigned S3 Upload Pipeline

## Architecture Overview

The presigned upload pipeline lets clients upload files directly to S3 without
routing bytes through the Django backend. It uses a three-phase flow:

```
┌─────────────────────────────────────────────────────────────────┐
│ Phase 1: Generate                                               │
│ Client requests presigned URLs → backend validates content type │
│ → generates S3 presigned POST URL + HMAC-signed upload token    │
│ → returns both to client                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Phase 2: Upload                                                 │
│ Client POSTs file directly to S3 using presigned URL            │
│ (no backend involvement — S3 enforces content type + size)      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Phase 3: Resolve                                                │
│ Client sends upload token + S3 key to backend → backend         │
│ validates token (HMAC, expiry, scope) → confirms S3 object      │
│ exists → creates Attachment DB row → assigns permissions        │
└─────────────────────────────────────────────────────────────────┘
```

### Key files

| Layer | File | Role |
|---|---|---|
| Generic pipeline | `common/services/file_upload.py` | Phase 1 & 3 orchestration |
| S3 operations | `common/services/s3.py` | Presigned POST generation, key existence checks |
| Token auth | `common/services/upload_token.py` | Stateless HMAC token create/validate |
| Types | `common/services/types.py` | Dataclasses: config, input/output items |
| Exceptions | `common/services/exceptions.py` | Domain-specific validation errors |
| GraphQL types | `common/graphql/types.py` | Strawberry types for API responses |

---

## Domain Configuration

Each domain instantiates an `AttachmentUploadConfig` with its own upload path,
service name, content-type allowlist, and max file size:

| Domain | Config constant | Upload path | Service name | Content types | Max size |
|---|---|---|---|---|---|
| Shelter photos | `SHELTER_PHOTO_CONFIG` | `shelters` | `shelter_photo` | Images only | `SHELTER_PHOTO_MAX_FILE_SIZE` |
| Client documents | `CLIENT_DOCUMENT_CONFIG` | `attachments` | `client_document` | Docs + images | `CLIENT_DOCUMENT_MAX_FILE_SIZE` |
| Client profile photo | `CLIENT_PROFILE_PHOTO_CONFIG` | `client_profile_photos` | `client_profile_photo` | Images only | `S3_DEFAULT_PRESIGNED_MAX_FILE_SIZE` |
| Note attachments | `NOTE_ATTACHMENT_CONFIG` | `note_attachments` | `note_attachment` | Docs + images | `NOTE_ATTACHMENT_MAX_FILE_SIZE` |

All defaults are 50 MB. Each can be overridden via environment variable.

---

## Token Design

Upload tokens are stateless — no database or cache storage needed.

**Implementation:** Django's `TimestampSigner` (`django.core.signing`) with a
`salt="upload-token"`.

**Token payload (signed + timestamped):**
```json
{
  "key": "media/note_attachments/<uuid>.pdf",
  "user_id": 42,
  "scope": "note_attachment",
  "max_age": 480
}
```

**Validation checks:**
1. HMAC signature is valid (not tampered)
2. `key` matches the expected S3 key
3. `user_id` matches the current user
4. `scope` matches the domain service name
5. Token has not expired (`max_age` = `S3_DEFAULT_PRESIGNED_UPLOAD_EXPIRATION_SECONDS` + 180s grace period)

**Why stateless?** Avoids Valkey/Redis dependency for upload state. A 5-minute
window is short enough that token reuse is not a practical attack vector for
this use case.

---

## S3 Presigned POST Conditions

The presigned POST policy enforces at the S3 level (before any file reaches
the backend):

| Condition | Value |
|---|---|
| `Content-Type` | Must match the declared MIME type |
| `content-length-range` | 1 byte to `max_file_size` (default 50 MB) |
| `starts-with $key` | Must be under the domain's upload path prefix (e.g. `note_attachments/`) |

S3 rejects non-compliant uploads before they complete — no backend cycles
wasted on validation.

---

## Permission Model

Two-level permission model for attachments:

| Level | Permission | Source | Scope |
|---|---|---|---|
| **Model** | `VIEW` | CASEWORKER template | All attachments in the org |
| **Object** | `CHANGE`, `DELETE` | Assigned per-attachment at resolve time | Only attachments the user created |

**Why not object-level VIEW?** The CASEWORKER template already grants
`Attachment.perms.VIEW` at the model level. Any caseworker in the org can see
all attachments. Only the uploading user (and their permission group) can
modify or delete.

**Org scoping:** Note attachments use `note.organization_id` when resolving the
permission group, preventing cross-org access even for users in multiple orgs.
Client documents have a TODO to adopt the same pattern once `ClientProfile` gets
a direct organization FK.

---

## Adding a New Domain

1. **Create the config** in the domain service file:
   ```python
   MY_CONFIG = AttachmentUploadConfig(
       upload_path="my_uploads",
       service_name="my_service",
       allowed_content_types=DEFAULT_IMAGE_CONTENT_TYPES,
       max_file_size=settings.MY_MAX_FILE_SIZE,
   )
   ```

2. **Add env var default** in `settings.py`:
   ```python
   MY_MAX_FILE_SIZE=(int, 50_000_000),
   ```

3. **Implement Phase 1 wrapper:**
   ```python
   def create_presigned_uploads(*, user, uploads):
       return file_upload.create_presigned_uploads(
           user=user, uploads=uploads, config=MY_CONFIG,
       )
   ```

4. **Implement Phase 3 wrapper:**
   ```python
   def resolve_uploads(*, user, content_object, items):
       permission_group = resolve_permission_group(user, ...)
       attached = file_upload.create_attachment_records(
           user=user, content_object=content_object,
           uploads=items, config=MY_CONFIG,
       )
       for att in attached:
           assign_object_permissions(
               permission_group.group, att,
               [Attachment.perms.DELETE, Attachment.perms.CHANGE],
           )
       return attached
   ```

5. **Add GraphQL mutations** — generate and resolve, using the standard
   `HasPerm(Attachment.perms.ADD)` + `PermissionedQuerySet` pattern.

6. **Write tests** — the generic pipeline is already tested; domain tests only
   need to verify correct delegation and permission assignment.
