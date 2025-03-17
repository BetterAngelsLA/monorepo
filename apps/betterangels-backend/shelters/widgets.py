import datetime
from typing import Any, Dict, List, Optional, Tuple, Union

from django import forms
from django.contrib.gis.geos import Point
from django.core.exceptions import ValidationError
from django.db import models
from django.forms.utils import flatatt
from django.utils.translation import gettext_lazy as _


class LatLongWidget(forms.MultiWidget):
    def __init__(self, attrs: Optional[dict] = None) -> None:
        widgets = (forms.TextInput(attrs=attrs), forms.TextInput(attrs=attrs))

        super().__init__(widgets, attrs)

        self.widgets[0].attrs["placeholder"] = _("Latitude")
        self.widgets[1].attrs["placeholder"] = _("Longitude")

    def decompress(self, value: Point) -> Tuple:
        if value:
            return tuple(reversed(value.coords))
        return (None, None)


class LatLongField(forms.MultiValueField):
    widget = LatLongWidget

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        fields = (forms.FloatField(min_value=-90, max_value=90), forms.FloatField(min_value=-180, max_value=180))
        super().__init__(fields, *args, **kwargs)

    def compress(self, data_list: List[float]) -> Optional[str]:
        if data_list:
            # User can decline to provide lat and long, but if they provide one they must provide the other
            latitude, longitude = data_list
            if latitude is None and longitude is not None:  # type: ignore
                raise ValidationError(_("Latitude is required"))
            elif longitude is None and latitude is not None:  # type: ignore
                raise ValidationError(_("Longitude is required"))
            point_str = "POINT(%f %f)" % tuple(reversed(data_list))
            return point_str
        return None


class TimeRangeWidget(forms.TextInput):
    template_name: str = "shelters/time_range_widget.html"

    class Media:
        js = ("js/time_widget.js",)
        css = {"all": ("css/time_widget.css")}

    def get_context(self, name: str, value: Any, attrs: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        # Convert the value into a display string if it's a list.
        if value is None:
            display_value = ""
        elif isinstance(value, list):
            display_value = ", ".join(f"{start.strftime('%I:%M%p')}-{end.strftime('%I:%M%p')}" for start, end in value)
        else:
            display_value = value

        # Call the parent to build the default context.
        context = super().get_context(name, display_value, attrs)
        context["widget"]["flat_attrs"] = flatatt(context["widget"]["attrs"])
        # Optionally, add any extra context needed for your custom HTML.
        return context


class TimeRangeFormField(forms.Field):
    widget = TimeRangeWidget

    def to_python(self, value: Any) -> Optional[List[Tuple[datetime.time, datetime.time]]]:
        if not value:
            return []
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            try:
                ranges: List[Tuple[datetime.time, datetime.time]] = []
                # Expect input like: "8:00AM-12:00PM, 1:00PM-5:00PM, 6:00PM-10:00PM"
                for rng in value.split(","):
                    rng = rng.strip()
                    if not rng:
                        continue
                    start_str, end_str = rng.split("-")
                    start_time = datetime.datetime.strptime(start_str.strip(), "%I:%M%p").time()
                    end_time = datetime.datetime.strptime(end_str.strip(), "%I:%M%p").time()
                    if start_time >= end_time:
                        raise forms.ValidationError("Each time range must have a start time before the end time.")
                    ranges.append((start_time, end_time))
                return ranges
            except Exception as e:
                raise forms.ValidationError(
                    "Invalid format for time ranges. Expected format: '8:00AM-12:00PM, 1:00PM-5:00PM, ...'"
                ) from e
        raise forms.ValidationError("Invalid input type for MultiTimeRangeFormField")

    def validate(self, value: Any) -> None:
        super().validate(value)
        for start, end in value:
            if start >= end:
                raise forms.ValidationError("Each time range must have a start time before the end time.")


class TimeRangeField(models.Field):
    description: str = "Stores multiple time ranges as a comma-separated string."

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    def db_type(self, connection: Any) -> str:
        # Use a text field to allow for variable-length storage.
        return "text"

    def from_db_value(
        self, value: Optional[str], expression: Any, connection: Any
    ) -> Optional[List[Tuple[datetime.time, datetime.time]]]:
        if value is None:
            return None
        try:
            ranges: List[Tuple[datetime.time, datetime.time]] = []
            # Expect stored format: "HH:MM:SS-HH:MM:SS,HH:MM:SS-HH:MM:SS,..."
            for rng in value.split(","):
                rng = rng.strip()
                if not rng:
                    continue
                start_str, end_str = rng.split("-")
                start_time = datetime.datetime.strptime(start_str.strip(), "%H:%M:%S").time()
                end_time = datetime.datetime.strptime(end_str.strip(), "%H:%M:%S").time()
                ranges.append((start_time, end_time))
            return ranges
        except Exception as e:
            raise ValidationError("Invalid stored format for MultiTimeRangeField.") from e

    def to_python(
        self, value: Union[None, List[Tuple[datetime.time, datetime.time]], str]
    ) -> Optional[List[Tuple[datetime.time, datetime.time]]]:
        if value is None:
            return None
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            try:
                ranges: List[Tuple[datetime.time, datetime.time]] = []
                for rng in value.split(","):
                    rng = rng.strip()
                    if not rng:
                        continue
                    start_str, end_str = rng.split("-")
                    start_time = datetime.datetime.strptime(start_str.strip(), "%H:%M:%S").time()
                    end_time = datetime.datetime.strptime(end_str.strip(), "%H:%M:%S").time()
                    ranges.append((start_time, end_time))
                return ranges
            except Exception as e:
                raise ValidationError(
                    "Invalid time ranges format. Expected format: 'HH:MM:SS-HH:MM:SS,HH:MM:SS-HH:MM:SS,...'"
                ) from e
        raise ValidationError("Invalid type for MultiTimeRangeField")

    def get_prep_value(self, value: Optional[List[Tuple[datetime.time, datetime.time]]]) -> Optional[str]:
        if value is None:
            return None
        if isinstance(value, list):
            # Convert each tuple into "HH:MM:SS-HH:MM:SS" then join with commas.
            return ",".join(f"{start.strftime('%H:%M:%S')}-{end.strftime('%H:%M:%S')}" for start, end in value)

    def deconstruct(self) -> Tuple[str, str, List[Any], dict]:
        name, path, args, kwargs = super().deconstruct()
        return name, path, args, kwargs  # type: ignore

    def formfield(self, **kwargs: Any) -> forms.Field:  # type: ignore
        defaults: dict = {"form_class": TimeRangeFormField}
        defaults.update(kwargs)
        return super().formfield(**defaults)
