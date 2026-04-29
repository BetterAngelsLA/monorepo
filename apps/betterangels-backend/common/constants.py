CALIFORNIA_ID_REGEX = r"^[a-zA-Z]\d{7}$"
SSN_REGEX = r"^\d{9}$"
EMAIL_REGEX = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
PHONE_NUMBER_REGEX = r"^[2-9]\d{2}[2-9]\d{6}(x\d+)?$"

DEFAULT_IMAGE_CONTENT_TYPES = frozenset(
    {
        "image/bmp",
        "image/gif",
        "image/heic",
        "image/heif",
        "image/jpeg",
        "image/png",
        "image/tiff",
        "image/webp",
    }
)

DEFAULT_DOCUMENT_CONTENT_TYPES = frozenset(
    {
        "application/msword",
        "application/pdf",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/csv",
        "text/plain",
    }
)
HMIS_SESSION_KEY_NAME = "is_hmis_session"
HMIS_AUTH_COOKIE_NAME = "auth_token"
