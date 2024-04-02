import json
import os
import uuid
from typing import Union

from django.db.models import Model


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


def convert_to_structured_address(
    address_components: Union[str, bytes, bytearray]
) -> dict:
    structured_address = {}
    address_fields = {
        "street_number": "long_name",
        "route": "long_name",
        "locality": "long_name",
        "administrative_area_level_1": "short_name",
        "country": "long_name",
        "postal_code": "long_name",
    }
    components = json.loads(address_components)

    for component in components:
        for field, name_type in address_fields.items():
            if field in component["types"]:
                structured_address[field] = component.get(name_type)

                break

    return structured_address
