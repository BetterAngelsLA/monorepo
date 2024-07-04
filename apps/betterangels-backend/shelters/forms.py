from typing import Any

from common.enums import AttachmentType
from common.models import Attachment
from django import forms

from .models import Location, Shelter
from .widgets import LatLongField


class LocationAdminForm(forms.ModelForm):
    class Meta:
        model = Location
        fields = "__all__"

    point = LatLongField()

    # I couldn't figure out another way to make the Point not required.
    # I tried in the widget, field, and directly in the model
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.fields["point"].required = False


class AttachmentForm(forms.ModelForm):
    class Meta:
        model = Attachment
        fields = ["file"]

    def save(self, commit=True):
        instance = super().save(commit=False)
        instance.attachment_type = self.attachment_type
        if self.namespace:
            instance.namespace = self.namespace
        if commit:
            instance.save()
        return instance


class VideoAttachmentForm(AttachmentForm):
    attachment_type = AttachmentType.VIDEO
    namespace = None
