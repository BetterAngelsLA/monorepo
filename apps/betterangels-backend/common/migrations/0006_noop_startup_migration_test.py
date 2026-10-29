"""Temporary no-op migration used to verify startup migrations in ECS.

It has no operations; it exists so the web task has a genuinely pending
migration to apply at startup after the pipeline migration stage was removed.
Delete this file (and the PR that adds it) once the check is done.
"""

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("common", "0005_backfill_attachment_upload_org"),
    ]

    operations: list = []
