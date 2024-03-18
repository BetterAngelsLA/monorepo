import strawberry
import strawberry_django
from common.models import Attachment
from strawberry import auto


@strawberry.input
class DeleteDjangoObjectInput:
    id: strawberry.ID


@strawberry_django.type(Attachment, is_interface=True)
class AttachmentInterface:
    id: auto
    file: auto
    file_type: auto
    original_filename: auto

    # @strawberry.field
    # def thumbnail(
    #     self, params: ThumbNailTransformEnum
    # ) -> Optional[ThumbnailType]:
    #     # Example for future dynamic thumbnail transformation
    #     pass
