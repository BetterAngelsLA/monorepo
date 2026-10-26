"""The ``Attachment.upload_org`` backfill (``common/0005``).

The migration's only input is the guardian group rows written by
``resolve_upload``, so these tests build exactly that state and then run the
migration function directly rather than through the migration graph.
"""

import importlib
from typing import Any

from django.apps import apps as django_apps
from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from guardian.shortcuts import assign_perm
from model_bakery import baker

from accounts.tests.baker_recipes import organization_recipe
from clients.models import ClientProfile, SocialMediaProfile
from common.enums import AttachmentType
from common.models import Attachment
from common.tests.utils import make_permission_group

MIGRATION = importlib.import_module("common.migrations.0005_backfill_attachment_upload_org")


def _attachment_for(obj: Any, *, namespace: str = "OTHER_CLIENT_DOCUMENT") -> Attachment:
    return Attachment.objects.create(
        file="media/attachments/test.pdf",
        attachment_type=AttachmentType.DOCUMENT,
        mime_type="application/pdf",
        original_filename="test.pdf",
        content_type=ContentType.objects.get_for_model(obj.__class__),
        object_id=obj.id,
        namespace=namespace,
    )


class BackfillAttachmentUploadOrgTest(TestCase):
    def setUp(self) -> None:
        self.org_1 = organization_recipe.make(name="org_1")
        self.org_2 = organization_recipe.make(name="org_2")
        self.client_profile = baker.make(ClientProfile)
        self.document = _attachment_for(self.client_profile)

    def _assign(self, org: Any, attachment: Attachment) -> None:
        group = make_permission_group(organization=org, template_name="Caseworker")
        assign_perm("common.change_attachment", group, attachment)
        assign_perm("common.delete_attachment", group, attachment)

    def test_fills_the_upload_org_from_the_group_grants(self) -> None:
        self._assign(self.org_1, self.document)

        MIGRATION.backfill_upload_org(django_apps, None)

        self.document.refresh_from_db()
        self.assertEqual(self.document.upload_org_id, self.org_1.id)

    def test_leaves_the_row_null_when_two_orgs_hold_the_grants(self) -> None:
        """Guessing would hand one org's document to another; NULL is the safe side."""
        self._assign(self.org_1, self.document)
        self._assign(self.org_2, self.document)
        # Positive control: a second document with a single owner is filled in
        # the same run, so the NULL above is the conflict policy and not an
        # empty migration passing vacuously.
        single_owner_document = _attachment_for(self.client_profile)
        self._assign(self.org_1, single_owner_document)

        MIGRATION.backfill_upload_org(django_apps, None)

        self.document.refresh_from_db()
        self.assertIsNone(self.document.upload_org_id)
        single_owner_document.refresh_from_db()
        self.assertEqual(single_owner_document.upload_org_id, self.org_1.id)

    def test_ignores_attachments_that_are_not_client_documents(self) -> None:
        contact = baker.make(SocialMediaProfile, client_profile=self.client_profile)
        other_attachment = _attachment_for(contact, namespace="NOTE")
        self._assign(self.org_1, other_attachment)
        # Positive control: the same grant on a client document is filled, so
        # the NULL below is the content-type filter in the backfill.
        self._assign(self.org_1, self.document)

        MIGRATION.backfill_upload_org(django_apps, None)

        other_attachment.refresh_from_db()
        self.assertIsNone(other_attachment.upload_org_id)
        self.document.refresh_from_db()
        self.assertEqual(self.document.upload_org_id, self.org_1.id)
