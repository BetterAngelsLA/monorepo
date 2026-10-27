"""Backfill ``Attachment.upload_org`` from the guardian group rows.

Before this change the only record of "which org owns this client document" was
the object-level CHANGE/DELETE permission assigned to that org's caseworker
``PermissionGroup`` at upload (``resolve_upload`` → ``assign_object_permissions``).
``PermissionGroup`` is a ``Group`` subclass, so ``AttachmentGroupObjectPermission
.group_id`` joins straight to ``PermissionGroup.group_ptr_id`` and its
``organization_id``.

Scope is deliberately narrow:

* **client documents only** — notes and shelter attachments live in the same
  table, but their authority rides the parent row and they were never given an
  uploader org; filling one in would invent a fact.
* **group grants only** — ``resolve_upload`` has only ever written group grants.
  A user-level object grant is not an org record, and resolving it through the
  user's memberships would guess when the user belongs to several orgs.
* **no conflicts** — if two orgs somehow hold the pair on one row, the row is
  left ``NULL`` rather than picking one. A ``NULL`` anchor is unmanageable by any
  org under the cutover gate, which is the safe direction; guessing could hand
  one org's document to another.

Rows created after this migration get the column from ``resolve_upload``; this
only covers history.
"""

from django.db import migrations


def backfill_upload_org(apps, schema_editor):
    Attachment = apps.get_model("common", "Attachment")
    AttachmentGroupObjectPermission = apps.get_model("common", "AttachmentGroupObjectPermission")
    Permission = apps.get_model("auth", "Permission")
    PermissionGroup = apps.get_model("accounts", "PermissionGroup")
    ContentType = apps.get_model("contenttypes", "ContentType")

    client_document_ct = ContentType.objects.filter(app_label="clients", model="clientprofile").first()
    if client_document_ct is None:
        return

    attachment_perms = Permission.objects.filter(
        content_type__app_label="common",
        content_type__model="attachment",
        codename__in=("change_attachment", "delete_attachment"),
    )

    # group (auth.Group pk) → organization
    org_by_group = dict(PermissionGroup.objects.values_list("group_ptr_id", "organization_id"))

    owner_by_attachment: dict[int, int] = {}
    conflicted: set[int] = set()

    rows = AttachmentGroupObjectPermission.objects.filter(permission__in=attachment_perms).values_list(
        "content_object_id", "group_id"
    )
    for attachment_id, group_id in rows.iterator():
        organization_id = org_by_group.get(group_id)
        if organization_id is None:
            continue
        if attachment_id in owner_by_attachment and owner_by_attachment[attachment_id] != organization_id:
            conflicted.add(attachment_id)
        else:
            owner_by_attachment[attachment_id] = organization_id

    for attachment_id in conflicted:
        owner_by_attachment.pop(attachment_id, None)

    document_ids = set(
        Attachment.objects.filter(
            id__in=list(owner_by_attachment),
            content_type=client_document_ct,
        ).values_list("id", flat=True)
    )

    ids_by_org: dict[int, list[int]] = {}
    for attachment_id in document_ids:
        ids_by_org.setdefault(owner_by_attachment[attachment_id], []).append(attachment_id)

    for organization_id, ids in ids_by_org.items():
        Attachment.objects.filter(id__in=ids).update(upload_org_id=organization_id)


class Migration(migrations.Migration):
    dependencies = [
        ("common", "0004_attachment_upload_org"),
        ("accounts", "0007_permission_group_is_a_group"),
        ("contenttypes", "0002_remove_content_type_name"),
    ]

    operations = [
        # Reversal is a no-op: 0004's column is dropped on the way back, and
        # clearing real ownership on a migration rollback would be worse than
        # leaving it (the data is a faithful copy of the guardian rows).
        migrations.RunPython(backfill_upload_org, migrations.RunPython.noop),
    ]
