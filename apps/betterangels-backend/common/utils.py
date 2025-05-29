import mimetypes
import os
import uuid
from pathlib import Path
from urllib.parse import unquote

from django.db.models import Model


def canonicalise_filename(mime_type: str, filename: str) -> str:
    """
    Canonicalise filenames by:
      - Replacing recognized but incorrect extensions
      - Appending extensions when missing or unrecognized
      - Collapsing duplicate known extensions (e.g., '.pdf.pdf' → '.pdf')
    """
    filename = unquote(filename).rstrip(" .")
    desired_ext = mimetypes.guess_extension(mime_type) or ".bin"
    current_mime, _ = mimetypes.guess_type(filename)

    if current_mime == mime_type or filename.lower().endswith(desired_ext):
        return _collapse_known_duplicates(filename)

    path = Path(filename)
    current_ext = path.suffix.lower()

    if current_ext and mimetypes.guess_type(f"x{current_ext}")[0]:
        # Replace existing recognized but incorrect extension
        filename = str(path.with_suffix(desired_ext))
    else:
        # Append extension if missing, numeric, or unrecognized
        filename += desired_ext

    return _collapse_known_duplicates(filename)


def _collapse_known_duplicates(filename: str) -> str:
    """
    Collapse duplicate recognized extensions only
    e.g., 'report.pdf.pdf' → 'report.pdf', but '12.12.12' remains unchanged.
    """
    path = Path(filename)
    suffixes = path.suffixes

    # Reverse suffixes for easy popping from end
    collapsed_suffixes: list[str] = []
    last_seen = None
    for ext in reversed(suffixes):
        ext_lower = ext.lower()
        is_known = mimetypes.guess_type(f"x{ext_lower}")[0] is not None

        if ext_lower == last_seen and is_known:
            continue

        collapsed_suffixes.insert(0, ext)
        last_seen = ext_lower if is_known else None

    # Reconstruct the filename
    stem = path.name[: -sum(len(s) for s in suffixes)] if suffixes else path.name
    return f"{stem}{''.join(collapsed_suffixes)}"


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
