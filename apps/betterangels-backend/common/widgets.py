from django import forms
from s3_file_field.widgets import AdminS3FileInput


class AdminS3FileWidget(AdminS3FileInput):
    """
    Admin widget for S3FileField that replaces the library's minimal JS
    with a custom implementation featuring:
    - A visible progress bar with percentage during upload
    - Support for dynamically-added inline rows ("Add another …")
    """

    @property
    def media(self) -> forms.Media:
        # Intentionally does NOT include the library's widget.js / widget.css
        # so there is no conflict with our custom upload handler.
        return forms.Media(js=["common/js/s3_upload.js"])
