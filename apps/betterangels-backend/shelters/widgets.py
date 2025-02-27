import datetime
from datetime import time
from typing import Any, Dict, List, Optional, Sequence, Tuple, Union

from django import forms
from django.contrib.gis.geos import Point
from django.core.exceptions import ValidationError
from django.db import models
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


class TimeRangeWidget(forms.MultiWidget):
    def __init__(self, attrs: Optional[dict] = None) -> None:
        widgets = [
            forms.TimeInput(attrs={"type": "time"}),
            forms.TimeInput(attrs={"type": "time"}),
        ]
        super().__init__(widgets, attrs)

    def decompress(self, value: Optional[Tuple[time, time]]) -> List[Optional[time]]:
        if value:
            return [value[0], value[1]]
        return [None, None]


class TimeRangeFormField(forms.MultiValueField):
    widget = TimeRangeWidget

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        fields = [forms.TimeField(), forms.TimeField()]
        super().__init__(fields, *args, **kwargs)

    def compress(self, data_list: List[Optional[time]]) -> Optional[Tuple[time, time]]:
        if data_list:
            start, end = data_list
            if start is None or end is None:
                raise forms.ValidationError("Both start and end times are required.")
            if end <= start:
                raise forms.ValidationError("End time must be after start time.")
            return (start, end)
        return None


class TimeRangeField(models.Field):
    description = "A field to store a range of times (start and end) as a single string"

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        # You can add additional options here if needed
        super().__init__(*args, **kwargs)

    def db_type(self, connection: Any) -> str:
        # We'll store the range as a string in the database.
        # Adjust the size as needed.
        return "varchar(50)"

    def from_db_value(self, value: Optional[str], expression: Any, connection: Any) -> Optional[Tuple[time, time]]:
        """Convert the string from the database to a Python tuple."""
        if value is None:
            return value
        try:
            start_str, end_str = value.split("-")
            start_time = datetime.datetime.strptime(start_str, "%H:%M:%S").time()
            end_time = datetime.datetime.strptime(end_str, "%H:%M:%S").time()
            return (start_time, end_time)
        except Exception:
            return None

    def to_python(self, value: Union[None, Tuple[time, time], str]) -> Optional[Tuple[time, time]]:
        """Convert the input value into the expected Python data type."""
        if value is None:
            return value
        if isinstance(value, tuple):
            return value
        if isinstance(value, str):
            try:
                start_str, end_str = value.split("-")
                start_time = datetime.datetime.strptime(start_str, "%H:%M:%S").time()
                end_time = datetime.datetime.strptime(end_str, "%H:%M:%S").time()
                return (start_time, end_time)
            except Exception:
                raise ValidationError("Invalid time range format. Expected 'HH:MM:SS-HH:MM:SS'.")
        raise ValidationError("Invalid type for TimeRangeField")

    def get_prep_value(self, value: Optional[Tuple[time, time]]) -> Optional[str]:
        """Convert the Python tuple back into a string for storage."""
        if isinstance(value, tuple):
            start, end = value
            # Format times as HH:MM:SS; adjust if you need a different format.
            return f"{start.strftime('%H:%M:%S')}-{end.strftime('%H:%M:%S')}"
        return value

    def deconstruct(self) -> Tuple[str, str, Sequence[Any], Dict[str, Any]]:
        """Needed for migrations to work correctly."""
        name, path, args, kwargs = super().deconstruct()
        return name, path, args, kwargs

    def formfield(self, **kwargs: Any) -> forms.Field:  # type: ignore
        """Specify the form field and widget to use in forms."""
        defaults = {"form_class": TimeRangeFormField}
        defaults.update(kwargs)
        return super().formfield(**defaults)  # type: ignore
