from typing import Any

from common.models import Attachment
from django.forms import ModelForm


class BaseAttachmentForm(ModelForm):
    def __init__(self, *args: Any, **kwargs: Any):
        super().__init__(*args, **kwargs)
        self.initial_file = self.instance.file if self.instance.pk else None

    def save(self, commit: bool = True) -> Attachment:
        new_attachment: Attachment = super().save(commit=commit)

        # If there was an initial file and a new file has been uploaded
        if self.initial_file and self.initial_file != new_attachment.file:
            self.initial_file.delete(save=False)

        return new_attachment


class HeroForm(BaseAttachmentForm):
    def save(self, commit: bool = True) -> Attachment:
        self.instance.namespace = "hero_image"
        return super().save(commit=commit)
