# flake8: noqa
import os
from datetime import date

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "betterangels_backend.settings")
django.setup()

from accounts.groups import GroupTemplateNames
from common.models import Attachment
from common.permissions.enums import AttachmentPermissions
from django.contrib.auth.models import Group
from django.db import transaction
from guardian.shortcuts import assign_perm
from organizations.models import Organization

ORG_NAME = "SELAH Neighborhood Coalition"
CUTOFF_DATE = date(2025, 5, 7)


def grant_missing_perms(dry_run: bool = True) -> None:
    """Grants missing Change Attachment permissions to SELAH users, for docs uploaded on or before May 7, 2025."""
    with transaction.atomic():
        org = Organization.objects.get(name=ORG_NAME)
        group = Group.objects.get(
            permissiongroup__organization=org,
            permissiongroup__template__name=GroupTemplateNames.CASEWORKER,
        )
        uploader_ids = org.users.values_list("id", flat=True)
        docs = (
            Attachment.objects.filter(
                uploaded_by__in=uploader_ids,
                created_at__lte=CUTOFF_DATE,
            )
            .only("id")
            .order_by("id")
        )

        print(
            f"{'[DRY RUN] Would assign' if dry_run else 'Assigning'} {AttachmentPermissions.CHANGE}"
            f"to group {group.name} on {docs.count()} documents uploaded on or before {CUTOFF_DATE}."
        )

        for doc in docs:
            print(f" - Attachment ID {doc.id}")
            if not dry_run:
                assign_perm(AttachmentPermissions.CHANGE, group, doc)


grant_missing_perms(dry_run=True)
