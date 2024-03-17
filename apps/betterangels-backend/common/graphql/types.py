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
    #     self, width: Optional[int] = None, height: Optional[int] = None
    # ) -> Optional[ThumbnailType]:
    #     # This is a simplified example. You'd likely have logic to
    #     # actually generate or retrieve a thumbnail URL based on the
    #     # requested dimensions.
    #     if (
    #         self.file_type == FileTypeGraphQL.IMAGE
    #         and width is not None
    #         and height is not None
    #     ):
    #         thumbnail_url = f"{self.file_url}?width={width}&height={height}"
    #         return ThumbnailType(url=thumbnail_url, width=width, height=height)
    #     return None
