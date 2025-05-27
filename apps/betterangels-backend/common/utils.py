import mimetypes
import os
import uuid

from django.db.models import Model


def get_filename_with_extension(mime_type: str, filename: str) -> str:
    provided_type, _ = mimetypes.guess_type(filename)
    expected_extension = mimetypes.guess_extension(mime_type)

    if not expected_extension:
        raise ValueError(f"Unsupported MIME type: {mime_type}")

    if provided_type != mime_type:
        filename = f"{os.path.splitext(filename)[0]}{expected_extension}"

    return filename


def get_unique_file_path(instance: Model, filename: str) -> str:
    """
    Generates a unique path for storing an uploaded file by appending a UUID to the
    file's original name, preserving its extension. Designed for use in Django's
    FileField or ImageField 'upload_to' parameter, it ensures each file has a unique
    name and organizes files in the 'attachments/' directory.

    Parameters:
    - instance (models.Model): The model instance the file is attached to. Not used in
      this function, but required for 'upload_to'.
    - filename (str): The original filename, used to keep the file extension.

    Returns:
    - str: The unique file storage path, combining 'attachments/' and the UUID-named
      file.

    Example:
        Use in a Django model to ensure uploaded files are uniquely named and organized.
        file = models.FileField(upload_to=get_unique_file_path)
    """
    ext = filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join("attachments/", unique_filename)
