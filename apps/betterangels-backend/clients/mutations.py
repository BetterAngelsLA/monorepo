import strawberry
from common.permissions.enums import AttachmentPermissions
from strawberry_django.mutations import update
from strawberry_django.permissions import HasRetvalPerm

from .types import ClientDocumentType, UpdateClientDocumentInput


@strawberry.type
class Mutation:
    # Mutation to update the filename of an existing client document
    update_client_document: ClientDocumentType = update(
        UpdateClientDocumentInput,
        extensions=[HasRetvalPerm(perms=[AttachmentPermissions.CHANGE])],
    )
