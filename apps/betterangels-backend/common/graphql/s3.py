"""
GraphQL mutations for direct-to-S3 file uploads using django-s3-file-field.

This module exposes the s3_file_field presigned URL flow as GraphQL mutations,
replacing the need for the REST API endpoints for mobile/SPA clients that
communicate exclusively via GraphQL.

Upload flow:
1. Client calls `createUploadUrl` with field_id, file_name, file_size, content_type
2. Server returns presigned part URLs + upload_id + upload_signature
3. Client uploads file parts directly to S3 using the presigned URLs
4. Client calls `completeUpload` with parts info + upload_signature
5. Server returns a complete_url and body for the client to POST to S3
6. Client POSTs to S3 to finalize the multipart upload
7. Client calls `finalizeUpload` with upload_signature
8. Server verifies the object exists and returns a signed field_value
9. Client uses the field_value in subsequent mutations (e.g. createClientDocument)
"""

from typing import List, Optional

import strawberry
from common.permissions.utils import IsAuthenticated
from django.core import signing

from s3_file_field import _multipart, _registry
from s3_file_field._multipart import ObjectNotFoundError, UploadTooLargeError


def resolve_s3_field_value(field_value: str) -> str:
    """Decode a signed field_value (from finalizeUpload) and return the S3 object key.

    This is the value that should be assigned to an S3FileField on a model instance.
    When a plain string (the object_key) is assigned to an S3FileField, Django treats it
    as the stored name — no file content is saved, which is exactly what we want since
    the file is already in S3.
    """
    try:
        parsed = signing.loads(field_value)
    except signing.BadSignature:
        raise ValueError("Invalid file field value. The upload may have expired.")
    return parsed["object_key"]


@strawberry.type
class PresignedPartType:
    part_number: int
    size: int
    upload_url: str


@strawberry.type
class UploadInitializationResponse:
    object_key: str
    upload_id: str
    parts: List[PresignedPartType]
    upload_signature: str


@strawberry.input
class UploadInitializationInput:
    field_id: str
    file_name: str
    file_size: int
    content_type: str


@strawberry.type
class UploadCompletionResponse:
    complete_url: str
    body: str


@strawberry.input
class TransferredPartInput:
    part_number: int
    size: int
    etag: str


@strawberry.input
class UploadCompletionInput:
    upload_signature: str
    upload_id: str
    parts: List[TransferredPartInput]


@strawberry.type
class UploadFinalizationResponse:
    field_value: str


@strawberry.input
class UploadFinalizationInput:
    upload_signature: str


@strawberry.type
class Mutation:
    @strawberry.mutation(permission_classes=[IsAuthenticated])
    def create_upload_url(self, info: strawberry.types.Info, input: UploadInitializationInput) -> UploadInitializationResponse:
        """Initialize a direct-to-S3 multipart upload and return presigned part URLs."""
        # Validate the field_id
        try:
            field = _registry.get_field(input.field_id)
        except KeyError:
            raise ValueError(f'Invalid field ID: "{input.field_id}".')

        if input.file_size < 1:
            raise ValueError("file_size must be at least 1.")

        # Generate the object key using the field's upload_to
        object_key = field.generate_filename(None, input.file_name)

        try:
            initialization = _multipart.MultipartManager.from_storage(field.storage).initialize_upload(
                object_key,
                input.file_size,
                input.content_type,
            )
        except UploadTooLargeError:
            raise ValueError("Upload size is too large.")

        # Sign field_id + object_key as a session token for this upload
        upload_signature = signing.dumps(
            {
                "field_id": input.field_id,
                "object_key": object_key,
            }
        )

        return UploadInitializationResponse(
            object_key=initialization.object_key,
            upload_id=initialization.upload_id,
            parts=[
                PresignedPartType(
                    part_number=part.part_number,
                    size=part.size,
                    upload_url=part.upload_url,
                )
                for part in initialization.parts
            ],
            upload_signature=upload_signature,
        )

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    def complete_upload(self, info: strawberry.types.Info, input: UploadCompletionInput) -> UploadCompletionResponse:
        """Complete a multipart upload after all parts have been uploaded to S3."""
        try:
            upload_signature_data = signing.loads(input.upload_signature)
        except signing.BadSignature:
            raise ValueError("Invalid upload signature.")

        field = _registry.get_field(upload_signature_data["field_id"])
        object_key = upload_signature_data["object_key"]

        sorted_parts = sorted(
            [
                _multipart.TransferredPart(
                    part_number=p.part_number,
                    size=p.size,
                    etag=p.etag,
                )
                for p in input.parts
            ],
            key=lambda p: p.part_number,
        )

        transferred_parts = _multipart.TransferredParts(
            parts=sorted_parts,
            object_key=object_key,
            upload_id=input.upload_id,
        )

        completed = _multipart.MultipartManager.from_storage(field.storage).complete_upload(
            transferred_parts
        )

        return UploadCompletionResponse(
            complete_url=completed.complete_url,
            body=completed.body,
        )

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    def finalize_upload(self, info: strawberry.types.Info, input: UploadFinalizationInput) -> UploadFinalizationResponse:
        """
        Finalize an upload after the client has completed the S3 multipart upload.

        Returns a signed field_value that can be used in subsequent mutations
        (e.g. createClientDocument) to reference the uploaded file.
        """
        try:
            upload_signature_data = signing.loads(input.upload_signature)
        except signing.BadSignature:
            raise ValueError("Invalid upload signature.")

        field_id = upload_signature_data["field_id"]
        object_key = upload_signature_data["object_key"]

        field = _registry.get_field(field_id)

        # Verify the object exists in S3
        try:
            size = _multipart.MultipartManager.from_storage(field.storage).get_object_size(object_key)
        except ObjectNotFoundError:
            raise ValueError("Object not found. Upload may not have completed.")

        # Return a signed field value that can be passed to model mutations
        field_value = signing.dumps(
            {
                "object_key": object_key,
                "file_size": size,
            }
        )

        return UploadFinalizationResponse(field_value=field_value)
