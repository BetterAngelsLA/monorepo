from typing import Any

from django import forms
from .widgets import LatLongField
from .models import Location


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
