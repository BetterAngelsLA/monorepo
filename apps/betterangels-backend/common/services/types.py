from typing import TypedDict


class AuthorizedPresignedUpload(TypedDict):
    ref_id: str
    presigned_key: str
    url: str
    fields: dict[str, str]
    upload_token: str


class AuthorizedPresignedUploadBatch(TypedDict):
    uploads: list[AuthorizedPresignedUpload]
