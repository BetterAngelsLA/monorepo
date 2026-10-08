# Decision record — client-document authority (step 3 of the guardian teardown)

**Status:** decided, implemented this round.
**Context:** removing the last `filter_for_user` / `PermissionedQuerySet` reader
(`clients/schema.py` `deleteClientDocument`) and the last guardian write for
attachments (`clients/services/client_document.py`).

## The question

`Attachment` has no org column and its `GenericForeignKey` parent is
inexpressible as a single-valued `org_via` hop, so it cannot be org-scoped by
reach. Two mechanisms could carry its write authority:

1. **`WRITE_OBJECT`** — per-record object grants.  Built in step 2, and the
   reason `Attachment` was whitelisted.
2. **`WRITE_SHARED`** — any holder of the permission anywhere (`can_anywhere`).

## Why OBJECT is the wrong tool here

Object grants express *person-granular* sharing: "this user may edit this one
record."  That is not the rule client documents ever had.  The legacy guardian
rows were written **to the creating org's group**, so their semantics were
org-granular — "the creating org may edit this document" — which is exactly the
shape ADR 0001 §2.5 says must *not* be recreated with per-record grants:

> Org-principal object grants … are therefore forbidden: they make authority
> org-granular — "every current *and future* member of org B with this role edits
> this record" — which is group-held per-record authority, the exact guardian
> shape this ADR deletes.

Choosing OBJECT would therefore force a choice between two wrong outcomes:
grant only the uploader (losing the creating org's authority), or mint an
org-granular grant per document (recreating the forbidden shape).

## Decision

`Attachment.access = Access(write=WRITE_SHARED)`.

Client documents are not a sharing surface.  Their authority mirrors the parent
`ClientProfile`, which is how the whole document API already behaves: the upload
mutations gate on `ClientProfile.perms.CHANGE`, and the document list is a field
on `ClientProfileType` resolved under that profile's `VIEW`.  A caseworker who can
edit a client can edit that client's documents; one who cannot, cannot.  No
per-record grants, no new creation path, and the last guardian reader and writer
both go away.

Consequences, stated rather than discovered later:

- `OBJECT_GRANT_WHITELIST` goes back to empty.  Nothing declares `WRITE_OBJECT`.
  The arm's runtime (predicate, cascade, orphan cleanup) stays — it is tested
  directly — but it has no production consumer, which is the state the arm was
  deliberately left in before (see the #2415 deferral: an arm with no consumer
  should not ship a consumer-shaped surface).
- The scoped `CASEWORKER_ROLE` gains the attachment perms it previously could not
  carry (E005 refused them while `Attachment` declared no scoping).  Its comment
  saying so is now stale and is corrected.
- The client-document mutations fetch through `writable(...)` rather than a
  guardian-filtered queryset, so the fetch *is* the gate (RFC 0002
  §Precondition) instead of an unfiltered fetch followed by a scope check.

## What this does not do

It does not remove `Attachment`'s rows from the read path — the document list is
still authorised by its parent profile, unchanged.  And it does not delete
`guardian` itself: that is step 5, and it still needs the notes/tasks writers and
the `Big*ObjectPermission` models gone first.
