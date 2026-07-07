from typing import Iterable

from accounts.models import User
from accounts.selectors import resolve_permission_group
from clients.models import ClientProfile
from common.constants import DEFAULT_DOCUMENT_CONTENT_TYPES, DEFAULT_IMAGE_CONTENT_TYPES
from common.models import Attachment
from common.permissions.utils import assign_object_permissions
from common.services.attachment_upload import (
    AttachmentUploadConfig,
    GenerateUploadItem,
    ResolveUploadItem,
    create_presigned_uploads as generic_create_presigned_uploads,
    resolve_attachments as generic_resolve_attachments,
)
from common.services.types import AuthorizedPresignedUploadBatch
from django.conf import settings
from notes.groups import CASEWORKER

CLIENT_DOCUMENT_CONFIG = AttachmentUploadConfig(
    upload_path="attachments",
    service_name="client_document",
    allowed_content_types=DEFAULT_DOCUMENT_CONTENT_TYPES | DEFAULT_IMAGE_CONTENT_TYPES,
    max_file_size=settings.CLIENT_DOCUMENT_MAX_FILE_SIZE,
)


def create_presigned_uploads(
    *,
    user: User,
    uploads: Iterable[GenerateUploadItem],
) -> AuthorizedPresignedUploadBatch:
    """Generate presigned S3 URLs and upload tokens for client documents (Phase 1)."""
    return generic_create_presigned_uploads(
        user=user,
        uploads=uploads,
        config=CLIENT_DOCUMENT_CONFIG,
    )


def resolve_upload(
    *,
    user: User,
    client_profile: ClientProfile,
    documents: Iterable[ResolveUploadItem],
) -> list[Attachment]:
    """Validate tokens + S3 → create Attachment rows for a client profile (Phase 3).

    Assigns object-level CHANGE + DELETE permissions to the caseworker
    permission group so the uploader can manage the resulting attachments.
    """
    # TODO(org-scoping): ClientProfile has no direct organization FK.
    # When org-scoping is added to the client model, pass organization_id
    # to resolve_permission_group like notes/services.py does.
    permission_group = resolve_permission_group(user, template=CASEWORKER)

    attached = generic_resolve_attachments(
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
