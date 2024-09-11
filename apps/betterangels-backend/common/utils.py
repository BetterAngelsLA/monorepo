import os
import threading
import uuid
from typing import Optional

from django.db.models import Model
from django.http import HttpRequest


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


# Create thread-local storage (will be greenlet-local in a gevent environment)
_local = threading.local()


def set_current_request(request: Optional[HttpRequest]) -> None:
    """
    Set the current request object in thread-local (greenlet-local) storage.

    :param request: The current HTTP request or None to clear the storage.
    """
    _local.request = request


def get_current_request() -> Optional[HttpRequest]:
    """
    Get the current request object from thread-local (greenlet-local) storage.

    :return: The current request if set, otherwise None.
    """
    return getattr(_local, "request", None)
