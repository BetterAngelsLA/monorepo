from typing import List, Optional

import strawberry
import strawberry_django
from accounts.types import UserType
from strawberry.file_uploads import Upload
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user

from .models import ImageAttachment, Note
from .types import CreateNoteInput, ImageAttachmentType, NoteType, UpdateNoteInput


@strawberry.type
class Query:
    @strawberry_django.field()
    def notes(self, info: Info) -> List[NoteType]:
        user = get_current_user(info)
        if user.is_authenticated:
            return [
                NoteType(
                    id=note.id,
                    title=note.title,
                    body=note.body,
                    created_at=note.created_at.isoformat(),
                    created_by=UserType(
                        id=note.created_by.id,
                        username=note.created_by.username,
                        email=note.created_by.email,
                    ),
                )
                for note in Note.objects.filter(created_by=user)
            ]
        else:
            return []

    @strawberry_django.field()
    def note(self, id: strawberry.ID, info: Info) -> Optional[NoteType]:
        user = get_current_user(info)
        if user.is_authenticated:
            # Need to figure out types here
            return Note.objects.get(id=id)  # type: ignore
        else:
            return None


@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_note(self, info: Info, input: CreateNoteInput) -> Optional[NoteType]:
        user = get_current_user(info)
        if user.is_authenticated:
            # Need to figure out types here
            return Note.objects.create(
                created_by=user, title=input.title, body=input.body  # type: ignore
            )
        else:
            return None

    @strawberry.mutation
    def update_note(self, info: Info, input: UpdateNoteInput) -> Optional[NoteType]:
        user = get_current_user(info)
        if user.is_authenticated:
            # Need to figure out types here
            note = Note.objects.get(id=input.id)
            note.title = input.title
            note.body = input.body
            note.save()
            return note  # type: ignore
        else:
            return None

    @strawberry.mutation
    def delete_note(
        self,
        info: Info,
        id: strawberry.ID,
    ) -> bool:
        user = get_current_user(info)
        if user.is_authenticated:
            # Need to figure out types here
            note = Note.objects.get(id=id)
            note.delete()
            return True
        else:
            return False

    # @strawberry.mutation
    # def upload_audio(self, file: strawberry.Upload) -> AudioAttachmentType:
    #     # Handle audio upload logic
    #     # ...
    #     pass

    # @strawberry.mutation
    # def upload_document(self, file: strawberry.Upload) -> DocumentAttachmentType:
    #     # Handle document upload logic
    #     # ...
    #     pass

    @strawberry.mutation
    def upload_image(self, file: Upload) -> ImageAttachmentType:
        # Validate that the file is an image
        # Process the image (e.g., create thumbnails, resize)
        image_attachment = ImageAttachment(file=file)
        image_attachment.save()

        return ImageAttachmentType(
            id=image_attachment.id,
            uploaded_at=image_attachment.uploaded_at.isoformat(),
            description=image_attachment.description,
        )

    # @strawberry.mutation
    # def upload_video(self, file: strawberry.Upload) -> VideoAttachmentType:
    #     # Handle video upload logic
    #     # ...
    #     pass
