from typing import Optional, Tuple, Any, List
from django import forms
from django.contrib.gis.geos import Point
from django.utils.translation import gettext_lazy as _


class LatLongWidget(forms.MultiWidget):
    def __init__(self, attrs: Optional[dict] = None) -> None:
        widgets = (forms.TextInput(attrs=attrs),
                   forms.TextInput(attrs=attrs))

        super().__init__(widgets, attrs)

        self.widgets[0].attrs['placeholder'] = _('Latitude')
        self.widgets[1].attrs['placeholder'] = _('Longitude')

    def decompress(self, value: Point) -> Tuple:
        if value:
            return tuple(reversed(value.coords))
        return (None, None)


class LatLongField(forms.MultiValueField):

    widget = LatLongWidget

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        fields = (forms.FloatField(min_value=-90, max_value=90),
                  forms.FloatField(min_value=-180, max_value=180))
        super().__init__(fields, *args, **kwargs)

    def compress(self, data_list: List[float]) -> Optional[str]:
        if data_list:
            point_str = 'POINT(%f %f)' % tuple(reversed(data_list))
            return point_str
        return None
