from typing import Iterable

from accounts.models import User
from accounts.selectors import resolve_permission_group
from clients.models import ClientProfile
from common.constants import DEFAULT_DOCUMENT_CONTENT_TYPES, DEFAULT_IMAGE_CONTENT_TYPES
from common.models import Attachment
from common.permissions.utils import assign_object_permissions
from common.services import file_upload
from common.services.file_upload import (
    AttachmentUploadConfig,
    UploadRequest,
    UploadConfirmation,
)
from common.services.types import AuthorizedPresignedUploadBatch
from django.conf import settings
from django.db import transaction
from notes.groups import CASEWORKER

# TODO: upload_path="attachments" is too generic — it dates from before the
# shared pipeline existed.  It should be "client_documents" for consistency
# with note_attachments / shelters.  Changing it requires a data migration
# to update existing S3 keys and Attachment.file values in the DB.
CLIENT_DOCUMENT_CONFIG = AttachmentUploadConfig(
    upload_path="attachments",
    service_name="client_document",
    allowed_content_types=DEFAULT_DOCUMENT_CONTENT_TYPES | DEFAULT_IMAGE_CONTENT_TYPES,
    max_file_size=settings.CLIENT_DOCUMENT_MAX_FILE_SIZE,
)


def create_presigned_uploads(
    *,
    user: User,
    uploads: Iterable[UploadRequest],
) -> AuthorizedPresignedUploadBatch:
    """Generate presigned S3 URLs and upload tokens for client documents (Phase 1)."""
    return file_upload.create_presigned_uploads(
        user=user,
        uploads=uploads,
        config=CLIENT_DOCUMENT_CONFIG,
    )


def resolve_upload(
    *,
    user: User,
    client_profile: ClientProfile,
    documents: Iterable[UploadConfirmation],
) -> list[Attachment]:
    """Validate tokens + S3 → create Attachment rows for a client profile (Phase 3).

    Assigns object-level CHANGE + DELETE permissions to the caseworker
    permission group so the uploader can manage the resulting attachments.
    """
    # TODO(org-scoping): Migrate from resolve_permission_group (first-match org)
    # to the X-Organization-ID header pattern (HasOrgPerm + get_current_organization)
    # used by shelters/schema.py.  The client mutations in clients/schema.py already
    # have a similar TODO about this migration.
    permission_group = resolve_permission_group(user, template=CASEWORKER)

    with transaction.atomic():
        attached = file_upload.create_attachment_records(
            user=user,
            content_object=client_profile,
            uploads=documents,
            config=CLIENT_DOCUMENT_CONFIG,
        )

        for att in attached:
            assign_object_permissions(
                permission_group.group,
                att,
                [Attachment.perms.DELETE, Attachment.perms.CHANGE],
            )

    return attached
