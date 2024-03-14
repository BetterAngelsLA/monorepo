import os
import uuid

from django.db.models import Model


def get_unique_file_path(instance: Model, filename: str) -> str:
    """
    Generates a unique file path for storing an uploaded file.

    This function creates a unique filename using a UUID, maintaining the original file
    extension, and prepends a specified directory to the filename. It's designed to be
    used as the `upload_to` argument in Django's FileField or ImageField to ensure that
    uploaded files have unique names and are organized within a specific directory in
    the storage backend.

    Parameters:
    - instance (models.Model): The model instance to which the file is being attached.
      This parameter is required by Django for functions used in the `upload_to`
      argument but is not used in this function, allowing it to be generic and reusable
      across different models.
    - filename (str): The original filename of the uploaded file. This name is used to
      extract the file extension to ensure that the generated unique filename retains
      the appropriate file type.

    Returns:
    - str: A string representing the unique path where the uploaded file will be stored.
      This path includes the specified directory ('attachments/') and the generated
      unique filename, ensuring that file uploads do not overwrite existing files and
      are easy to organize.

    Example usage in a Django model:
    ```python
    class MyModel(models.Model):
        file = models.FileField(upload_to=get_unique_file_path)
    ```
    """
    ext = filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join("attachments/", unique_filename)
